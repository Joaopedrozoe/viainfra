import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { BotFlowProcessor } from './bot-flow-processor.ts';

// IMPORTANTE: Instâncias autorizadas para processamento
const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheets API URL (mesma usada no canal web)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0viYlAJ_-v00BzqRgMROE0wdvixohvQ4d949mTvRQk_eRdqN-CsxQeAldpV6HR2xlBQ/exec';

interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename?: string;
  mimeType?: string;
}

interface EvolutionMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      url?: string;
      directPath?: string;
      mediaKey?: string;
      mimetype?: string;
      caption?: string;
    };
    audioMessage?: {
      url?: string;
      directPath?: string;
      mediaKey?: string;
      mimetype?: string;
      ptt?: boolean;
    };
    videoMessage?: {
      url?: string;
      directPath?: string;
      mediaKey?: string;
      mimetype?: string;
      caption?: string;
    };
    documentMessage?: {
      url?: string;
      directPath?: string;
      mediaKey?: string;
      mimetype?: string;
      title?: string;
      fileName?: string;
    };
    stickerMessage?: {
      url?: string;
      directPath?: string;
      mimetype?: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

interface EvolutionWebhook {
  event: string;
  instance: string;
  data: EvolutionMessage | any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Evolution webhook received:', req.method, req.url);

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Parse webhook data
    const webhook = parseWebhookPayload(payload);
    if (!webhook) {
      console.log('Invalid webhook payload');
      return new Response('Invalid payload', { status: 400, headers: corsHeaders });
    }

    // FILTRO: Ignorar instâncias não autorizadas
    if (!ALLOWED_INSTANCES.includes(webhook.instance)) {
      console.log(`⛔ Instância ${webhook.instance} não autorizada. Ignorando.`);
      return new Response('Instance not allowed', { status: 200, headers: corsHeaders });
    }

    // CAPTURAR status@broadcast (Stories do WhatsApp) - salvar na tabela de status
    const remoteJid = webhook.data?.key?.remoteJid || webhook.data?.remoteJid || '';
    if (remoteJid === 'status@broadcast' || remoteJid.includes('status@broadcast')) {
      console.log(`📸 Status/Story recebido - salvando na tabela whatsapp_statuses`);
      await processStatusBroadcast(supabase, webhook);
      return new Response('Status saved', { status: 200, headers: corsHeaders });
    }

    console.log(`✅ Processando instância autorizada: ${webhook.instance}`);

    // Process based on event type - normalize to uppercase and handle various formats
    const eventType = webhook.event.toUpperCase().replace(/\./g, '_').replace(/-/g, '_');
    console.log(`📥 Evento: ${webhook.event} -> Normalizado: ${eventType}`);
    
    switch (eventType) {
      case 'MESSAGES_UPSERT':
        await processNewMessage(supabase, webhook, payload);
        break;
      case 'MESSAGES_UPDATE':
        await processMessageUpdate(supabase, webhook);
        break;
      case 'CONNECTION_UPDATE':
        await processConnectionUpdate(supabase, webhook);
        break;
      case 'PRESENCE_UPDATE':
      case 'PRESENCEUPDATE':
        await processPresenceUpdate(supabase, webhook);
        break;
      case 'QRCODE_UPDATED':
        console.log(`📱 QR Code atualizado para ${webhook.instance}`);
        break;
      default:
        console.log(`⚠️ Evento não tratado: ${webhook.event}`);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

// Process presence (typing) updates
async function processPresenceUpdate(supabase: any, webhook: EvolutionWebhook) {
  console.log('Processing presence update:', JSON.stringify(webhook.data));
  
  try {
    const data = webhook.data;
    
    // Extract presence information
    const remoteJid = data?.remoteJid || data?.participant || data?.key?.remoteJid;
    const presenceType = data?.presence || data?.type || data?.status;
    
    if (!remoteJid) {
      console.log('No remoteJid in presence update');
      return;
    }
    
    // Skip groups
    if (remoteJid.includes('@g.us')) {
      return;
    }
    
    const isTyping = presenceType === 'composing' || presenceType === 'recording';
    const phoneNumber = extractPhoneNumber(remoteJid);
    
    console.log(`👆 Presence: ${remoteJid} is ${presenceType} (typing: ${isTyping})`);
    
    if (!phoneNumber) {
      return;
    }
    
    // Find contact by phone
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone', phoneNumber)
      .maybeSingle();
    
    if (!contact) {
      console.log(`No contact found for ${phoneNumber}`);
      return;
    }
    
    // Find conversation for this contact
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', contact.id)
      .eq('channel', 'whatsapp')
      .in('status', ['open', 'pending'])
      .maybeSingle();
    
    if (!conversation) {
      console.log(`No active conversation found for contact ${contact.id}`);
      return;
    }
    
    // Update typing status
    const expiresAt = new Date(Date.now() + 10000).toISOString(); // 10 seconds
    
    const { error } = await supabase
      .from('typing_status')
      .upsert({
        conversation_id: conversation.id,
        contact_id: contact.id,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt
      }, {
        onConflict: 'conversation_id,contact_id'
      });
    
    if (error) {
      console.error('Error updating typing status:', error);
    } else {
      console.log(`✅ Updated typing status: ${isTyping ? 'typing' : 'stopped'}`);
    }
    
  } catch (error) {
    console.error('Error processing presence update:', error);
  }
}

// Process status@broadcast (WhatsApp Stories/Status)
async function processStatusBroadcast(supabase: any, webhook: EvolutionWebhook) {
  console.log('📸 Processing status broadcast...');
  
  try {
    const data = webhook.data;
    if (!data) return;
    
    // Handle array or single message
    const messages = Array.isArray(data) ? data : [data];
    
    for (const msg of messages) {
      const key = msg.key;
      const message = msg.message;
      const pushName = msg.pushName || 'Contato';
      const messageId = key?.id;
      const participant = key?.participant || key?.remoteJid;
      
      if (!participant || !messageId) {
        console.log('⚠️ Status sem participant ou messageId');
        continue;
      }
      
      // Extract phone number from participant
      const phoneNumber = extractPhoneNumber(participant);
      
      // Determine content type and extract content
      let contentType = 'text';
      let content = '';
      let mediaUrl = '';
      let caption = '';
      
      if (message?.imageMessage) {
        contentType = 'image';
        mediaUrl = message.imageMessage.url || '';
        caption = message.imageMessage.caption || '';
      } else if (message?.videoMessage) {
        contentType = 'video';
        mediaUrl = message.videoMessage.url || '';
        caption = message.videoMessage.caption || '';
      } else if (message?.extendedTextMessage) {
        contentType = 'text';
        content = message.extendedTextMessage.text || '';
      } else if (message?.conversation) {
        contentType = 'text';
        content = message.conversation || '';
      }
      
      // Get company_id from instance
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('company_id')
        .eq('instance_name', webhook.instance)
        .maybeSingle();
      
      const companyId = instance?.company_id;
      
      if (!companyId) {
        console.log(`⚠️ Instância ${webhook.instance} não encontrada`);
        continue;
      }
      
      // Find or create contact
      let contactId = null;
      
      if (phoneNumber) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone', phoneNumber)
          .eq('company_id', companyId)
          .maybeSingle();
        
        if (contact) {
          contactId = contact.id;
        } else {
          // Create new contact for status
          const { data: newContact } = await supabase
            .from('contacts')
            .insert({
              name: pushName,
              phone: phoneNumber,
              company_id: companyId,
              metadata: { fromStatus: true }
            })
            .select('id')
            .single();
          
          contactId = newContact?.id;
        }
      }
      
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Insert status
      const { error } = await supabase
        .from('whatsapp_statuses')
        .insert({
          company_id: companyId,
          contact_id: contactId,
          instance_name: webhook.instance,
          remote_jid: participant,
          message_id: messageId,
          content_type: contentType,
          content: content || caption,
          media_url: mediaUrl,
          caption: caption,
          expires_at: expiresAt,
          metadata: {
            pushName,
            messageTimestamp: msg.messageTimestamp
          }
        });
      
      if (error) {
        console.error('❌ Erro ao salvar status:', error);
      } else {
        console.log(`✅ Status salvo: ${contentType} de ${pushName}`);
      }
    }
  } catch (error) {
    console.error('Error processing status broadcast:', error);
  }
}

function parseWebhookPayload(payload: any): EvolutionWebhook | null {
  try {
    if (!payload.event || !payload.instance) {
      return null;
    }

    return {
      event: payload.event,
      instance: payload.instance,
      data: payload.data,
    };
  } catch (error) {
    console.error('Failed to parse webhook payload:', error);
    return null;
  }
}

async function processNewMessage(supabase: any, webhook: EvolutionWebhook, payload?: any) {
  console.log('Processing new message...');
  console.log('Webhook data type:', typeof webhook.data);
  console.log('Webhook data:', JSON.stringify(webhook.data, null, 2));
  
  // Handle both array and single object formats
  let messagesArray = [];
  
  if (Array.isArray(webhook.data)) {
    messagesArray = webhook.data;
  } else if (webhook.data && typeof webhook.data === 'object') {
    messagesArray = [webhook.data];
  } else {
    console.log('No valid message data found');
    return;
  }
  
  console.log(`Processing ${messagesArray.length} message(s)`);

  for (const messageData of messagesArray) {
    console.log('Raw messageData:', JSON.stringify(messageData, null, 2));
    
    // The messageData IS the message structure with key, message, etc.
    const message = messageData as EvolutionMessage;
    
    // Validar estrutura da mensagem
    if (!message || !message.key || !message.key.remoteJid) {
      console.error('Invalid message structure:', message);
      continue;
    }
    
    console.log('Message key:', JSON.stringify(message.key));
    
    // Skip messages sent by us
    if (message.key.fromMe) {
      console.log('Skipping outgoing message');
      continue;
    }

    // Processar grupos - salvar mensagens mas não acionar bot
    const isGroupMessage = message.key.remoteJid.includes('@g.us');
    if (isGroupMessage) {
      console.log(`📢 Mensagem de GRUPO recebida: ${message.key.remoteJid}`);
      (message as any)._skipBot = true; // Grupos NUNCA acionam bot
      (message as any)._isGroup = true;
    }
    
    // ============================================================
    // PROTEÇÃO CRÍTICA: Ignorar mensagens antigas (> 60 segundos)
    // Isso previne que o bot responda a mensagens sincronizadas
    // ou reprocessadas pelo import-chats
    // ============================================================
    const messageTimestamp = message.messageTimestamp;
    if (messageTimestamp) {
      const messageAge = Date.now() - (messageTimestamp * 1000);
      const maxAgeMs = 60000; // 60 segundos
      
      if (messageAge > maxAgeMs) {
        console.log(`⏰ Mensagem antiga (${Math.round(messageAge/1000)}s) - NÃO ACIONARÁ BOT`);
        // Continua para salvar a mensagem, mas marca para não acionar bot
        (message as any)._skipBot = true;
      }
    }

    const remoteJid = message.key.remoteJid;
    const isLidFormat = remoteJid.includes('@lid');
    const messageContent = extractMessageContent(message);
    const contactName = message.pushName || 'Sem Nome';
    
    // ============================================================
    // PROCESSAMENTO DE MENSAGENS @LID
    // IMPORTANTE: @lid NÃO tem número de telefone real
    // Bot NUNCA pode responder para @lid pois a API Evolution
    // exige o campo "number" que não existe para @lid
    // ============================================================
    if (isLidFormat) {
      const lidId = remoteJid.replace('@lid', '');
      console.log(`📱 Mensagem @lid recebida: LID=${lidId}, Nome=${contactName}`);
      console.log(`🚫 @lid NÃO tem número real - BOT DESABILITADO para este contato`);
      
      // MARCAR PARA NÃO ACIONAR BOT - @lid não tem número para envio
      (message as any)._skipBot = true;
      
      // Buscar conversa existente
      let existingLidConv = null;
      
      // Busca 1: Pelo remoteJid exato
      const { data: convByJid } = await supabase
        .from('conversations')
        .select('*, contacts(*)')
        .eq('metadata->>remoteJid', remoteJid)
        .eq('channel', 'whatsapp')
        .limit(1)
        .maybeSingle();
      
      if (convByJid) {
        existingLidConv = convByJid;
        console.log(`✅ Conversa encontrada por remoteJid: ${existingLidConv.id}`);
      }
      
      // Busca 2: Pelo lidJid no metadata
      if (!existingLidConv) {
        const { data: convByLidJid } = await supabase
          .from('conversations')
          .select('*, contacts(*)')
          .eq('metadata->>lidJid', remoteJid)
          .eq('channel', 'whatsapp')
          .limit(1)
          .maybeSingle();
        
        if (convByLidJid) {
          existingLidConv = convByLidJid;
          console.log(`✅ Conversa encontrada por lidJid: ${existingLidConv.id}`);
        }
      }
      
      // Busca 3: Pelo nome do pushName
      if (!existingLidConv && contactName && contactName !== 'Sem Nome') {
        const { data: convByName } = await supabase
          .from('conversations')
          .select('*, contacts(*)')
          .eq('channel', 'whatsapp')
          .ilike('contacts.name', contactName)
          .limit(1)
          .maybeSingle();
        
        if (convByName && convByName.contacts?.phone) {
          existingLidConv = convByName;
          console.log(`✅ Conversa encontrada por nome: ${existingLidConv.id} - ${existingLidConv.contacts?.name}`);
          
          // Atualizar o lidJid para facilitar buscas futuras
          await supabase
            .from('conversations')
            .update({ 
              metadata: { ...existingLidConv.metadata, lidJid: remoteJid },
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLidConv.id);
        }
      }
      
      if (existingLidConv) {
        // Atualizar nome do contato se mudou
        if (existingLidConv.contacts && existingLidConv.contacts.name !== contactName && contactName !== 'Sem Nome') {
          await supabase
            .from('contacts')
            .update({ name: contactName })
            .eq('id', existingLidConv.contacts.id);
          console.log(`📝 Nome do contato atualizado: ${existingLidConv.contacts.name} -> ${contactName}`);
        }
        
        // Salvar mensagem na conversa existente
        await saveMessage(supabase, existingLidConv.id, message, messageContent, lidId, webhook.instance);
        
        // BOT NUNCA SERÁ ACIONADO PARA @lid - não temos número para enviar
        console.log(`✅ Mensagem @lid salva. Bot DESABILITADO (sem número real).`);
        continue;
      }
      
      // Não existe conversa para esse LID - criar nova (SEM BOT)
      console.log(`📱 @lid sem conversa existente - criando nova conversa para LID ${lidId}`);
      
      // Obter company_id da instância
      const { data: companyData } = await supabase
        .from('whatsapp_instances')
        .select('company_id')
        .eq('instance_name', webhook.instance)
        .single();
      
      const companyId = companyData?.company_id;
      
      if (!companyId) {
        console.error('❌ Não foi possível determinar company_id para criar contato @lid');
        continue;
      }
      
      // Criar novo contato específico para esse LID (SEM TELEFONE)
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          name: contactName || `Contato ${lidId.slice(-6)}`,
          company_id: companyId,
          metadata: { 
            remoteJid: remoteJid, 
            lidId: lidId,
            isLidContact: true 
          }
          // NÃO TEM PHONE - @lid não é número real
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar contato @lid:', createError);
        continue;
      }
      
      console.log(`✅ Novo contato @lid criado: ${newContact.id} - ${contactName}`);
      
      // Criar nova conversa para esse LID com BOT DESABILITADO
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: newContact.id,
          channel: 'whatsapp',
          status: 'open',
          company_id: companyId,
          bot_active: false, // BOT SEMPRE DESABILITADO PARA @lid
          metadata: { 
            remoteJid: remoteJid,
            lidJid: remoteJid,
            lidId: lidId,
            instanceName: webhook.instance,
            isLidContact: true,
            botDisabledReason: 'lid_no_phone_number'
          }
        })
        .select()
        .single();
      
      if (convError) {
        console.error('❌ Erro ao criar conversa @lid:', convError);
        continue;
      }
      
      console.log(`✅ Nova conversa @lid criada: ${newConv.id} - BOT DESABILITADO`);
      
      // Salvar mensagem
      await saveMessage(supabase, newConv.id, message, messageContent, lidId, webhook.instance);
      
      // BOT NUNCA SERÁ ACIONADO
      console.log(`✅ Mensagem @lid salva. Bot DESABILITADO permanentemente.`);
      continue;
    }
    
    // ============================================================
    // PROCESSAMENTO DE GRUPOS
    // ============================================================
    if ((message as any)._isGroup) {
      const groupId = remoteJid;
      const groupName = contactName || `Grupo ${groupId.split('@')[0]}`;
      const participantName = message.pushName || 'Participante';
      
      console.log(`📢 Processing GROUP message from ${participantName} in group ${groupId}`);
      
      // Buscar ou criar contato para o grupo
      let groupContact = null;
      
      const { data: existingGroupContact } = await supabase
        .from('contacts')
        .select('*')
        .contains('metadata', { remoteJid: groupId })
        .limit(1)
        .single();
      
      if (existingGroupContact) {
        groupContact = existingGroupContact;
        console.log(`✅ Found existing group contact: ${groupContact.name}`);
      } else {
        const { data: newGroupContact, error: createError } = await supabase
          .from('contacts')
          .insert({
            name: groupName,
            metadata: { 
              remoteJid: groupId, 
              isGroup: true,
              groupType: 'whatsapp'
            }
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating group contact:', createError);
          continue;
        }
        
        groupContact = newGroupContact;
        console.log(`✅ Created new group contact: ${groupContact.name}`);
      }
      
      // Buscar ou criar conversa para o grupo
      let groupConversation = null;
      
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', groupContact.id)
        .eq('channel', 'whatsapp')
        .limit(1)
        .single();
      
      if (existingConv) {
        groupConversation = existingConv;
        console.log(`✅ Found existing group conversation: ${groupConversation.id}`);
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_id: groupContact.id,
            channel: 'whatsapp',
            status: 'open',
            bot_active: false, // Grupos NUNCA têm bot
            metadata: { 
              remoteJid: groupId,
              isGroup: true,
              instanceName: webhook.instance
            }
          })
          .select()
          .single();
        
        if (convError) {
          console.error('Error creating group conversation:', convError);
          continue;
        }
        
        groupConversation = newConv;
        console.log(`✅ Created new group conversation: ${groupConversation.id}`);
      }
      
      // Salvar mensagem do grupo
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: groupConversation.id,
          sender_type: 'user',
          content: `*${participantName}*:\n${messageContent}`,
          metadata: {
            external_id: message.key.id,
            sender_name: participantName,
            isGroup: true,
            groupId: groupId
          }
        });
      
      if (msgError) {
        console.error('Error saving group message:', msgError);
      } else {
        console.log(`✅ Group message saved for conversation ${groupConversation.id}`);
      }
      
      // Atualizar updated_at da conversa
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', groupConversation.id);
      
      continue; // Grupos nunca acionam bot
    }
    
    // ============================================================
    // PROCESSAMENTO DE MENSAGENS INDIVIDUAIS (não grupos, não @lid)
    // ============================================================
    
    // Regular @s.whatsapp.net messages - extract phone from remoteJid
    const phoneNumber = extractPhoneNumber(remoteJid);
    console.log(`📱 Extracted phone from remoteJid: ${phoneNumber}`);

    console.log(`Processing message from ${phoneNumber || 'NO_PHONE'} (remoteJid: ${remoteJid}): ${messageContent}`);

    // Get or create contact
    const contact = await getOrCreateContact(supabase, phoneNumber, contactName, remoteJid, webhook.instance);
    
    // Update profile picture if missing for existing contacts
    if (!contact.avatar_url && contact.phone && webhook.instance) {
      updateContactProfilePicture(supabase, contact, webhook.instance);
    }
    
    // Use contact's phone if available
    const contactPhone = contact.phone || phoneNumber;
    
    // For sending: keep original remoteJid format
    let sendToRemoteJid = remoteJid;
    if (contactPhone && remoteJid.includes('@s.whatsapp.net')) {
      sendToRemoteJid = `${contactPhone}@s.whatsapp.net`;
    }
    
    console.log(`Contact phone: ${contactPhone || 'none'}, will send to: ${sendToRemoteJid}`);
    
    // Get or create conversation
    const conversation = await getOrCreateConversation(supabase, contact.id, contactPhone, contactName, remoteJid, webhook.instance);
    
    // Save message - returns null if duplicate
    const savedMessage = await saveMessage(supabase, conversation.id, message, messageContent, contactPhone, webhook.instance);
    
    // PROTEÇÃO: Se a mensagem foi duplicada, não aciona o bot
    if (!savedMessage) {
      console.log('⚠️ Mensagem duplicada - ignorando trigger do bot');
      continue;
    }

    // PROTEÇÃO: Não acionar bot para mensagens antigas
    if ((message as any)._skipBot) {
      console.log(`⏰ Mensagem antiga - bot NÃO será acionado`);
      continue;
    }

    // ============================================================
    // PROTEÇÃO FINAL ANTES DE ACIONAR BOT
    // Só aciona se temos um número de telefone VÁLIDO para enviar
    // ============================================================
    if (!contactPhone || contactPhone.length < 10) {
      console.log(`🚫 BOT BLOQUEADO: Sem número de telefone válido (${contactPhone || 'vazio'})`);
      continue;
    }

    // Trigger bot response (APENAS se tiver número válido)
    console.log(`✅ Triggering bot for contact ${contact.id} (${contactName}). Phone: ${contactPhone}`);
    await triggerBotResponse(supabase, conversation.id, messageContent, sendToRemoteJid, webhook.instance);
  }
}

async function processConnectionUpdate(supabase: any, webhook: EvolutionWebhook) {
  console.log('Processing connection update:', webhook.data);
  
  // Update instance status in database
  const { error } = await supabase
    .from('whatsapp_instances')
    .upsert({
      instance_name: webhook.instance,
      status: webhook.data.state || 'unknown',
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating instance status:', error);
  }
}

// Process message status updates
async function processMessageUpdate(supabase: any, webhook: EvolutionWebhook) {
  const data = webhook.data;
  const remoteJid = data?.remoteJid;
  const keyId = data?.keyId;
  
  // Skip if no phone or is group
  if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('@lid')) {
    console.log(`📬 Message status update (skipped): ${JSON.stringify(data?.status || data)}`);
    return;
  }
  
  // Extract phone from remoteJid
  const phone = remoteJid.split('@')[0];
  if (!phone || !/^\d{10,15}$/.test(phone)) {
    console.log(`📬 Message status update (invalid phone): ${remoteJid}`);
    return;
  }
  
  console.log(`📬 Message status update: phone=${phone}, keyId=${keyId}`);
  
  // Get company_id from instance
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('company_id')
    .eq('instance_name', webhook.instance)
    .single();
  
  if (!instance?.company_id) {
    console.log('⚠️ Instance not found');
    return;
  }
  
  const companyId = instance.company_id;
  
  // Check if contact already exists with this phone
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id, name, phone')
    .eq('company_id', companyId)
    .eq('phone', phone)
    .maybeSingle();
  
  if (existingContact) {
    // Contact already exists with phone - check if conversation exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_id', existingContact.id)
      .eq('channel', 'whatsapp')
      .maybeSingle();
    
    if (!existingConv) {
      // Create conversation for existing contact
      console.log(`➕ Creating conversation for existing contact: ${existingContact.name} (${phone})`);
      await supabase.from('conversations').insert({
        contact_id: existingContact.id,
        company_id: companyId,
        channel: 'whatsapp',
        status: 'open',
        bot_active: true,
        metadata: {
          remoteJid,
          instanceName: webhook.instance
        }
      });
    }
    return;
  }
  
  // No contact with this phone - try to find placeholder contact without phone
  const { data: placeholderContacts } = await supabase
    .from('contacts')
    .select('id, name, phone, metadata')
    .eq('company_id', companyId)
    .is('phone', null)
    .order('updated_at', { ascending: false })
    .limit(10);
  
  // If we can find a contact with matching @lid remoteJid, update it
  for (const contact of placeholderContacts || []) {
    const contactJid = contact.metadata?.remoteJid || '';
    if (contactJid.includes('@lid')) {
      // This is a placeholder @lid contact - update with real phone
      console.log(`🔄 Updating @lid contact ${contact.name} with phone: ${phone}`);
      
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          phone,
          metadata: {
            ...contact.metadata,
            remoteJid,
            lidJid: contactJid,
            resolvedFromUpdate: true
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);
      
      if (!updateError) {
        console.log(`✅ Contact ${contact.name} updated with phone ${phone}`);
        
        // Also update conversation to enable bot now that we have a phone
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id, metadata')
          .eq('contact_id', contact.id)
          .eq('channel', 'whatsapp')
          .maybeSingle();
        
        if (existingConv) {
          // Update conversation with real remoteJid and enable bot
          await supabase.from('conversations').update({
            bot_active: true, // NOW we can enable bot since we have a phone
            metadata: {
              ...existingConv.metadata,
              remoteJid,
              lidJid: contactJid,
              instanceName: webhook.instance,
              botEnabledReason: 'phone_resolved_from_update'
            }
          }).eq('id', existingConv.id);
          console.log(`✅ Bot enabled for conversation ${existingConv.id} after phone resolved`);
        } else {
          // Create new conversation with bot enabled
          await supabase.from('conversations').insert({
            contact_id: contact.id,
            company_id: companyId,
            channel: 'whatsapp',
            status: 'open',
            bot_active: true,
            metadata: {
              remoteJid,
              lidJid: contactJid,
              instanceName: webhook.instance
            }
          });
        }
      }
      return;
    }
  }
  
  // No placeholder found - create new contact and conversation
  console.log(`➕ Creating new contact from status update: ${phone}`);
  
  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      name: phone,
      phone,
      company_id: companyId,
      metadata: { remoteJid, resolvedFromUpdate: true }
    })
    .select()
    .single();
  
  if (contactError) {
    console.log(`⚠️ Error creating contact: ${contactError.message}`);
    return;
  }
  
  // Create conversation with bot enabled (we have a valid phone)
  await supabase.from('conversations').insert({
    contact_id: newContact.id,
    company_id: companyId,
    channel: 'whatsapp',
    status: 'open',
    bot_active: true,
    metadata: {
      remoteJid,
      instanceName: webhook.instance
    }
  });
  
  console.log(`✅ Created contact and conversation: ${newContact.id}`);
}


async function fetchProfilePicture(phoneNumber: string, instanceName: string): Promise<string | null> {
  if (!phoneNumber) return null;
  
  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionKey) {
      console.log('⚠️ EVOLUTION_API_KEY not configured for profile picture');
      return null;
    }
    
    console.log(`📷 Fetching profile picture for ${phoneNumber}...`);
    
    const response = await fetch(`${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
      }),
    });
    
    if (!response.ok) {
      console.log(`⚠️ Failed to fetch profile picture: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.profilePictureUrl || data.pictureUrl || data.url) {
      const pictureUrl = data.profilePictureUrl || data.pictureUrl || data.url;
      console.log(`✅ Profile picture found: ${pictureUrl.substring(0, 50)}...`);
      return pictureUrl;
    }
    
    console.log('📷 No profile picture available for this contact');
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching profile picture:', error);
    return null;
  }
}

// Normaliza telefone brasileiro para sempre ter prefixo 55
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
    return '55' + digits;
  }
  if (digits.length >= 12 && digits.length <= 13 && digits.startsWith('55')) {
    return digits;
  }
  return digits;
}

// Gera variações de telefone para busca flexível
function getPhoneVariations(phone: string): string[] {
  if (!phone) return [];
  const normalized = normalizePhoneNumber(phone);
  const variations = [normalized];
  
  if (normalized.startsWith('55') && normalized.length >= 12) {
    variations.push(normalized.substring(2));
  }
  if (!normalized.startsWith('55') && normalized.length >= 10) {
    variations.push('55' + normalized);
  }
  
  return [...new Set(variations)];
}

async function getOrCreateContact(supabase: any, phoneNumber: string, name: string, remoteJid: string, instanceName?: string) {
  // Get first company
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .limit(1);
  const companyId = companies?.[0]?.id;

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const phoneVariations = getPhoneVariations(phoneNumber);

  console.log(`🔍 Searching contact - Phone: ${phoneNumber || 'N/A'} (normalized: ${normalizedPhone}), Name: ${name}, RemoteJid: ${remoteJid}`);

  // PRIORITY 1: Try to find by phone number
  if (normalizedPhone && phoneVariations.length > 0) {
    const { data: existingByPhone } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .in('phone', phoneVariations)
      .limit(1)
      .maybeSingle();

    if (existingByPhone) {
      console.log('✅ Found existing contact by phone:', existingByPhone.id);
      const needsUpdate = existingByPhone.phone !== normalizedPhone || 
                          existingByPhone.metadata?.remoteJid !== remoteJid;
      if (needsUpdate) {
        await supabase
          .from('contacts')
          .update({ 
            phone: normalizedPhone,
            metadata: { ...existingByPhone.metadata, remoteJid: remoteJid },
            name: name || existingByPhone.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingByPhone.id);
        existingByPhone.phone = normalizedPhone;
      }
      return existingByPhone;
    }
  }

  // PRIORITY 2: Try to find by remoteJid in metadata
  const { data: existingByRemoteJid } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId)
    .contains('metadata', { remoteJid: remoteJid })
    .maybeSingle();

  if (existingByRemoteJid) {
    console.log('✅ Found existing contact by remoteJid:', existingByRemoteJid.id);
    
    if (normalizedPhone) {
      console.log(`📞 Updating contact ${existingByRemoteJid.id} with phone: ${normalizedPhone}`);
      await supabase
        .from('contacts')
        .update({ 
          phone: normalizedPhone,
          name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingByRemoteJid.id);
      existingByRemoteJid.phone = normalizedPhone;
    }
    return existingByRemoteJid;
  }

  // Create new contact
  console.log(`➕ Creating new contact: ${name} (${normalizedPhone || 'no phone'})`);
  
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      name: name || normalizedPhone || 'Contato WhatsApp',
      phone: normalizedPhone || null,
      company_id: companyId,
      metadata: { remoteJid }
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }

  // Fetch profile picture for new contact
  if (normalizedPhone && instanceName) {
    const avatarUrl = await fetchProfilePicture(normalizedPhone, instanceName);
    if (avatarUrl) {
      await supabase
        .from('contacts')
        .update({ avatar_url: avatarUrl })
        .eq('id', newContact.id);
      newContact.avatar_url = avatarUrl;
    }
  }

  console.log('✅ Created new contact:', newContact.id);
  return newContact;
}

async function updateContactProfilePicture(supabase: any, contact: any, instanceName: string) {
  if (!contact.phone || contact.avatar_url) return;
  
  const avatarUrl = await fetchProfilePicture(contact.phone, instanceName);
  if (avatarUrl) {
    const { error } = await supabase
      .from('contacts')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', contact.id);
    
    if (error) {
      console.error('❌ Error updating contact avatar:', error);
    } else {
      console.log(`✅ Profile picture updated for ${contact.name}`);
      contact.avatar_url = avatarUrl;
    }
  }
}

async function getOrCreateConversation(supabase: any, contactId: string, phoneNumber: string, contactName: string, remoteJid: string, instanceName?: string) {
  // Get contact to find company_id
  const { data: contact } = await supabase
    .from('contacts')
    .select('company_id')
    .eq('id', contactId)
    .single();

  console.log(`🔍 [getOrCreateConversation] ContactId: ${contactId}, Phone: ${phoneNumber}, RemoteJid: ${remoteJid}`);

  // Buscar conversa existente
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contactId)
    .eq('channel', 'whatsapp')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingConversation) {
    console.log(`✅ Found existing conversation: ${existingConversation.id}`);
    
    const needsReopen = existingConversation.status === 'resolved' || existingConversation.status === 'closed';
    
    if (needsReopen) {
      console.log('🔄 Reabrindo conversa resolvida...');
      
      await supabase
        .from('conversations')
        .update({ 
          status: 'open',
          archived: false,
          updated_at: new Date().toISOString(),
          metadata: {
            ...existingConversation.metadata,
            remoteJid: remoteJid,
            instanceName: instanceName || existingConversation.metadata?.instanceName
          }
        })
        .eq('id', existingConversation.id);
      
      existingConversation.status = 'open';
    } else {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingConversation.id);
    }
    
    return existingConversation;
  }

  // Create new conversation
  console.log(`➕ Creating new conversation for contact: ${contactId}`);
  
  const { data: newConversation, error: insertError } = await supabase
    .from('conversations')
    .insert({
      contact_id: contactId,
      channel: 'whatsapp',
      status: 'open',
      company_id: contact?.company_id,
      bot_active: !!phoneNumber, // Bot only if we have a phone
      metadata: { 
        remoteJid: remoteJid,
        instanceName: instanceName || null
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      console.log('⚠️ Constraint violation - fetching existing...');
      
      const { data: fallbackConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('channel', 'whatsapp')
        .limit(1)
        .maybeSingle();
      
      if (fallbackConversation) {
        return fallbackConversation;
      }
    }
    
    console.error('❌ Error creating conversation:', insertError);
    throw insertError;
  }

  console.log(`✅ Created new conversation: ${newConversation.id}`);
  return newConversation;
}

// Verificar se a mensagem já foi processada
async function isMessageAlreadyProcessed(supabase: any, externalId: string): Promise<boolean> {
  const { data: existingMessage } = await supabase
    .from('messages')
    .select('id')
    .contains('metadata', { external_id: externalId })
    .maybeSingle();
  
  if (existingMessage) {
    console.log(`⚠️ Mensagem ${externalId} já foi processada anteriormente.`);
    return true;
  }
  return false;
}

// Anti-flood check
async function shouldSkipBotResponse(supabase: any, conversationId: string): Promise<boolean> {
  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
  
  const { data: recentBotMessage } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('sender_type', 'bot')
    .gte('created_at', fiveSecondsAgo)
    .limit(1);
  
  if (recentBotMessage && recentBotMessage.length > 0) {
    console.log(`⚠️ Bot já respondeu nos últimos 5 segundos. Anti-flood.`);
    return true;
  }
  return false;
}

// Download media from WhatsApp
async function downloadAndUploadMedia(supabase: any, attachment: Attachment, message: EvolutionMessage, conversationId: string, instanceName: string): Promise<string | null> {
  if (!attachment.url || !attachment.url.startsWith('http')) {
    return null;
  }
  
  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionKey) {
      console.error('❌ EVOLUTION_API_KEY not configured');
      return null;
    }
    
    console.log('📥 Downloading media from WhatsApp via Evolution API...');
    
    const mediaResponse = await fetch(`${evolutionUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        message: {
          key: message.key,
          message: message.message,
        },
        convertToMp4: false,
      }),
    });
    
    if (!mediaResponse.ok) {
      console.error('❌ Failed to download media:', mediaResponse.status);
      return null;
    }
    
    const mediaData = await mediaResponse.json();
    
    if (!mediaData.base64) {
      console.error('❌ No base64 data in response');
      return null;
    }
    
    console.log('✅ Media downloaded, uploading to Supabase Storage...');
    
    const base64Data = mediaData.base64.replace(/^data:[^;]+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const extension = getExtensionFromMimeType(attachment.mimeType || 'application/octet-stream');
    const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, binaryData, {
        contentType: attachment.mimeType || 'application/octet-stream',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('❌ Error uploading to storage:', uploadError);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);
    
    console.log('✅ Media uploaded to Supabase Storage:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Error in downloadAndUploadMedia:', error);
    return null;
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };
  return mimeToExt[mimeType] || 'bin';
}

async function saveMessage(supabase: any, conversationId: string, message: EvolutionMessage, content: string, phoneNumber: string, instanceName: string) {
  const externalId = message.key.id;
  
  // Check for duplicate
  const alreadyProcessed = await isMessageAlreadyProcessed(supabase, externalId);
  if (alreadyProcessed) {
    return null;
  }
  
  // Extract attachment if any
  let attachment = extractAttachment(message);
  
  if (attachment && attachment.url) {
    console.log('📎 Attachment detected:', attachment.type, attachment.url);
    
    const storageUrl = await downloadAndUploadMedia(supabase, attachment, message, conversationId, instanceName);
    
    if (storageUrl) {
      attachment = {
        ...attachment,
        url: storageUrl,
      };
      console.log('✅ Attachment URL replaced with Supabase Storage URL');
    }
  }
  
  const messageMetadata: Record<string, any> = { 
    external_id: externalId,
    sender_name: message.pushName || phoneNumber
  };
  
  if (attachment) {
    messageMetadata.attachment = attachment;
  }
  
  const messageData = {
    conversation_id: conversationId,
    content: content,
    sender_type: 'user',
    metadata: messageMetadata,
    created_at: new Date(message.messageTimestamp * 1000).toISOString()
  };
  
  console.log('Saving message with data:', JSON.stringify(messageData, null, 2));
  
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      console.log('⚠️ Duplicate message detected by constraint.');
      return null;
    }
    console.error('Error saving message:', error);
    throw error;
  }
  
  if (!data) {
    console.error('Message insert returned no data');
    throw new Error('Failed to save message');
  }

  console.log('Message saved successfully with ID:', data.id);
  return data;
}

// ============================================================
// TRIGGER BOT RESPONSE - COM PROTEÇÃO ABSOLUTA
// ============================================================
async function triggerBotResponse(supabase: any, conversationId: string, messageContent: string, remoteJid: string, instanceName: string) {
  console.log('Triggering bot response...');
  
  // ============================================================
  // PROTEÇÃO ABSOLUTA 1: NUNCA enviar para @lid
  // A API Evolution EXIGE o campo "number" que @lid não tem
  // ============================================================
  if (remoteJid.includes('@lid')) {
    console.log(`🚫🚫🚫 BOT BLOQUEADO ABSOLUTO: @lid não tem número de telefone real`);
    console.log(`🚫 remoteJid: ${remoteJid}`);
    return;
  }
  
  // ============================================================
  // PROTEÇÃO ABSOLUTA 2: Verificar se instância tem bot habilitado
  // ============================================================
  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('bot_enabled')
    .eq('instance_name', instanceName)
    .single();
  
  if (instance && instance.bot_enabled === false) {
    console.log(`⏸️ Bot desabilitado para instância ${instanceName}.`);
    return;
  }
  
  // ============================================================
  // PROTEÇÃO ABSOLUTA 3: Buscar estado FRESCO da conversa
  // ============================================================
  const { data: freshConversation, error: freshError } = await supabase
    .from('conversations')
    .select('id, bot_active, metadata, status, contacts(phone)')
    .eq('id', conversationId)
    .single();

  if (freshError) {
    console.error('[BOT] Erro ao buscar conversa:', freshError);
    return;
  }

  // ============================================================
  // PROTEÇÃO ABSOLUTA 4: SYNC-CREATED nunca aciona bot
  // ============================================================
  if (freshConversation.metadata?.syncCreated === true) {
    console.log('[BOT] ❌ Conversa criada por SYNC - bot NUNCA responderá');
    return;
  }
  
  if (freshConversation.metadata?.syncTimestamp) {
    console.log('[BOT] ❌ Conversa tem syncTimestamp - bot NUNCA responderá');
    return;
  }
  
  // ============================================================
  // PROTEÇÃO ABSOLUTA 5: @lid contact nunca aciona bot
  // ============================================================
  if (freshConversation.metadata?.isLidContact === true) {
    console.log('[BOT] ❌ Contato @lid - bot NUNCA responderá');
    return;
  }
  
  if (freshConversation.metadata?.botDisabledReason) {
    console.log(`[BOT] ❌ Bot desabilitado: ${freshConversation.metadata.botDisabledReason}`);
    return;
  }

  // Log detalhado
  console.log('[BOT] Estado FRESCO da conversa:', {
    id: freshConversation.id,
    bot_active: freshConversation.bot_active,
    agent_takeover: freshConversation.metadata?.agent_takeover,
    status: freshConversation.status,
    contactPhone: freshConversation.contacts?.phone
  });

  // ============================================================
  // PROTEÇÃO ABSOLUTA 6: Verificar se contato tem telefone VÁLIDO
  // Sem telefone = NUNCA pode enviar mensagem
  // ============================================================
  const contactPhone = freshConversation.contacts?.phone;
  if (!contactPhone || contactPhone.length < 10) {
    console.log(`[BOT] ❌ Contato sem telefone válido: ${contactPhone || 'vazio'}`);
    return;
  }

  // Verificações do estado do bot
  const botActive = freshConversation.bot_active === true;
  const agentTakeover = freshConversation.metadata?.agent_takeover === true;
  const isPending = freshConversation.status === 'pending';
  const isResolved = freshConversation.status === 'resolved';
  
  const botShouldRespond = botActive && !agentTakeover && !isPending && !isResolved;

  if (!botShouldRespond) {
    console.log('[BOT] ❌ Bot NÃO responderá.');
    console.log('  - bot_active:', botActive);
    console.log('  - agent_takeover:', agentTakeover);
    console.log('  - isPending:', isPending);
    console.log('  - isResolved:', isResolved);
    return;
  }

  console.log('[BOT] ✅ Bot ATIVO - processando resposta...');
  
  // Anti-flood
  const floodCheck = await shouldSkipBotResponse(supabase, conversationId);
  if (floodCheck) {
    return;
  }
  
  // Lock otimista
  const lockTimestamp = Date.now();
  const existingLock = freshConversation?.metadata?.bot_processing_lock;
  if (existingLock && (lockTimestamp - existingLock) < 10000 && existingLock !== lockTimestamp) {
    console.log(`🔒 Bot já está processando esta conversa.`);
    return;
  }
  
  await supabase
    .from('conversations')
    .update({ 
      metadata: {
        ...freshConversation.metadata,
        bot_processing_lock: lockTimestamp
      }
    })
    .eq('id', conversationId);
  
  // Buscar bot
  const { data: bots, error: botsError } = await supabase
    .from('bots')
    .select('*')
    .contains('channels', ['whatsapp'])
    .eq('status', 'published')
    .limit(1);

  if (botsError) {
    console.error('Error fetching bots:', botsError);
    return;
  }

  const conversation = freshConversation;

  if (!bots || bots.length === 0) {
    console.log('No active WhatsApp bots found');
    return;
  }

  const bot = bots[0];
  console.log('Using bot:', bot.name);

  const conversationState = conversation?.metadata?.bot_state || {
    currentNodeId: 'start-1',
    collectedData: {},
  };

  // Processar fluxo do bot
  const processor = new BotFlowProcessor(bot.flows, conversationState);
  const result = await processor.processUserInput(messageContent);

  // Preparar atualização
  const conversationUpdate: any = {
    metadata: {
      ...conversation?.metadata,
      bot_state: result.newState,
      bot_triggered: true,
    },
    status: result.shouldTransferToAgent ? 'pending' : 'open',
    updated_at: new Date().toISOString(),
  };

  // ANTI-LOOP: Se transferir para atendente, DESABILITAR bot completamente
  if (result.shouldTransferToAgent) {
    console.log('📞 Transferindo para atendente - DESABILITANDO BOT');
    conversationUpdate.bot_active = false;
    conversationUpdate.metadata.agent_takeover = true;
    conversationUpdate.metadata.transferred_at = new Date().toISOString();
    conversationUpdate.metadata.transfer_reason = 'invalid_option_or_user_request';
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      conversationUpdate.assigned_to = profiles[0].user_id;
    }
  }

  // Processar chamada de API
  if (result.shouldCallApi) {
    await supabase.from('conversations').update(conversationUpdate).eq('id', conversationId);
    
    if (result.shouldCallApi.action === 'fetch-placas') {
      await handleFetchPlacas(supabase, conversationId, remoteJid, instanceName, bot.flows, result.newState);
      return;
    }
    
    if (result.shouldCallApi.action === 'create-chamado') {
      await handleCreateChamado(supabase, conversationId, remoteJid, instanceName, result.newState);
      return;
    }
  }

  // USAR TELEFONE DO CONTATO para envio (NUNCA o remoteJid direto)
  const recipientJid = `${contactPhone}@s.whatsapp.net`;
  console.log(`📤 Enviando resposta do bot para: ${recipientJid}`);

  // Executar em paralelo
  await Promise.all([
    supabase.from('messages').insert({
      conversation_id: conversationId,
      content: result.response,
      sender_type: 'bot',
      metadata: { bot_id: bot.id, bot_name: bot.name },
      created_at: new Date().toISOString(),
    }),
    supabase.from('conversations').update(conversationUpdate).eq('id', conversationId),
    sendEvolutionMessageSafe(instanceName, contactPhone, result.response)
  ]);
}

async function handleFetchPlacas(supabase: any, conversationId: string, remoteJid: string, instanceName: string, botFlow: any, currentState: any) {
  console.log('📋 Iniciando busca de placas - Canal WhatsApp');
  
  // Buscar telefone do contato
  const { data: conv } = await supabase
    .from('conversations')
    .select('contacts(phone)')
    .eq('id', conversationId)
    .single();
  
  const contactPhone = conv?.contacts?.phone;
  if (!contactPhone) {
    console.log('❌ Sem telefone para enviar resposta');
    return;
  }
  
  try {
    const placasRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=placas`);
    
    const placasText = await placasRes.text();
    
    let placasData;
    try {
      placasData = JSON.parse(placasText);
    } catch (parseError) {
      placasData = { placas: [] };
    }
    
    const placas = placasData.placas || [];
    
    if (placas.length === 0) {
      throw new Error('Lista de placas vazia');
    }
    
    await sendPlacasMenu(supabase, conversationId, contactPhone, instanceName, placas, botFlow, currentState);
  } catch (error) {
    console.error('❌ Erro ao buscar placas:', error);
    
    const errorMessage = '❌ Erro ao buscar placas da API.\n\nDigite **0** para voltar ao menu ou falar com um atendente.';
    
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: errorMessage,
        sender_type: 'bot',
        created_at: new Date().toISOString(),
      });
    
    await sendEvolutionMessageSafe(instanceName, contactPhone, errorMessage);
  }
}

async function sendPlacasMenu(supabase: any, conversationId: string, contactPhone: string, instanceName: string, placas: string[], botFlow: any, currentState: any) {
  const placasFormatadas = placas.map((placa, idx) => `${idx + 1}. ${placa}`).join('\n');
  
  const message = `📋 Selecione uma placa:\n\n${placasFormatadas}\n\nDigite o número da placa desejada ou 0 para voltar ao menu.`;
  
  const newState = {
    ...currentState,
    currentNodeId: 'chamado-placa',
    collectedData: {
      ...currentState.collectedData,
      placas_disponiveis: placas,
    },
  };
  
  await supabase
    .from('conversations')
    .update({
      metadata: {
        bot_state: newState,
        bot_triggered: true,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: message,
      sender_type: 'bot',
      created_at: new Date().toISOString(),
    });
  
  await sendEvolutionMessageSafe(instanceName, contactPhone, message);
}

async function handleCreateChamado(supabase: any, conversationId: string, remoteJid: string, instanceName: string, conversationState: any) {
  console.log('Creating chamado...');
  
  // Buscar telefone do contato
  const { data: conv } = await supabase
    .from('conversations')
    .select('company_id, contact_id, metadata, contacts(phone)')
    .eq('id', conversationId)
    .single();
  
  const contactPhone = conv?.contacts?.phone;
  if (!contactPhone) {
    console.log('❌ Sem telefone para enviar resposta');
    return;
  }
  
  const collectedData = conversationState.collectedData;
  
  try {
    const placaSelecionada = collectedData['chamado-placa'];
    const corretiva = collectedData['chamado-corretiva'] === 'Sim';
    const local = collectedData['chamado-local'];
    const incidente = collectedData['chamado-agendamento'];
    const descricao = collectedData['chamado-descricao'];
    
    if (!placaSelecionada || placaSelecionada === 'Lista dinâmica de placas da API') {
      throw new Error('Placa não selecionada corretamente');
    }
    
    let numeroChamado = `CH-${Date.now().toString().slice(-8)}`;
    try {
      const ultimoChamadoRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=ultimoChamado`);
      if (ultimoChamadoRes.ok) {
        const ultimoChamadoData = await ultimoChamadoRes.json();
        numeroChamado = ultimoChamadoData.numeroChamado || numeroChamado;
      }
    } catch (apiError) {
      console.error('Erro ao buscar último chamado:', apiError);
    }
    
    let incidenteTimestamp = null;
    if (incidente) {
      try {
        const parsedDate = new Date(incidente);
        if (!isNaN(parsedDate.getTime())) {
          incidenteTimestamp = parsedDate.toISOString();
        }
      } catch (e) {
        console.error('Erro ao parsear data:', e);
      }
    }
    
    let chamadoData: any = null;
    
    try {
      const chamadoPayload = {
        placa: placaSelecionada,
        corretiva: corretiva ? 'Sim' : 'Não',
        local: local,
        descricao: descricao,
      };
      
      const createRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chamadoPayload),
      });
      
      if (createRes.status === 200 || createRes.status === 201) {
        try {
          const responseText = await createRes.text();
          chamadoData = JSON.parse(responseText);
        } catch (parseError) {
          chamadoData = { 
            numeroChamado: numeroChamado,
            ID: 'N/A'
          };
        }
      }
    } catch (googleError) {
      console.error('Erro ao criar no Google Sheets:', googleError);
    }
    
    const { data: chamado, error: chamadoError } = await supabase
      .from('chamados')
      .insert({
        company_id: conv?.company_id,
        conversation_id: conversationId,
        numero_chamado: chamadoData?.numeroChamado || numeroChamado,
        google_sheet_id: chamadoData?.ID || null,
        placa: placaSelecionada,
        local: local,
        descricao: descricao,
        corretiva: corretiva,
        agendamento: incidenteTimestamp,
        status: 'aberto',
        metadata: {
          origem: 'whatsapp',
          telefone: contactPhone,
        },
      })
      .select()
      .single();
    
    if (chamadoError) {
      throw chamadoError;
    }
    
    const finalNumeroChamado = chamadoData?.numeroChamado || numeroChamado;
    const successMessage = `✅ Chamado criado com sucesso!\n\n📋 Número: ${finalNumeroChamado}\n🚗 Placa: ${placaSelecionada}\n📍 Local: ${local}\n${corretiva ? '🔧 Tipo: Corretiva\n' : ''}${incidente ? `📅 Data/Hora do Incidente: ${incidente}\n` : ''}\n\nDigite 0 para voltar ao menu principal.`;
    
    await supabase
      .from('conversations')
      .update({
        metadata: {
          bot_state: {
            currentNodeId: 'chamado-sucesso',
            collectedData: {},
          },
          bot_triggered: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
    
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: successMessage,
        sender_type: 'bot',
        created_at: new Date().toISOString(),
      });
    
    await sendEvolutionMessageSafe(instanceName, contactPhone, successMessage);
    
  } catch (error) {
    console.error('Error creating chamado:', error);
    
    const errorMessage = '❌ Erro ao criar chamado. Por favor, tente novamente.\n\nDigite 0 para voltar ao menu.';
    
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: errorMessage,
        sender_type: 'bot',
        created_at: new Date().toISOString(),
      });
    
    await sendEvolutionMessageSafe(instanceName, contactPhone, errorMessage);
  }
}

// ============================================================
// FUNÇÃO SEGURA PARA ENVIO - SEMPRE USA NUMBER, NUNCA REMOTEJID
// ============================================================
async function sendEvolutionMessageSafe(instanceName: string, phoneNumber: string, text: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Evolution API configuration missing');
    return;
  }

  // VALIDAÇÃO: Telefone deve existir e ser numérico
  if (!phoneNumber || phoneNumber.length < 10 || !/^\d+$/.test(phoneNumber)) {
    console.error(`🚫 BLOQUEADO: Telefone inválido: ${phoneNumber || 'vazio'}`);
    return;
  }

  console.log(`📤 Sending message to: ${phoneNumber} via instance ${instanceName}`);

  try {
    // SEMPRE usar campo "number", NUNCA "remoteJid"
    const body = { 
      number: phoneNumber, 
      text: text 
    };
    
    console.log(`📤 Body:`, JSON.stringify(body));
    
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send message via Evolution API:', response.statusText, errorText);
    } else {
      console.log('✅ Message sent successfully via Evolution API');
    }
  } catch (error) {
    console.error('Error sending message via Evolution API:', error);
  }
}

function extractPhoneNumber(remoteJid: string): string {
  // NEVER extract phone from @lid
  if (remoteJid.includes('@lid')) {
    return '';
  }
  
  // Extract phone from valid WhatsApp formats
  const phoneMatch = remoteJid.match(/^(\d+)@/);
  if (phoneMatch) {
    const phone = phoneMatch[1];
    if (phone.startsWith('55') && phone.length >= 12) {
      return phone;
    }
    if (remoteJid.includes('@s.whatsapp.net') || remoteJid.includes('@c.us')) {
      return phone;
    }
  }
  
  return '';
}

function extractMessageContent(message: EvolutionMessage): string {
  const msgContent = message.message;
  
  if (msgContent.conversation) {
    return msgContent.conversation;
  }
  
  if (msgContent.extendedTextMessage?.text) {
    return msgContent.extendedTextMessage.text;
  }
  
  if (msgContent.imageMessage?.caption) {
    return msgContent.imageMessage.caption;
  }
  
  if (msgContent.videoMessage?.caption) {
    return msgContent.videoMessage.caption;
  }
  
  if (msgContent.documentMessage?.title || msgContent.documentMessage?.fileName) {
    return `[Documento: ${msgContent.documentMessage.fileName || msgContent.documentMessage.title}]`;
  }
  
  if (msgContent.imageMessage) {
    return '[Imagem]';
  }
  
  if (msgContent.videoMessage) {
    return '[Vídeo]';
  }
  
  if (msgContent.audioMessage) {
    return msgContent.audioMessage.ptt ? '[Áudio de voz]' : '[Áudio]';
  }
  
  if (msgContent.stickerMessage) {
    return '[Sticker]';
  }
  
  return '[Mensagem não suportada]';
}

function extractAttachment(message: EvolutionMessage): Attachment | null {
  const msgContent = message.message;
  
  if (msgContent.imageMessage) {
    return {
      type: 'image',
      url: msgContent.imageMessage.url || msgContent.imageMessage.directPath || '',
      mimeType: msgContent.imageMessage.mimetype,
    };
  }
  
  if (msgContent.videoMessage) {
    return {
      type: 'video',
      url: msgContent.videoMessage.url || msgContent.videoMessage.directPath || '',
      mimeType: msgContent.videoMessage.mimetype,
    };
  }
  
  if (msgContent.audioMessage) {
    return {
      type: 'audio',
      url: msgContent.audioMessage.url || msgContent.audioMessage.directPath || '',
      mimeType: msgContent.audioMessage.mimetype,
    };
  }
  
  if (msgContent.documentMessage) {
    return {
      type: 'document',
      url: msgContent.documentMessage.url || msgContent.documentMessage.directPath || '',
      filename: msgContent.documentMessage.fileName || msgContent.documentMessage.title,
      mimeType: msgContent.documentMessage.mimetype,
    };
  }
  
  return null;
}
