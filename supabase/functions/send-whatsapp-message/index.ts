import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename?: string;
  mimeType?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  queued?: boolean;
}

function isAllowedInstance(name: string): boolean {
  const upper = name.toUpperCase();
  return upper.includes('VIAINFRA') || upper.includes('VIALOGISTIC');
}

async function resolveAuthorizedInstanceForConversation(supabase: any, conversationId?: string) {
  if (!conversationId) return { instanceName: '', error: 'Missing conversation_id' };

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('company_id')
    .eq('id', conversationId)
    .single();

  if (conversationError || !conversation?.company_id) {
    return { instanceName: '', error: 'Conversation company not found' };
  }

  const { data: instance, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('instance_name, company_id')
    .eq('company_id', conversation.company_id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (instanceError || !instance) {
    return { instanceName: '', error: 'No connected WhatsApp instance found' };
  }

  if (instance.company_id !== conversation.company_id || !isAllowedInstance(instance.instance_name)) {
    return { instanceName: '', error: 'Unauthorized WhatsApp instance for conversation' };
  }

  return { instanceName: instance.instance_name, error: null };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[send-whatsapp] Request received');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    
    // Handle message update action (edit message on WhatsApp)
    if (body.action === 'updateMessage') {
      return await handleUpdateMessage(body);
    }
    
    // Handle message delete action (delete message for everyone on WhatsApp)
    if (body.action === 'deleteMessage') {
      return await handleDeleteMessage(body);
    }
    
    const { conversation_id, message_content, attachment, agent_name, message_id, quoted } = body;

    if (!conversation_id || (!message_content && !attachment)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields (need message_content or attachment)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Debug detalhado do quoted para diagnóstico
    console.log('[send-whatsapp] Quoted data received:', quoted ? JSON.stringify(quoted) : 'undefined');
    console.log('[send-whatsapp] Quoted messageId:', quoted?.messageId || 'MISSING');
    console.log('[send-whatsapp] Quoted isFromAgent:', quoted?.isFromAgent);
    console.log('[send-whatsapp] Will send with quoted:', !!(quoted?.messageId));

    // Formatar mensagem com identificação do atendente em negrito
    const formattedMessage = message_content 
      ? `*${agent_name || 'Atendente'}*\n${message_content}`
      : message_content;

    console.log('[send-whatsapp] Processing:', {
      conversation_id,
      message_id,
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
      console.error('[send-whatsapp] Error fetching conversation:', convError);
      return new Response(
        JSON.stringify({ success: false, error: 'Conversation not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é canal WhatsApp
    if (conversation.channel !== 'whatsapp') {
      console.log('[send-whatsapp] Not a WhatsApp conversation, skipping');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Not WhatsApp' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar o destinatário
    let recipientJid: string;
    
    const isValidPhone = (value: string) => {
      if (!value) return false;
      return /^\d{10,15}$/.test(value);
    };
    
    const extractPhoneFromJid = (jid: string) => {
      if (!jid) return null;
      const match = jid.match(/^(\d+)@/);
      return match ? match[1] : null;
    };
    
    const isGroupJid = (jid: string) => {
      return jid && jid.includes('@g.us');
    };
    
    const isLidJid = (jid: string) => {
      return jid && jid.includes('@lid');
    };
    
    const isBroadcastJid = (jid: string) => {
      return jid && jid.includes('@broadcast');
    };
    
    const contactPhone = conversation.contacts?.phone;
    const remoteJid = conversation.metadata?.remoteJid;
    const resolvedPhone = conversation.metadata?.resolvedPhone;
    const isGroup = conversation.metadata?.isGroup || isGroupJid(remoteJid);
    const isBroadcast = conversation.metadata?.isBroadcast || isBroadcastJid(remoteJid);
    const isLid = isLidJid(remoteJid);
    
    console.log('[send-whatsapp] Recipient resolution:', {
      contactPhone,
      remoteJid,
      resolvedPhone,
      isGroup,
      isBroadcast,
      isLid
    });
    
    // PRIORIDADE 1: Se é grupo, usar remoteJid diretamente
    if (isGroupJid(remoteJid)) {
      recipientJid = remoteJid;
      console.log(`[send-whatsapp] Sending to GROUP: ${recipientJid}`);
    } 
    // PRIORIDADE 2: Se é broadcast, usar remoteJid diretamente
    else if (isBroadcastJid(remoteJid)) {
      recipientJid = remoteJid;
      console.log(`[send-whatsapp] Sending to BROADCAST: ${recipientJid}`);
    }
    // PRIORIDADE 3: Se tem telefone válido no contato
    else if (contactPhone && isValidPhone(contactPhone)) {
      recipientJid = `${contactPhone}@s.whatsapp.net`;
      console.log(`[send-whatsapp] Using contact phone: ${contactPhone}`);
    } 
    // PRIORIDADE 4: Se tem telefone resolvido no metadata
    else if (resolvedPhone && isValidPhone(resolvedPhone)) {
      recipientJid = `${resolvedPhone}@s.whatsapp.net`;
      console.log(`[send-whatsapp] Using resolved phone: ${resolvedPhone}`);
    }
    // PRIORIDADE 5: Se remoteJid é formato s.whatsapp.net
    else if (remoteJid && remoteJid.includes('@s.whatsapp.net')) {
      recipientJid = remoteJid;
      console.log(`[send-whatsapp] Using remoteJid: ${recipientJid}`);
    } 
    // PRIORIDADE 6: Se é LID, buscar no lid_phone_mapping
    else if (isLid) {
      const lidId = extractPhoneFromJid(remoteJid);
      console.log(`[send-whatsapp] Looking up LID phone mapping for: ${lidId}`);
      
      const { data: lidMapping } = await supabase
        .from('lid_phone_mapping')
        .select('phone')
        .eq('lid', lidId)
        .maybeSingle();
      
      if (lidMapping?.phone && isValidPhone(lidMapping.phone)) {
        recipientJid = `${lidMapping.phone}@s.whatsapp.net`;
        console.log(`[send-whatsapp] Found LID mapping: ${lidMapping.phone}`);
      } else {
        console.error('[send-whatsapp] LID contact without phone mapping:', remoteJid);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Este contato usa LID e não tem telefone cadastrado. Peça o número ao contato.',
            isLidWithoutPhone: true
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // PRIORIDADE 7: Tentar extrair telefone do remoteJid
    else if (remoteJid) {
      const extractedPhone = extractPhoneFromJid(remoteJid);
      if (extractedPhone && isValidPhone(extractedPhone)) {
        recipientJid = `${extractedPhone}@s.whatsapp.net`;
        console.log(`[send-whatsapp] Extracted phone: ${extractedPhone}`);
      } else {
        console.error('[send-whatsapp] Invalid remoteJid for sending:', remoteJid);
        return new Response(
          JSON.stringify({ success: false, error: 'No valid WhatsApp phone number found' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error('[send-whatsapp] No valid phone or remoteJid found');
      return new Response(
        JSON.stringify({ success: false, error: 'No valid WhatsApp identifier found' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar instância WhatsApp conectada ESTRITAMENTE pela empresa da conversa
    // REGRA: Cada empresa só pode usar instâncias com seu prefixo no nome
    // VIAINFRA -> VIAINFRAOFICIAL, VIALOGISTIC -> VIALOGISTICOFICIAL
    const companyId = conversation.company_id;
    
    console.log('[send-whatsapp] Searching for instance, company_id:', companyId);
    
    // Buscar instância conectada que pertence à mesma empresa da conversa
    let { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status, company_id, phone_number')
      .eq('company_id', companyId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // REGRA MESTRA: Validar que a instância tem o prefixo correto (VIAINFRA ou VIALOGISTIC)
    // SEGURANÇA: NUNCA usar instância de outra empresa ou sem prefixo autorizado
    if (instance && (!isAllowedInstance(instance.instance_name) || instance.company_id !== companyId)) {
      console.error('[send-whatsapp] SECURITY: Blocked unauthorized instance:', {
        instanceCompany: instance.company_id,
        conversationCompany: companyId,
        instanceName: instance.instance_name,
        reason: !isAllowedInstance(instance.instance_name) ? 'Invalid prefix' : 'Cross-company'
      });
      instance = null;
    }

    if (instanceError || !instance) {
      console.error('[send-whatsapp] Error fetching instance:', instanceError);
      
      // Add to retry queue
      await addToRetryQueue(supabase, {
        conversation_id,
        contactPhone: conversation.contacts?.phone || recipientJid.replace('@s.whatsapp.net', ''),
        instanceName: 'PENDING',
        content: formattedMessage || '',
        messageType: attachment ? attachment.type : 'text',
        mediaUrl: attachment?.url,
        errorMessage: 'No connected WhatsApp instance found'
      });
      
      return new Response(
        JSON.stringify({ success: false, error: 'No connected WhatsApp instance found', queued: true }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-whatsapp] Using instance:', instance.instance_name);

    // Enviar mensagem via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    let sendResult: SendResult;

    // Preparar dados de quoted/reply se existir (formato completo do protocolo WhatsApp/Baileys)
    // O objeto key PRECISA ter remoteJid e fromMe para o WhatsApp localizar a mensagem original
    const quotedData = quoted?.messageId ? {
      key: { 
        remoteJid: recipientJid,  // JID do chat onde a mensagem original está
        fromMe: quoted.isFromAgent === true,  // true se foi enviada pelo agente
        id: quoted.messageId 
      },
      message: { conversation: quoted.content || '' }
    } : undefined;
    
    console.log('[send-whatsapp] QuotedData montado:', quotedData ? JSON.stringify(quotedData) : 'null');

    if (attachment) {
      sendResult = await sendMediaMessage(evolutionUrl, evolutionKey, instance.instance_name, recipientJid, attachment, formattedMessage, agent_name, isGroup, quotedData);
    } else {
      sendResult = await sendTextMessage(evolutionUrl, evolutionKey, instance.instance_name, recipientJid, formattedMessage, isGroup, quotedData);
    }

    // Se enviou com sucesso, atualizar metadata da mensagem com o messageId
    if (sendResult.success && sendResult.messageId && message_id) {
      console.log('[send-whatsapp] Updating message metadata with messageId:', sendResult.messageId);
      
      // Buscar metadata atual
      const { data: currentMessage } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', message_id)
        .single();
      
      const currentMetadata = (currentMessage?.metadata as Record<string, any>) || {};
      
      // Atualizar com o messageId da Evolution API
      const { error: updateError } = await supabase
        .from('messages')
        .update({
          metadata: {
            ...currentMetadata,
            whatsappMessageId: sendResult.messageId,
            whatsappSentAt: new Date().toISOString(),
            whatsappStatus: 'pending'
          }
        })
        .eq('id', message_id);
      
      if (updateError) {
        console.error('[send-whatsapp] Error updating message metadata:', updateError);
      } else {
        console.log('[send-whatsapp] Message metadata updated successfully');
      }
    }

    // Se falhou, adicionar à fila de retry
    if (!sendResult.success) {
      console.error('[send-whatsapp] Send failed:', sendResult.error);
      
      await addToRetryQueue(supabase, {
        conversation_id,
        contactPhone: conversation.contacts?.phone || recipientJid.replace('@s.whatsapp.net', ''),
        instanceName: instance.instance_name,
        content: formattedMessage || '',
        messageType: attachment ? attachment.type : 'text',
        mediaUrl: attachment?.url,
        errorMessage: sendResult.error || 'Unknown error'
      });
      
      // Atualizar status de erro na mensagem
      if (message_id) {
        const { data: currentMessage } = await supabase
          .from('messages')
          .select('metadata')
          .eq('id', message_id)
          .single();
        
        const currentMetadata = (currentMessage?.metadata as Record<string, any>) || {};
        
        await supabase
          .from('messages')
          .update({
            metadata: {
              ...currentMetadata,
              whatsappStatus: 'failed',
              whatsappError: sendResult.error,
              whatsappFailedAt: new Date().toISOString()
            }
          })
          .eq('id', message_id);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: sendResult.error,
          queued: true,
          message: 'Message queued for retry'
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-whatsapp] Message sent successfully, messageId:', sendResult.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: sendResult.messageId 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-whatsapp] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função auxiliar para enviar mensagem de texto
// Para GRUPOS: estratégia robusta com múltiplas tentativas
// Para INDIVIDUAIS: usa /message/sendText padrão
// quotedData: para responder/citar uma mensagem específica
async function sendTextMessage(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  recipientJid: string,
  text: string,
  isGroup: boolean,
  quotedData?: { key: { id: string }; message: { conversation: string } }
): Promise<SendResult> {
  console.log(`[send-whatsapp] sendTextMessage - isGroup: ${isGroup}, recipient: ${recipientJid}, hasQuoted: ${!!quotedData}`);

  // ===== ESTRATÉGIA OFICIAL PARA GRUPOS =====
  if (isGroup) {
    console.log('[send-whatsapp] 🎯 Enviando para GRUPO com estratégia oficial');
    
    try {
      // PASSO 1: GET group/participants - força sync dos participantes (método GET)
      console.log('[send-whatsapp] Passo 1: GET participants for group:', recipientJid);
      const participantsResp = await fetch(
        `${evolutionUrl}/group/participants/${instanceName}?groupJid=${encodeURIComponent(recipientJid)}`,
        { headers: { 'apikey': evolutionKey } }
      );
      const participantsBody = await participantsResp.text();
      console.log(`[send-whatsapp] participants: ${participantsResp.status}`, participantsBody.substring(0, 200));
      
      // PASSO 2: updatePresence "composing" (endpoint correto para grupos)
      console.log('[send-whatsapp] Passo 2: updatePresence composing');
      const presenceResp = await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
        body: JSON.stringify({
          number: recipientJid,
          presence: 'composing'
        })
      });
      const presenceBody = await presenceResp.text();
      console.log(`[send-whatsapp] updatePresence: ${presenceResp.status}`, presenceBody);
      
      // PASSO 3: Aguardar 2 segundos para sync de sessões
      console.log('[send-whatsapp] Passo 3: Aguardando 2s');
      await new Promise(r => setTimeout(r, 2000));
      
      // PASSO 4: Tentar sendText primeiro, fallback para sendMessage
      console.log('[send-whatsapp] Passo 4: sendText');
      
      // Payload com suporte a quoted/reply
      const sendPayload: Record<string, any> = {
        number: recipientJid,
        text: text,
        delay: 1500
      };
      
      // Adicionar quoted se existir
      if (quotedData) {
        sendPayload.quoted = quotedData;
        console.log('[send-whatsapp] Sending with quoted:', quotedData);
      }
      
      let response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
        body: JSON.stringify(sendPayload)
      });

      let responseText = await response.text();
      console.log(`[send-whatsapp] sendText: ${response.status}`, responseText);

      // Se sendText falhar com 400, tentar sendMessage (formato alternativo)
      if (!response.ok && response.status === 400) {
        console.log('[send-whatsapp] Passo 4b: Fallback sendMessage');
        response = await fetch(`${evolutionUrl}/message/sendMessage/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
          body: JSON.stringify({
            number: recipientJid,
            textMessage: { text: text },
            delay: 1500
          })
        });
        responseText = await response.text();
        console.log(`[send-whatsapp] sendMessage: ${response.status}`, responseText);
      }

      if (response.ok) {
        try {
          const responseData = JSON.parse(responseText);
          const messageId = responseData?.key?.id || responseData?.messageId || responseData?.id;
          console.log('[send-whatsapp] ✅ Grupo: mensagem enviada!');
          return { success: true, messageId };
        } catch {
          return { success: true };
        }
      }

      // Log detalhado do erro
      console.error('[send-whatsapp] ❌ Falha no envio para grupo:', responseText);
      return { success: false, error: `Falha: ${responseText}` };

    } catch (error: any) {
      console.error('[send-whatsapp] Erro no grupo:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== ESTRATÉGIA PARA INDIVIDUAIS =====
  // Usar sendText padrão
  console.log('[send-whatsapp] 👤 Enviando para chat individual');
  
  try {
    // Payload com suporte a quoted/reply
    const sendPayload: Record<string, any> = {
      number: recipientJid,
      text: text,
    };
    
    // Adicionar quoted se existir
    if (quotedData) {
      sendPayload.quoted = quotedData;
      console.log('[send-whatsapp] Individual sending with quoted:', quotedData);
    }
    
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify(sendPayload),
    });
    
    const responseText = await response.text();
    console.log(`[send-whatsapp] Individual response: ${response.status}`, responseText);
    
    if (response.ok) {
      try {
        const responseData = JSON.parse(responseText);
        const messageId = responseData?.key?.id || responseData?.messageId || responseData?.id;
        return { success: true, messageId };
      } catch {
        return { success: true };
      }
    }
    
    return { success: false, error: responseText };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Função auxiliar para enviar mídia
async function sendMediaMessage(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  recipientJid: string,
  attachment: Attachment,
  caption: string | undefined,
  agentName: string,
  isGroup: boolean,
  quotedData?: { key: { id: string }; message: { conversation: string } }
): Promise<SendResult> {
  const mediaCaption = caption 
    ? `*${agentName || 'Atendente'}*\n${caption}`
    : `*${agentName || 'Atendente'}*`;

  console.log(`[send-whatsapp] sendMediaMessage - isGroup: ${isGroup}, type: ${attachment.type}`);

  // Para grupos, adicionar delay e presence
  const baseOptions = isGroup ? { delay: 1500, presence: 'composing' } : {};

  let endpoint = '';
  let body: Record<string, any> = {
    number: recipientJid,
    ...baseOptions,
    // Adicionar quoted se existir
    ...(quotedData ? { quoted: quotedData } : {})
  };

  switch (attachment.type) {
    case 'image':
      endpoint = `/message/sendMedia/${instanceName}`;
      body = { ...body, mediatype: 'image', media: attachment.url, caption: mediaCaption };
      break;
    case 'video':
      endpoint = `/message/sendMedia/${instanceName}`;
      body = { ...body, mediatype: 'video', media: attachment.url, caption: mediaCaption };
      break;
    case 'audio':
      endpoint = `/message/sendWhatsAppAudio/${instanceName}`;
      body = { ...body, audio: attachment.url };
      break;
    case 'document':
      endpoint = `/message/sendMedia/${instanceName}`;
      body = { ...body, mediatype: 'document', media: attachment.url, fileName: attachment.filename || 'document', caption: mediaCaption };
      break;
    default:
      endpoint = `/message/sendText/${instanceName}`;
      body = { number: recipientJid, text: caption || '[Arquivo]', ...(isGroup ? { delay: 1500 } : {}) };
  }

  console.log('[send-whatsapp] Media request:', endpoint, JSON.stringify(body));

  try {
    // Para grupos, enviar presença antes
    if (isGroup) {
      await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: recipientJid, presence: 'composing' })
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    const response = await fetch(`${evolutionUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`[send-whatsapp] Media response: ${response.status}`, responseText);

    if (response.ok) {
      try {
        const responseData = JSON.parse(responseText);
        const messageId = responseData?.key?.id || responseData?.messageId || responseData?.id;
        return { success: true, messageId };
      } catch {
        return { success: true };
      }
    }

    // Fallback: se mídia falhou e temos texto, tentar enviar só texto
    if (caption) {
      console.warn('[send-whatsapp] Media failed, trying text-only fallback');
      return await sendTextMessage(evolutionUrl, evolutionKey, instanceName, recipientJid, caption, isGroup);
    }

    return { success: false, error: responseText };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Função auxiliar para adicionar à fila de retry
async function addToRetryQueue(
  supabase: any,
  params: {
    conversation_id: string;
    contactPhone: string;
    instanceName: string;
    content: string;
    messageType: string;
    mediaUrl?: string;
    errorMessage: string;
  }
) {
  console.log('[send-whatsapp] Adding to retry queue');
  
  const { error: queueError } = await supabase
    .from('message_queue')
    .insert({
      conversation_id: params.conversation_id,
      contact_phone: params.contactPhone,
      instance_name: params.instanceName,
      content: params.content,
      message_type: params.messageType,
      media_url: params.mediaUrl || null,
      status: 'pending',
      retry_count: 0,
      error_message: params.errorMessage.substring(0, 500),
      scheduled_at: new Date(Date.now() + 60000).toISOString() // Retry in 1 minute
    });
  
  if (queueError) {
    console.error('[send-whatsapp] Error adding to retry queue:', queueError);
  } else {
    console.log('[send-whatsapp] Message added to retry queue');
  }
}

// Handle editing a message on WhatsApp
async function handleUpdateMessage(body: {
  instanceName?: string;
  conversation_id?: string;
  local_message_id?: string;
  remoteJid: string;
  messageId: string;
  newContent: string;
}): Promise<Response> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const resolvedInstance = body.instanceName || (await resolveAuthorizedInstanceForConversation(supabase, body.conversation_id)).instanceName;
  const { remoteJid, messageId, newContent } = body;
  
  console.log('[send-whatsapp] ✏️ handleUpdateMessage START:', { 
    instanceName: resolvedInstance, 
    remoteJid, 
    messageId, 
    newContentLength: newContent?.length,
    messageIdType: typeof messageId
  });
  
  if (!resolvedInstance || !remoteJid || !messageId || !newContent) {
    const missingFields = [];
    if (!resolvedInstance) missingFields.push('instanceName');
    if (!remoteJid) missingFields.push('remoteJid');
    if (!messageId) missingFields.push('messageId');
    if (!newContent) missingFields.push('newContent');
    
    console.error('[send-whatsapp] ✏️ Missing fields:', missingFields);
    return new Response(
      JSON.stringify({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('[send-whatsapp] ✏️ Evolution API not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Evolution API not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Evolution API v2 endpoint for updating messages
    // Documentação: POST /chat/updateMessage/{instance}
    const updateUrl = `${evolutionApiUrl}/chat/updateMessage/${resolvedInstance}`;
    
    // Payload conforme documentação oficial da Evolution API v2
    const updatePayload = {
      number: remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', ''),
      text: newContent,
      key: {
        remoteJid: remoteJid,
        fromMe: true,  // Sempre true pois só podemos editar nossas próprias mensagens
        id: messageId
      }
    };
    
    console.log('[send-whatsapp] ✏️ Calling Evolution API:', {
      url: updateUrl,
      payload: updatePayload
    });
    
    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify(updatePayload)
    });
    
    const responseText = await response.text();
    console.log('[send-whatsapp] ✏️ Evolution API response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 500)
    });
    
    // Parse response para melhor diagnóstico
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    if (!response.ok) {
      console.error('[send-whatsapp] ✏️ Evolution API error:', {
        status: response.status,
        error: responseData
      });
      
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Erro na API do WhatsApp';
      if (response.status === 404) {
        errorMessage = 'Mensagem não encontrada no WhatsApp (pode ter expirado o limite de 15 min)';
      } else if (response.status === 400) {
        errorMessage = 'Dados inválidos para edição';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Não autorizado a editar esta mensagem';
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage, details: responseData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[send-whatsapp] ✏️ Message updated successfully on WhatsApp');
    return new Response(
      JSON.stringify({ success: true, message: 'Message updated on WhatsApp', data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-whatsapp] ✏️ Exception during update:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error during update' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle deleting a message on WhatsApp (delete for everyone)
async function handleDeleteMessage(body: {
  instanceName?: string;
  conversation_id?: string;
  local_message_id?: string;
  remoteJid: string;
  messageId: string;
  fromMe: boolean;
}): Promise<Response> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const resolvedInstance = body.instanceName || (await resolveAuthorizedInstanceForConversation(supabase, body.conversation_id)).instanceName;
  const { remoteJid, messageId, fromMe } = body;
  
  console.log('[send-whatsapp] 🗑️ handleDeleteMessage START:', { 
    instanceName: resolvedInstance, 
    remoteJid, 
    messageId, 
    fromMe,
    messageIdType: typeof messageId
  });
  
  if (!resolvedInstance || !remoteJid || !messageId) {
    const missingFields = [];
    if (!resolvedInstance) missingFields.push('instanceName');
    if (!remoteJid) missingFields.push('remoteJid');
    if (!messageId) missingFields.push('messageId');
    
    console.error('[send-whatsapp] 🗑️ Missing fields:', missingFields);
    return new Response(
      JSON.stringify({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('[send-whatsapp] 🗑️ Evolution API not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Evolution API not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Evolution API endpoint for deleting messages for everyone
    // Documentação: DELETE /chat/deleteMessageForEveryone/{instance}
    const deleteUrl = `${evolutionApiUrl}/chat/deleteMessageForEveryone/${resolvedInstance}`;
    
    // Payload conforme documentação oficial da Evolution API v2
    const deletePayload = {
      id: messageId,
      remoteJid: remoteJid,
      fromMe: fromMe === true  // Garante booleano
    };
    
    console.log('[send-whatsapp] 🗑️ Calling Evolution API:', {
      url: deleteUrl,
      payload: deletePayload
    });
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify(deletePayload)
    });
    
    const responseText = await response.text();
    console.log('[send-whatsapp] 🗑️ Evolution API response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 500)
    });
    
    // Parse response para melhor diagnóstico
    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    if (!response.ok) {
      console.error('[send-whatsapp] 🗑️ Evolution API error:', {
        status: response.status,
        error: responseData
      });
      
      // Verificar se é erro de limite de tempo ou mensagem não encontrada
      const responseStr = responseText.toLowerCase();
      const isTimeLimit = responseStr.includes('time') || 
                         responseStr.includes('limit') || 
                         responseStr.includes('expired') ||
                         responseStr.includes('too old') ||
                         responseStr.includes('cannot delete');
      const isNotFound = responseStr.includes('not found') || response.status === 404;
      
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Erro na API do WhatsApp';
      if (isTimeLimit) {
        errorMessage = 'Limite de tempo excedido (~1 hora) para exclusão no WhatsApp';
      } else if (isNotFound) {
        errorMessage = 'Mensagem não encontrada no WhatsApp';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Não autorizado a excluir esta mensagem';
      } else if (!fromMe) {
        errorMessage = 'Mensagens recebidas não podem ser apagadas para todos';
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage, 
          details: responseData,
          isTimeLimit,
          isNotFound
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[send-whatsapp] 🗑️ Message deleted successfully on WhatsApp');
    return new Response(
      JSON.stringify({ success: true, message: 'Message deleted on WhatsApp', data: responseData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-whatsapp] 🗑️ Exception during delete:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error during delete' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
