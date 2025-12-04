import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { BotFlowProcessor } from './bot-flow-processor.ts';

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

    // Process based on event type - normalize to uppercase for comparison
    const eventType = webhook.event.toUpperCase().replace('.', '_');
    
    switch (eventType) {
      case 'MESSAGES_UPSERT':
        await processNewMessage(supabase, webhook, payload);
        break;
      case 'CONNECTION_UPDATE':
        await processConnectionUpdate(supabase, webhook);
        break;
      default:
        console.log(`Unhandled event type: ${webhook.event}`);
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

    // Skip group messages for now
    if (message.key.remoteJid.includes('@g.us')) {
      console.log('Skipping group message');
      continue;
    }

    const remoteJid = message.key.remoteJid;
    const isLidFormat = remoteJid.includes('@lid');
    
    // CRITICAL: ALWAYS extract phone from remoteJid - it's the ONLY reliable source
    // When message is RECEIVED (fromMe: false), remoteJid = sender's number
    // NEVER use payload.sender as it can contain the INSTANCE number
    let phoneNumber = '';
    if (!isLidFormat) {
      phoneNumber = extractPhoneNumber(remoteJid);
      console.log(`📱 Extracted phone from remoteJid: ${phoneNumber}`);
    } else {
      console.warn(`⚠️ Contact using @lid format - no phone available from remoteJid: ${remoteJid}`);
    }
    
    const messageContent = extractMessageContent(message);
    const contactName = message.pushName || phoneNumber || 'Sem Nome';

    console.log(`Processing message from ${phoneNumber || 'NO_PHONE'} (remoteJid: ${remoteJid}): ${messageContent}`);

    // Get or create contact
    const contact = await getOrCreateContact(supabase, phoneNumber, contactName, remoteJid, webhook.instance);
    
    // Update profile picture if missing for existing contacts
    if (!contact.avatar_url && contact.phone && webhook.instance) {
      updateContactProfilePicture(supabase, contact, webhook.instance);
    }
    
    // Use contact's phone if available (for cases where we found existing contact)
    const contactPhone = contact.phone || phoneNumber;
    
    // For sending: keep original remoteJid format (supports @lid, @s.whatsapp.net, etc)
    // Only reconstruct if we have a phone number and it's a traditional WhatsApp channel
    let sendToRemoteJid = remoteJid;
    if (contactPhone && remoteJid.includes('@s.whatsapp.net')) {
      sendToRemoteJid = `${contactPhone}@s.whatsapp.net`;
    }
    
    console.log(`Contact phone: ${contactPhone || 'none'}, will send to: ${sendToRemoteJid}`);
    
    // Get or create conversation (store remoteJid in metadata for later use)
    const conversation = await getOrCreateConversation(supabase, contact.id, contactPhone, contactName, remoteJid);
    
    // Save message - returns null if duplicate
    const savedMessage = await saveMessage(supabase, conversation.id, message, messageContent, contactPhone, webhook.instance);
    
    // PROTEÇÃO: Se a mensagem foi duplicada, não aciona o bot
    if (!savedMessage) {
      console.log('⚠️ Mensagem duplicada - ignorando trigger do bot');
      continue;
    }

    // Trigger bot response (supports all channel types including @lid)
    console.log(`✅ Triggering bot for contact ${contact.id} (${contactName}). Phone: ${contactPhone || 'N/A'}, Send to: ${sendToRemoteJid}`);
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

// Fetch profile picture from WhatsApp via Evolution API
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

async function getOrCreateContact(supabase: any, phoneNumber: string, name: string, remoteJid: string, instanceName?: string) {
  // Get first company (will be used for searches)
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .limit(1);
  const companyId = companies?.[0]?.id;

  console.log(`🔍 Searching contact - Phone: ${phoneNumber || 'N/A'}, Name: ${name}, RemoteJid: ${remoteJid}`);

  // PRIORITY 1: Try to find by phone number (most reliable for WhatsApp)
  if (phoneNumber) {
    const { data: existingByPhone } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .eq('phone', phoneNumber)
      .maybeSingle();

  if (existingByPhone) {
      console.log('✅ Found existing contact by phone:', existingByPhone.id);
      // Update metadata with new remoteJid if different
      const currentRemoteJid = existingByPhone.metadata?.remoteJid;
      if (currentRemoteJid !== remoteJid) {
        await supabase
          .from('contacts')
          .update({ 
            metadata: { ...existingByPhone.metadata, remoteJid: remoteJid },
            name: name,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingByPhone.id);
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
    
    // CRITICAL: ALWAYS update phone if we have a valid one (even if contact has one already)
    // This fixes @lid contacts that may have wrong/empty phones
    if (phoneNumber && phoneNumber.startsWith('55')) {
      console.log(`📞 Updating contact ${existingByRemoteJid.id} with phone: ${phoneNumber} (old: ${existingByRemoteJid.phone || 'empty'})`);
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ 
          phone: phoneNumber,
          name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingByRemoteJid.id);
      
      if (updateError) {
        console.error('Error updating contact phone:', updateError);
      } else {
        console.log('✅ Phone updated successfully');
        // Return updated contact
        existingByRemoteJid.phone = phoneNumber;
        existingByRemoteJid.name = name;
      }
    }
    
    return existingByRemoteJid;
  }

  // PRIORITY 3: Try to find by name (for cases where remoteJid changed)
  if (name && phoneNumber) {
    const { data: existingByName } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .ilike('name', name)
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (existingByName) {
      console.log('✅ Found existing contact by name+phone:', existingByName.id);
      // Update metadata with remoteJid
      await supabase
        .from('contacts')
        .update({ 
          metadata: { ...existingByName.metadata, remoteJid: remoteJid },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingByName.id);
      return existingByName;
    }
  }

  // PRIORITY 4: Create new contact
  console.log('➕ Creating new contact...');
  
  // Try to fetch profile picture for new contact
  let avatarUrl = null;
  if (phoneNumber && instanceName) {
    avatarUrl = await fetchProfilePicture(phoneNumber, instanceName);
  }
  
  const { data: newContact, error: insertError } = await supabase
    .from('contacts')
    .insert({
      name: name,
      phone: phoneNumber || null,
      email: null,
      avatar_url: avatarUrl,
      company_id: companyId,
      metadata: { remoteJid: remoteJid },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating contact:', insertError);
    throw insertError;
  }

  console.log(`✅ Created new contact: ${newContact.id}, Phone: ${newContact.phone || 'N/A'}, Avatar: ${avatarUrl ? 'yes' : 'no'}`);
  return newContact;
}

// Update existing contact's profile picture if missing
async function updateContactProfilePicture(supabase: any, contact: any, instanceName?: string) {
  if (!contact || !contact.phone || contact.avatar_url || !instanceName) {
    return;
  }
  
  console.log(`📷 Updating profile picture for existing contact ${contact.id}...`);
  
  const avatarUrl = await fetchProfilePicture(contact.phone, instanceName);
  
  if (avatarUrl) {
    const { error } = await supabase
      .from('contacts')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);
    
    if (error) {
      console.error('❌ Error updating contact avatar:', error);
    } else {
      console.log(`✅ Profile picture updated for ${contact.name}`);
      contact.avatar_url = avatarUrl;
    }
  }
}

async function getOrCreateConversation(supabase: any, contactId: string, phoneNumber: string, contactName: string, remoteJid: string) {
  // Get contact to find company_id
  const { data: contact } = await supabase
    .from('contacts')
    .select('company_id')
    .eq('id', contactId)
    .single();

  // CRITICAL: Buscar conversa existente ANTES de tentar criar
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contactId)
    .eq('channel', 'whatsapp')
    .in('status', ['open', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingConversation) {
    console.log('✅ Found existing conversation:', existingConversation.id);
    
    // Update last message time
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', existingConversation.id);
    
    return existingConversation;
  }

  // No existing conversation found - create new one
  console.log('➕ Creating new conversation for contact:', contactId);
  
  const { data: newConversation, error: insertError } = await supabase
    .from('conversations')
    .insert({
      contact_id: contactId,
      channel: 'whatsapp',
      status: 'open',
      company_id: contact?.company_id,
      metadata: { remoteJid: remoteJid },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    // Se falhou por violação de unique constraint (race condition), buscar a existente
    if (insertError.code === '23505') {
      console.log('⚠️ Violação de constraint único - buscando conversa existente...');
      
      const { data: fallbackConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('channel', 'whatsapp')
        .in('status', ['open', 'pending'])
        .limit(1)
        .maybeSingle();
      
      if (fallbackConversation) {
        console.log('✅ Conversa encontrada após constraint:', fallbackConversation.id);
        return fallbackConversation;
      }
    }
    
    console.error('❌ Error creating conversation:', insertError);
    throw insertError;
  }

  console.log('✅ Created new conversation:', newConversation.id);
  return newConversation;
}

// Verificar se a mensagem já foi processada (idempotência)
async function isMessageAlreadyProcessed(supabase: any, externalId: string): Promise<boolean> {
  const { data: existingMessage } = await supabase
    .from('messages')
    .select('id')
    .contains('metadata', { external_id: externalId })
    .maybeSingle();
  
  if (existingMessage) {
    console.log(`⚠️ Mensagem ${externalId} já foi processada anteriormente. Ignorando duplicata.`);
    return true;
  }
  return false;
}

// Verificar anti-flood: se o bot já respondeu recentemente (< 2 segundos)
async function shouldSkipBotResponse(supabase: any, conversationId: string): Promise<boolean> {
  const twoSecondsAgo = new Date(Date.now() - 2000).toISOString();
  
  const { data: recentBotMessage } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('sender_type', 'bot')
    .gte('created_at', twoSecondsAgo)
    .limit(1);
  
  if (recentBotMessage && recentBotMessage.length > 0) {
    console.log(`⚠️ Bot já respondeu nos últimos 2 segundos. Ignorando para evitar flood.`);
    return true;
  }
  return false;
}

// Download media from WhatsApp via Evolution API and upload to Supabase Storage
async function downloadAndUploadMedia(supabase: any, attachment: Attachment, message: EvolutionMessage, conversationId: string, instanceName: string): Promise<string | null> {
  if (!attachment.url || !attachment.url.startsWith('http')) {
    console.log('⚠️ No valid URL for attachment download');
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
    
    // Evolution API endpoint to get base64 from media message
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
      console.error('❌ Failed to download media from Evolution API:', mediaResponse.status, await mediaResponse.text());
      return null;
    }
    
    const mediaData = await mediaResponse.json();
    
    if (!mediaData.base64) {
      console.error('❌ No base64 data in response');
      return null;
    }
    
    console.log('✅ Media downloaded, uploading to Supabase Storage...');
    
    // Convert base64 to binary
    const base64Data = mediaData.base64.replace(/^data:[^;]+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate unique filename
    const extension = getExtensionFromMimeType(attachment.mimeType || 'application/octet-stream');
    const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    // Upload to Supabase Storage
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
    
    // Get public URL
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
  
  // PROTEÇÃO 1: Verificar se a mensagem já foi processada
  const alreadyProcessed = await isMessageAlreadyProcessed(supabase, externalId);
  if (alreadyProcessed) {
    return null; // Retorna null para indicar que não deve processar
  }
  
  // Extrair informações de anexo se houver
  let attachment = extractAttachment(message);
  
  // Se tiver anexo, baixar e fazer upload para o Supabase Storage
  if (attachment && attachment.url) {
    console.log('📎 Attachment detected:', attachment.type, attachment.url);
    
    const storageUrl = await downloadAndUploadMedia(supabase, attachment, message, conversationId, instanceName);
    
    if (storageUrl) {
      // Substituir URL temporária do WhatsApp pela URL permanente do Supabase
      attachment = {
        ...attachment,
        url: storageUrl,
      };
      console.log('✅ Attachment URL replaced with Supabase Storage URL');
    } else {
      console.warn('⚠️ Failed to upload media, keeping original URL (may expire)');
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
    // Se o erro for de constraint única, é duplicata
    if (error.code === '23505') {
      console.log('⚠️ Mensagem duplicada detectada por constraint. Ignorando.');
      return null;
    }
    console.error('Error saving message:', error);
    throw error;
  }
  
  if (!data) {
    console.error('Message insert returned no data');
    throw new Error('Failed to save message - no data returned');
  }

  console.log('Message saved successfully with ID:', data.id);
  return data;
}

async function triggerBotResponse(supabase: any, conversationId: string, messageContent: string, remoteJid: string, instanceName: string) {
  console.log('Triggering bot response...');
  
  // Buscar conversa e bot em paralelo para reduzir latência
  const [floodCheck, conversationResult, botsResult] = await Promise.all([
    shouldSkipBotResponse(supabase, conversationId),
    supabase.from('conversations').select('status, metadata, contacts(phone)').eq('id', conversationId).single(),
    supabase.from('bots').select('*').contains('channels', ['whatsapp']).eq('status', 'published').limit(1)
  ]);
  
  // PROTEÇÃO 2: Anti-flood - evitar múltiplas respostas do bot
  if (floodCheck) {
    return;
  }

  const { data: conversation, error: convError } = conversationResult;
  if (convError) {
    console.error('Error fetching conversation:', convError);
    return;
  }

  if (conversation.status === 'pending') {
    console.log('⏸️ Conversa em status "pending" - aguardando atendente. Bot não responderá.');
    return;
  }
  
  const { data: bots, error: botsError } = botsResult;
  if (botsError) {
    console.error('Error fetching bots:', botsError);
    return;
  }

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

  // Processar o fluxo do bot (import estático no topo do arquivo)
  const processor = new BotFlowProcessor(bot.flows, conversationState);
  const result = await processor.processUserInput(messageContent);

  // Preparar atualização da conversa
  const conversationUpdate: any = {
    metadata: {
      ...conversation?.metadata,
      bot_state: result.newState,
      bot_triggered: true,
    },
    status: result.shouldTransferToAgent ? 'pending' : 'open',
    updated_at: new Date().toISOString(),
  };

  // Se for transferência, atribuir ao primeiro usuário disponível
  if (result.shouldTransferToAgent) {
    console.log('📞 Transferindo para atendente...');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('is_active', true)
      .limit(1);
    
    if (profiles && profiles.length > 0) {
      conversationUpdate.assigned_to = profiles[0].user_id;
      console.log('✅ Conversa atribuída ao usuário:', profiles[0].user_id);
    }
  }

  // Processar chamada de API se necessário
  if (result.shouldCallApi) {
    // Atualizar conversa antes de chamar API
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

  // Obter telefone do contato para envio direto
  const contactPhone = conversation?.contacts?.phone;
  const recipientJid = contactPhone ? `${contactPhone}@s.whatsapp.net` : remoteJid;

  // Executar em paralelo: salvar mensagem + atualizar conversa + enviar WhatsApp
  await Promise.all([
    supabase.from('messages').insert({
      conversation_id: conversationId,
      content: result.response,
      sender_type: 'bot',
      metadata: { bot_id: bot.id, bot_name: bot.name },
      created_at: new Date().toISOString(),
    }),
    supabase.from('conversations').update(conversationUpdate).eq('id', conversationId),
    sendEvolutionMessageFast(instanceName, recipientJid, result.response)
  ]);
}

async function handleFetchPlacas(supabase: any, conversationId: string, remoteJid: string, instanceName: string, botFlow: any, currentState: any) {
  console.log('📋 Iniciando busca de placas - Canal WhatsApp');
  
  try {
    // Buscar placas exatamente como o canal web faz
    console.log('🔄 Buscando placas da API:', `${GOOGLE_SCRIPT_URL}?action=placas`);
    const placasRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=placas`);
    console.log('✅ Status da resposta:', placasRes.status);
    console.log('📄 Headers:', JSON.stringify(Object.fromEntries(placasRes.headers.entries())));
    
    const placasText = await placasRes.text();
    console.log('📄 Resposta completa (primeiros 200 chars):', placasText.substring(0, 200));
    console.log('📏 Tamanho da resposta:', placasText.length, 'chars');
    
    let placasData;
    try {
      placasData = JSON.parse(placasText);
      console.log('✅ Parse JSON bem sucedido:', JSON.stringify(placasData));
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      console.error('📄 Resposta que falhou no parse:', placasText);
      placasData = { placas: [] };
    }
    
    const placas = placasData.placas || [];
    console.log('📊 Total de placas recebidas:', placas.length);
    console.log('📋 Placas:', JSON.stringify(placas));
    
    if (placas.length === 0) {
      throw new Error('Lista de placas vazia');
    }
    
    await sendPlacasMenu(supabase, conversationId, remoteJid, instanceName, placas, botFlow, currentState);
  } catch (error) {
    console.error('❌ Erro ao buscar placas:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    
    const errorMessage = '❌ Erro ao buscar placas da API.\n\nDigite **0** para voltar ao menu ou falar com um atendente.';
    
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: errorMessage,
        sender_type: 'bot',
        created_at: new Date().toISOString(),
      });
    
    await sendEvolutionMessage(supabase, conversationId, instanceName, remoteJid, errorMessage);
  }
}

async function sendPlacasMenu(supabase: any, conversationId: string, remoteJid: string, instanceName: string, placas: string[], botFlow: any, currentState: any) {
  // Formatar todas as placas para WhatsApp (igual ao canal web)
  const placasFormatadas = placas.map((placa, idx) => `${idx + 1}. ${placa}`).join('\n');
  
  const message = `📋 Selecione uma placa:\n\n${placasFormatadas}\n\nDigite o número da placa desejada ou 0 para voltar ao menu.`;
  
  // Atualizar estado com TODAS as placas disponíveis
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
  
  await sendEvolutionMessage(supabase, conversationId, instanceName, remoteJid, message);
}

async function handleCreateChamado(supabase: any, conversationId: string, remoteJid: string, instanceName: string, conversationState: any) {
  console.log('Creating chamado...');
  
  const collectedData = conversationState.collectedData;
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0viYlAJ_-v00BzqRgMROE0wdvixohvQ4d949mTvRQk_eRdqN-CsxQeAldpV6HR2xlBQ/exec';
  
  try {
    // Extrair dados coletados
    const placaSelecionada = collectedData['chamado-placa'];
    const corretiva = collectedData['chamado-corretiva'] === 'Sim';
    const local = collectedData['chamado-local'];
    const incidente = collectedData['chamado-agendamento']; // Mantém nome interno mas é "incidente" para usuário
    const descricao = collectedData['chamado-descricao'];
    
    console.log('Dados coletados:', { placaSelecionada, corretiva, local, incidente, descricao });
    
    // Validar placa
    if (!placaSelecionada || placaSelecionada === 'Lista dinâmica de placas da API') {
      throw new Error('Placa não selecionada corretamente');
    }
    
    // Buscar company_id da conversa
    const { data: conversation } = await supabase
      .from('conversations')
      .select('company_id, contact_id, metadata')
      .eq('id', conversationId)
      .single();
    
    const phoneNumber = extractPhoneNumber(remoteJid);
    
    // Buscar último número de chamado da API Google Sheets (igual ao canal web)
    let numeroChamado = `CH-${Date.now().toString().slice(-8)}`;
    try {
      console.log('Buscando último chamado da API...');
      const ultimoChamadoRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=ultimoChamado`);
      if (ultimoChamadoRes.ok) {
        const ultimoChamadoData = await ultimoChamadoRes.json();
        numeroChamado = ultimoChamadoData.numeroChamado || numeroChamado;
        console.log('Número do chamado obtido:', numeroChamado);
      }
    } catch (apiError) {
      console.error('Erro ao buscar último chamado, usando timestamp:', apiError);
    }
    
    // Converter incidente para timestamp de forma robusta
    let incidenteTimestamp = null;
    if (incidente) {
      try {
        const parsedDate = new Date(incidente);
        if (!isNaN(parsedDate.getTime())) {
          incidenteTimestamp = parsedDate.toISOString();
        }
      } catch (e) {
        console.error('Erro ao parsear data do incidente:', e);
      }
    }
    
    // Enviar para Google Sheets primeiro (igual ao canal web)
    let chamadoData: any = null;
    let googleSheetsSucesso = false;
    
    try {
      console.log('Enviando para Google Sheets...');
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
        googleSheetsSucesso = true;
        console.log('✅ Chamado criado no Google Sheets');
        
        try {
          const responseText = await createRes.text();
          chamadoData = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Usando dados locais');
          chamadoData = { 
            numeroChamado: numeroChamado,
            ID: 'N/A'
          };
        }
      }
    } catch (googleError) {
      console.error('Erro ao criar no Google Sheets:', googleError);
    }
    
    // Criar chamado no Supabase
    const { data: chamado, error: chamadoError } = await supabase
      .from('chamados')
      .insert({
        company_id: conversation?.company_id,
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
          telefone: phoneNumber,
        },
      })
      .select()
      .single();
    
    if (chamadoError) {
      console.error('Erro ao criar chamado no Supabase:', chamadoError);
      throw chamadoError;
    }
    
    console.log('✅ Chamado criado no Supabase:', chamado);
    
    // Mensagem de sucesso com o número correto e placa
    const finalNumeroChamado = chamadoData?.numeroChamado || numeroChamado;
    const successMessage = `✅ Chamado criado com sucesso!\n\n📋 Número: ${finalNumeroChamado}\n🚗 Placa: ${placaSelecionada}\n📍 Local: ${local}\n${corretiva ? '🔧 Tipo: Corretiva\n' : ''}${incidente ? `📅 Data/Hora do Incidente: ${incidente}\n` : ''}\n\nDigite 0 para voltar ao menu principal.`;
    
    // Resetar estado para o nó de sucesso
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
    
    await sendEvolutionMessage(supabase, conversationId, instanceName, remoteJid, successMessage);
    
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
    
    await sendEvolutionMessage(supabase, conversationId, instanceName, remoteJid, errorMessage);
  }
}

// Função otimizada para envio rápido - sem query ao banco
async function sendEvolutionMessageFast(instanceName: string, recipientJid: string, text: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Evolution API configuration missing');
    return;
  }

  console.log(`Sending bot message to: ${recipientJid} via instance ${instanceName}`);

  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: recipientJid,
        text: text,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send message via Evolution API:', response.statusText);
    } else {
      console.log('Message sent successfully via Evolution API');
    }
  } catch (error) {
    console.error('Error sending message via Evolution API:', error);
  }
}

async function sendEvolutionMessage(supabase: any, conversationId: string, instanceName: string, remoteJid: string, text: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Evolution API configuration missing');
    return;
  }

  // Buscar contato da conversa para usar telefone real se disponível
  let recipientJid = remoteJid;
  try {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('contacts(phone)')
      .eq('id', conversationId)
      .single();

    if (conversation?.contacts?.phone) {
      recipientJid = `${conversation.contacts.phone}@s.whatsapp.net`;
      console.log(`Bot using contact phone: ${conversation.contacts.phone} -> ${recipientJid}`);
    } else {
      console.log(`Bot using remoteJid from metadata: ${remoteJid}`);
    }
  } catch (error) {
    console.error('Error fetching contact phone, using remoteJid:', error);
  }

  await sendEvolutionMessageFast(instanceName, recipientJid, text);
}

function extractPhoneNumber(remoteJid: string): string {
  // NEVER extract phone from @lid - it's not a real phone number
  if (remoteJid.includes('@lid')) {
    return '';
  }
  
  // Extract phone number from valid WhatsApp formats only
  // Supports: @s.whatsapp.net, @c.us
  const phoneMatch = remoteJid.match(/^(\d+)@/);
  if (phoneMatch) {
    const phone = phoneMatch[1];
    // Validate: Brazilian phones should start with 55 and be reasonable length
    if (phone.startsWith('55') && phone.length >= 12) {
      return phone;
    }
    // For other valid WhatsApp formats, return as-is
    if (remoteJid.includes('@s.whatsapp.net') || remoteJid.includes('@c.us')) {
      return phone;
    }
  }
  
  // No valid phone found
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