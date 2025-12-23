import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[process-queue] Starting message queue processing');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    // Buscar mensagens pendentes agendadas para agora ou antes
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .lt('retry_count', 3)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('[process-queue] Error fetching pending messages:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch pending messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log('[process-queue] No pending messages to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-queue] Found ${pendingMessages.length} pending messages`);

    // Buscar instância conectada
    const AUTHORIZED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL'];
    
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status')
      .eq('status', 'open')
      .in('instance_name', AUTHORIZED_INSTANCES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!instance) {
      console.log('[process-queue] No connected instance available, rescheduling all');
      
      // Reagendar todas as mensagens para 5 minutos depois
      for (const msg of pendingMessages) {
        await supabase
          .from('message_queue')
          .update({
            scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            error_message: 'No connected instance available'
          })
          .eq('id', msg.id);
      }
      
      return new Response(
        JSON.stringify({ success: true, processed: 0, rescheduled: pendingMessages.length }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-queue] Using instance: ${instance.instance_name}`);

    let processed = 0;
    let failed = 0;

    for (const msg of pendingMessages) {
      console.log(`[process-queue] Processing message ${msg.id} to ${msg.contact_phone}`);
      
      try {
        // Marcar como processando
        await supabase
          .from('message_queue')
          .update({ status: 'processing' })
          .eq('id', msg.id);

        // Formatar número
        const recipientJid = msg.contact_phone.includes('@') 
          ? msg.contact_phone 
          : `${msg.contact_phone}@s.whatsapp.net`;

        let response: Response;
        let endpoint: string;
        let body: Record<string, any>;

        if (msg.message_type === 'text' || !msg.media_url) {
          endpoint = `/message/sendText/${instance.instance_name}`;
          body = { number: recipientJid, text: msg.content };
        } else {
          endpoint = `/message/sendMedia/${instance.instance_name}`;
          body = {
            number: recipientJid,
            mediatype: msg.message_type,
            media: msg.media_url,
            caption: msg.content
          };
        }

        response = await fetch(`${evolutionUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify(body),
        });

        const responseText = await response.text();

        if (response.ok) {
          console.log(`[process-queue] Message ${msg.id} sent successfully`);
          
          // Parse response para extrair messageId
          let messageId: string | undefined;
          try {
            const responseData = JSON.parse(responseText);
            messageId = responseData?.key?.id || responseData?.messageId || responseData?.id;
          } catch {}
          
          // Marcar como enviado
          await supabase
            .from('message_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              error_message: null
            })
            .eq('id', msg.id);
          
          // Atualizar metadata da mensagem original se houver conversation_id
          if (msg.conversation_id && messageId) {
            // Buscar última mensagem do agente nessa conversa
            const { data: lastMessage } = await supabase
              .from('messages')
              .select('id, metadata')
              .eq('conversation_id', msg.conversation_id)
              .eq('sender_type', 'agent')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (lastMessage) {
              const currentMetadata = (lastMessage.metadata as Record<string, any>) || {};
              await supabase
                .from('messages')
                .update({
                  metadata: {
                    ...currentMetadata,
                    whatsappMessageId: messageId,
                    whatsappSentAt: new Date().toISOString(),
                    whatsappStatus: 'sent',
                    retriedFromQueue: true
                  }
                })
                .eq('id', lastMessage.id);
            }
          }
          
          processed++;
        } else {
          console.error(`[process-queue] Message ${msg.id} failed:`, responseText);
          
          const newRetryCount = (msg.retry_count || 0) + 1;
          const isFinalFailure = newRetryCount >= 3;
          
          // Atualizar com erro e reagendar
          await supabase
            .from('message_queue')
            .update({
              status: isFinalFailure ? 'failed' : 'pending',
              retry_count: newRetryCount,
              error_message: responseText.substring(0, 500),
              scheduled_at: isFinalFailure ? null : new Date(Date.now() + Math.pow(2, newRetryCount) * 60 * 1000).toISOString()
            })
            .eq('id', msg.id);
          
          failed++;
        }
      } catch (error) {
        console.error(`[process-queue] Error processing message ${msg.id}:`, error);
        
        const newRetryCount = (msg.retry_count || 0) + 1;
        
        await supabase
          .from('message_queue')
          .update({
            status: newRetryCount >= 3 ? 'failed' : 'pending',
            retry_count: newRetryCount,
            error_message: error.message,
            scheduled_at: new Date(Date.now() + Math.pow(2, newRetryCount) * 60 * 1000).toISOString()
          })
          .eq('id', msg.id);
        
        failed++;
      }
    }

    console.log(`[process-queue] Completed: ${processed} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, processed, failed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-queue] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
