import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      url: string;
      caption?: string;
    };
    audioMessage?: {
      url: string;
    };
    videoMessage?: {
      url: string;
      caption?: string;
    };
    documentMessage?: {
      title?: string;
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
  const timestamp = new Date().toISOString();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Log ALL incoming requests for debugging
  console.log(`\n🔔 [${timestamp}] Webhook triggered:`, {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  console.log('Evolution webhook received:', req.method, req.url);

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('📦 RAW PAYLOAD:', JSON.stringify(payload, null, 2));
    
    // Log EVERY field in the payload for debugging
    console.log('🔍 Payload Analysis:', {
      hasEvent: !!payload.event,
      eventValue: payload.event,
      eventType: typeof payload.event,
      hasInstance: !!payload.instance,
      instanceValue: payload.instance,
      hasData: !!payload.data,
      dataType: typeof payload.data,
      dataKeys: payload.data ? Object.keys(payload.data) : [],
      allPayloadKeys: Object.keys(payload)
    });

    // Parse webhook data
    const webhook = parseWebhookPayload(payload);
    if (!webhook) {
      console.error('❌ Invalid webhook payload structure - missing event or instance');
      console.error('❌ Payload received:', JSON.stringify(payload));
      return new Response('Invalid payload', { status: 400, headers: corsHeaders });
    }

    console.log(`✅ Parsed Event: ${webhook.event} | Instance: ${webhook.instance}`);

    // Process based on event type
    switch (webhook.event) {
      case 'MESSAGES_UPSERT':
        console.log('📨 ===== PROCESSING MESSAGE =====');
        await processNewMessage(supabase, webhook);
        console.log('📨 ===== MESSAGE PROCESSING COMPLETE =====');
        break;
      case 'MESSAGES_UPDATE':
        console.log('📝 Message update event (ignored for now)');
        break;
      case 'CONNECTION_UPDATE':
        console.log('🔌 ===== PROCESSING CONNECTION UPDATE =====');
        await processConnectionUpdate(supabase, webhook);
        console.log('🔌 ===== CONNECTION UPDATE COMPLETE =====');
        break;
      case 'SEND_MESSAGE':
        console.log('📤 Send confirmation event');
        break;
      case 'CALL':
        console.log('📞 Call event (ignored)');
        break;
      case 'QRCODE_UPDATED':
        console.log('📱 QR Code updated event (ignored)');
        break;
      default:
        console.log(`⚠️ ===== UNKNOWN EVENT TYPE: ${webhook.event} =====`);
        console.log('⚠️ Full webhook data:', JSON.stringify(webhook, null, 2));
    }

    console.log('✅ Success\n');
    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Stack:', error.stack);
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

    // Normalize event name to uppercase with underscores
    // Evolution API can send events like "messages.upsert" or "MESSAGES_UPSERT"
    const normalizedEvent = payload.event
      .toUpperCase()
      .replace(/\./g, '_');

    return {
      event: normalizedEvent,
      instance: payload.instance,
      data: payload.data,
    };
  } catch (error) {
    console.error('Failed to parse webhook payload:', error);
    return null;
  }
}

async function processNewMessage(supabase: any, webhook: EvolutionWebhook) {
  console.log('🔍 Processing new message - webhook.data type:', typeof webhook.data);
  console.log('🔍 webhook.data isArray:', Array.isArray(webhook.data));
  console.log('🔍 webhook.data content:', JSON.stringify(webhook.data, null, 2));
  
  if (!webhook.data) {
    console.log('❌ No webhook.data found at all!');
    return;
  }

  // Handle both array and single object formats
  const messages = Array.isArray(webhook.data) ? webhook.data : [webhook.data];
  
  if (messages.length === 0) {
    console.log('❌ Empty messages array');
    return;
  }

  console.log(`✅ Processing ${messages.length} message(s)`);

  for (const messageData of messages) {
    try {
      const message = messageData.message as EvolutionMessage;
      
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

      const phoneNumber = extractPhoneNumber(message.key.remoteJid);
      const messageContent = extractMessageContent(message);
      const contactName = message.pushName || phoneNumber;

      console.log(`Processing message from ${phoneNumber}: ${messageContent}`);

      // Get or create contact
      const contact = await getOrCreateContact(supabase, phoneNumber, contactName);
      console.log('Contact obtained:', contact.id);
      
      // Get or create conversation
      const conversation = await getOrCreateConversation(supabase, contact.id, phoneNumber, contactName);
      console.log('Conversation obtained:', conversation.id);
      
      // Save message
      await saveMessage(supabase, conversation.id, message, messageContent, phoneNumber);
      console.log('Message saved successfully');

      // Trigger bot response if needed
      await triggerBotResponse(supabase, conversation.id, messageContent, phoneNumber, webhook.instance);
      console.log('Bot response triggered');
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }
}

async function processConnectionUpdate(supabase: any, webhook: EvolutionWebhook) {
  console.log('Processing connection update:', webhook.data);
  
  // Update instance status in database
  const { error } = await supabase
    .from('whatsapp_instances')
    .upsert(
      {
        instance_name: webhook.instance,
        status: webhook.data.state || 'unknown',
        connection_state: webhook.data.state || 'unknown',
        phone_number: webhook.data.wuid?.split('@')[0] || null,
        updated_at: new Date().toISOString()
      },
      { 
        onConflict: 'instance_name',
        ignoreDuplicates: false 
      }
    );

  if (error) {
    console.error('❌ Error updating instance status:', error);
  } else {
    console.log('✅ Instance status updated successfully');
  }
}

async function getOrCreateContact(supabase: any, phoneNumber: string, name: string) {
  // First, try to find existing contact by phone
  const { data: existingContact, error: selectError } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone', phoneNumber)
    .maybeSingle();

  if (existingContact) {
    console.log('Found existing contact:', existingContact.id);
    return existingContact;
  }

  // Get first company (in production, you'd determine this differently)
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .limit(1);

  const companyId = companies?.[0]?.id;

  // Create new contact
  const { data: newContact, error: insertError } = await supabase
    .from('contacts')
    .insert({
      name: name,
      phone: phoneNumber,
      email: null,
      company_id: companyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating contact:', insertError);
    throw insertError;
  }

  console.log('Created new contact:', newContact.id);
  return newContact;
}

async function getOrCreateConversation(supabase: any, contactId: string, phoneNumber: string, contactName: string) {
  // Get contact to find company_id
  const { data: contact } = await supabase
    .from('contacts')
    .select('company_id')
    .eq('id', contactId)
    .single();

  // Try to find existing open conversation
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contactId)
    .eq('channel', 'whatsapp')
    .in('status', ['open', 'pending'])
    .maybeSingle();

  if (existingConversation) {
    console.log('Found existing conversation:', existingConversation.id);
    
    // Update last message time
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', existingConversation.id);
    
    return existingConversation;
  }

  // Create new conversation
  const { data: newConversation, error: insertError } = await supabase
    .from('conversations')
    .insert({
      contact_id: contactId,
      channel: 'whatsapp',
      status: 'open',
      company_id: contact?.company_id,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating conversation:', insertError);
    throw insertError;
  }

  console.log('Created new conversation:', newConversation.id);
  return newConversation;
}

async function saveMessage(supabase: any, conversationId: string, message: EvolutionMessage, content: string, phoneNumber: string) {
  console.log('Attempting to save message:', {
    conversationId,
    content,
    sender_type: 'user'
  });

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      sender_type: 'user',
      metadata: { 
        external_id: message.key.id,
        sender_name: message.pushName || phoneNumber
      },
      created_at: new Date(message.messageTimestamp * 1000).toISOString()
    })
    .select();

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  console.log('Message saved successfully:', data);
  return data;
}

async function triggerBotResponse(supabase: any, conversationId: string, messageContent: string, phoneNumber: string, instanceName: string) {
  console.log('🤖 Triggering bot response via chat-bot function...');

  try {
    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('company_id, contact_id, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('❌ Error fetching conversation:', convError);
      return;
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('name, phone')
      .eq('id', conversation.contact_id)
      .single();

    if (contactError || !contact) {
      console.error('❌ Error fetching contact:', contactError);
      return;
    }

    console.log('📞 Contact:', contact.name, contact.phone);
    console.log('💬 Message:', messageContent);

    // Get current bot state from conversation metadata
    const currentState = conversation.metadata?.botState || null;
    const action = currentState ? 'continue' : 'start';

    console.log('🔄 Bot action:', action, 'State:', currentState);

    // Call the chat-bot function with current state AND conversation/contact IDs
    console.log('📤 Calling chat-bot with:', {
      conversationId,
      contactId: conversation.contact_id,
      companyId: conversation.company_id,
      action,
      hasState: !!currentState,
    });

    const chatBotResponse = await supabase.functions.invoke('chat-bot', {
      body: {
        action,
        state: currentState ? {
          ...currentState,
          conversationId: conversationId,
          contactId: conversation.contact_id,
          companyId: conversation.company_id,
        } : {
          mode: 'menu',
          conversationId: conversationId,
          contactId: conversation.contact_id,
          companyId: conversation.company_id,
        },
        userMessage: messageContent,
        contactInfo: {
          name: contact.name,
          phone: contact.phone,
        },
        companyId: conversation.company_id,
        conversationId: conversationId,
        contactId: conversation.contact_id,
      }
    });

    console.log('📥 Chat-bot response status:', chatBotResponse.error ? 'ERROR' : 'OK');
    if (chatBotResponse.error) {
      console.error('❌ Error calling chat-bot:', JSON.stringify(chatBotResponse.error));
      return;
    }

    console.log('📥 Chat-bot response data:', JSON.stringify(chatBotResponse.data));

    const botResponse = chatBotResponse.data;
    console.log('✅ Bot response received:', {
      message: botResponse.message?.substring(0, 100),
      mode: botResponse.mode,
      hasState: !!botResponse.state
    });

    // Update conversation metadata with new state
    await supabase
      .from('conversations')
      .update({ 
        metadata: { 
          ...conversation.metadata, 
          botState: botResponse.state,
          lastBotInteraction: new Date().toISOString()
        },
        // Update status if bot transferred to agent
        ...(botResponse.mode === 'atendente' ? { status: 'pending' } : {})
      })
      .eq('id', conversationId);

    // Send response via Evolution API if there's a message
    if (botResponse.message) {
      await sendEvolutionMessage(instanceName, phoneNumber, botResponse.message);
      console.log('✅ Bot response sent via WhatsApp');
    }

  } catch (error) {
    console.error('❌ Error in bot response:', error);
  }
}

async function sendEvolutionMessage(instanceName: string, phoneNumber: string, text: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Evolution API configuration missing');
    return;
  }

  try {
    const payload = {
      number: phoneNumber,
      text: text,
    };

    console.log('📤 Sending Evolution message:', {
      url: `${evolutionApiUrl}/message/sendText/${instanceName}`,
      number: phoneNumber,
      textLength: text.length
    });

    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    
    console.log('📥 Evolution API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      body: responseText
    });
    
    if (!response.ok) {
      console.error('❌ Failed to send message via Evolution API:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`Evolution API error: ${response.status} - ${responseText}`);
    } else {
      console.log('✅ Message sent successfully via Evolution API to WhatsApp number:', phoneNumber);
    }
  } catch (error) {
    console.error('Error sending message via Evolution API:', error);
  }
}

function extractPhoneNumber(remoteJid: string): string {
  return remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
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
  
  if (msgContent.imageMessage) {
    return '[Imagem]';
  }
  
  if (msgContent.videoMessage) {
    return '[Vídeo]';
  }
  
  if (msgContent.audioMessage) {
    return '[Áudio]';
  }
  
  return '[Mensagem não suportada]';
}