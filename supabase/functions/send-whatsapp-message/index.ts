import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename?: string;
  mimeType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Send WhatsApp message request received');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { conversation_id, message_content, attachment, agent_name } = await req.json();

    if (!conversation_id || (!message_content && !attachment)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (need message_content or attachment)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar mensagem com identificação do atendente em negrito
    const formattedMessage = message_content 
      ? `*${agent_name || 'Atendente'}*\n${message_content}`
      : message_content;

    console.log('Sending WhatsApp message for conversation:', conversation_id, {
      hasText: !!message_content,
      hasAttachment: !!attachment,
      attachmentType: attachment?.type,
      agentName: agent_name
    });

    // Buscar conversa com metadata
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, contacts(*)')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é canal WhatsApp
    if (conversation.channel !== 'whatsapp') {
      console.log('Not a WhatsApp conversation, skipping');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Not WhatsApp' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar o destinatário: usar telefone se disponível, senão usar remoteJid
    let recipientJid: string;
    
    if (conversation.contacts?.phone) {
      // Se temos o telefone, usar formato WhatsApp tradicional
      recipientJid = `${conversation.contacts.phone}@s.whatsapp.net`;
      console.log(`Using contact phone: ${conversation.contacts.phone} -> ${recipientJid}`);
    } else {
      // Caso contrário, usar remoteJid do metadata (para canais @lid, etc)
      recipientJid = conversation.metadata?.remoteJid;
      if (!recipientJid) {
        console.error('No phone or remoteJid found for this conversation');
        return new Response(
          JSON.stringify({ error: 'No WhatsApp identifier found' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log(`Using remoteJid from metadata: ${recipientJid}`);
    }

    // Buscar instância WhatsApp conectada (status 'open' = conectada)
    // IMPORTANTE: Usar apenas instâncias com o número autorizado (5511940027215)
    const AUTHORIZED_PHONE = '5511940027215';
    
    console.log('Buscando instância WhatsApp para company_id:', conversation.company_id);
    
    let { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status, company_id, phone_number')
      .eq('company_id', conversation.company_id)
      .eq('status', 'open')
      .eq('phone_number', AUTHORIZED_PHONE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Se não encontrar instância da empresa, buscar instância autorizada conectada
    if (!instance) {
      console.log('Nenhuma instância encontrada para a empresa, buscando instância autorizada...');
      const { data: authorizedInstance, error: authError } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status, company_id, phone_number')
        .eq('status', 'open')
        .eq('phone_number', AUTHORIZED_PHONE)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      instance = authorizedInstance;
      instanceError = authError;
    }
    
    // Log de segurança
    if (instance && instance.phone_number !== AUTHORIZED_PHONE) {
      console.error('⚠️ SEGURANÇA: Instância com número não autorizado bloqueada:', instance.phone_number);
      return new Response(
        JSON.stringify({ error: 'Instância WhatsApp não autorizada' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (instanceError || !instance) {
      console.error('Error fetching WhatsApp instance:', instanceError);
      console.error('Instance data:', instance);
      return new Response(
        JSON.stringify({ error: 'No connected WhatsApp instance found', details: instanceError }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Instância WhatsApp encontrada:', instance.instance_name, 'Status:', instance.status);
    console.log(`Sending message to ${recipientJid} via instance ${instance.instance_name}`);

    // Enviar mensagem via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    let response: Response;

    // Se temos um anexo, enviar mídia
    if (attachment) {
      const attachmentData = attachment as Attachment;
      console.log('📎 Sending media message:', attachmentData.type, attachmentData.url);

      let endpoint = '';
      let body: Record<string, any> = {
        number: recipientJid,
      };

      // Formatar caption com nome do atendente para mídias
      const mediaCaption = message_content 
        ? `*${agent_name || 'Atendente'}*\n${message_content}`
        : `*${agent_name || 'Atendente'}*`;

      switch (attachmentData.type) {
        case 'image':
          endpoint = `/message/sendMedia/${instance.instance_name}`;
          body = {
            ...body,
            mediatype: 'image',
            media: attachmentData.url,
            caption: mediaCaption,
          };
          break;
        case 'video':
          endpoint = `/message/sendMedia/${instance.instance_name}`;
          body = {
            ...body,
            mediatype: 'video',
            media: attachmentData.url,
            caption: mediaCaption,
          };
          break;
        case 'audio':
          endpoint = `/message/sendWhatsAppAudio/${instance.instance_name}`;
          body = {
            ...body,
            audio: attachmentData.url,
          };
          break;
        case 'document':
          endpoint = `/message/sendMedia/${instance.instance_name}`;
          body = {
            ...body,
            mediatype: 'document',
            media: attachmentData.url,
            fileName: attachmentData.filename || 'document',
            caption: mediaCaption,
          };
          break;
        default:
          // Fallback to text
          endpoint = `/message/sendText/${instance.instance_name}`;
          body = {
            number: recipientJid,
            text: formattedMessage || '[Arquivo]',
          };
      }

      console.log('📤 Evolution API request:', endpoint, JSON.stringify(body));

      response = await fetch(`${evolutionUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify(body),
      });

      // Se falhar com mídia e temos texto, tentar enviar só o texto
      if (!response.ok && message_content) {
        console.warn('⚠️ Media send failed, trying text-only fallback');
        response = await fetch(`${evolutionUrl}/message/sendText/${instance.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: recipientJid,
            text: formattedMessage,
          }),
        });
      }
    } else {
      // Enviar apenas texto com identificação do atendente
      response = await fetch(`${evolutionUrl}/message/sendText/${instance.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          number: recipientJid,
          text: formattedMessage,
        }),
      });
    }

    // Handle failed messages with retry queue
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', response.status, errorText);
      
      // Add to retry queue
      const contactPhone = conversation.contacts?.phone || recipientJid.replace('@s.whatsapp.net', '');
      const { error: queueError } = await supabase
        .from('message_queue')
        .insert({
          conversation_id,
          contact_phone: contactPhone,
          instance_name: instance.instance_name,
          content: formattedMessage || '',
          message_type: attachment ? attachment.type : 'text',
          media_url: attachment?.url || null,
          status: 'failed',
          retry_count: 1,
          error_message: errorText.substring(0, 500),
          scheduled_at: new Date(Date.now() + 60000).toISOString() // Retry in 1 minute
        });
      
      if (queueError) {
        console.error('Error adding to retry queue:', queueError);
      } else {
        console.log('📥 Message added to retry queue');
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send WhatsApp message', 
          details: errorText,
          queued: !queueError,
          message: queueError ? 'Message not queued' : 'Message queued for retry'
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ WhatsApp message sent successfully');

    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
