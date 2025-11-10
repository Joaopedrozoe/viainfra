import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { conversation_id, message_content } = await req.json();

    if (!conversation_id || !message_content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending WhatsApp message for conversation:', conversation_id);

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
    console.log('Buscando instância WhatsApp para company_id:', conversation.company_id);
    
    let { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status, company_id')
      .eq('company_id', conversation.company_id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Se não encontrar instância da empresa, buscar qualquer instância conectada
    if (!instance) {
      console.log('Nenhuma instância encontrada para a empresa, buscando qualquer instância conectada...');
      const { data: anyInstance, error: anyError } = await supabase
        .from('whatsapp_instances')
        .select('instance_name, status, company_id')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      instance = anyInstance;
      instanceError = anyError;
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

    const response = await fetch(`${evolutionUrl}/message/sendText/${instance.instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: recipientJid,
        text: message_content,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Evolution API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message', details: errorText }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp message sent successfully');

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
