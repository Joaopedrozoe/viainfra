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

    // Process based on event type
    switch (webhook.event) {
      case 'MESSAGES_UPSERT':
        await processNewMessage(supabase, webhook);
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

async function processNewMessage(supabase: any, webhook: EvolutionWebhook) {
  console.log('Processing new message...');
  
  if (!webhook.data || !Array.isArray(webhook.data)) {
    console.log('No message data found');
    return;
  }

  for (const messageData of webhook.data) {
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
    
    // Get or create conversation
    const conversation = await getOrCreateConversation(supabase, contact.id, phoneNumber, contactName);
    
    // Save message
    await saveMessage(supabase, conversation.id, message, messageContent, phoneNumber);

    // Trigger bot response if needed
    await triggerBotResponse(supabase, conversation.id, messageContent, phoneNumber, webhook.instance);
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

async function getOrCreateContact(supabase: any, phoneNumber: string, name: string) {
  // First, try to find existing contact
  const { data: existingContact, error: selectError } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone', phoneNumber)
    .single();

  if (existingContact) {
    console.log('Found existing contact:', existingContact.id);
    return existingContact;
  }

  // Create new contact
  const { data: newContact, error: insertError } = await supabase
    .from('contacts')
    .insert({
      name: name,
      phone: phoneNumber,
      email: null,
      channel: 'whatsapp',
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
  // Try to find existing conversation
  const { data: existingConversation, error: selectError } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contactId)
    .eq('channel', 'whatsapp')
    .eq('status', 'active')
    .single();

  if (existingConversation) {
    console.log('Found existing conversation:', existingConversation.id);
    return existingConversation;
  }

  // Create new conversation
  const { data: newConversation, error: insertError } = await supabase
    .from('conversations')
    .insert({
      contact_id: contactId,
      channel: 'whatsapp',
      status: 'active',
      last_message_at: new Date().toISOString(),
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
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      sender_type: 'user',
      sender_name: message.pushName || phoneNumber,
      message_type: 'text',
      external_id: message.key.id,
      created_at: new Date(message.messageTimestamp * 1000).toISOString()
    });

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  console.log('Message saved successfully');
}

async function triggerBotResponse(supabase: any, conversationId: string, messageContent: string, phoneNumber: string, instanceName: string) {
  console.log('Triggering bot response...');
  
  // Get active agents for WhatsApp
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .contains('channels', ['WhatsApp'])
    .eq('status', 'active');

  if (agentsError || !agents || agents.length === 0) {
    console.log('No active WhatsApp agents found');
    return;
  }

  // Use the first active agent for now
  const agent = agents[0];
  console.log('Using agent:', agent.name);

  // Simple bot logic - respond with agent's welcome message or default
  const botResponse = agent.description || 'Olá! Como posso ajudá-lo hoje?';

  // Save bot response to database
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: botResponse,
      sender_type: 'bot',
      sender_name: agent.name,
      message_type: 'text',
      created_at: new Date().toISOString()
    });

  // Send response via Evolution API
  await sendEvolutionMessage(instanceName, phoneNumber, botResponse);
}

async function sendEvolutionMessage(instanceName: string, phoneNumber: string, text: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

  if (!evolutionApiUrl || !evolutionApiKey) {
    console.error('Evolution API configuration missing');
    return;
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
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