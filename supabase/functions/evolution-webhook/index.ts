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
  console.log('Triggering bot response...');

  try {
    // Get the conversation to check company_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('company_id, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError);
      return;
    }

    // Get published bot for this company
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('company_id', conversation.company_id)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (botError) {
      console.error('Error fetching bot:', botError);
      return;
    }

    if (!bot) {
      console.log('No published bot found for this company');
      return;
    }

    console.log('Using bot:', bot.name);

    // Get current node from conversation metadata
    const currentNodeId = conversation.metadata?.currentNodeId || null;
    
    let responseMessage = '';
    let nextNodeId = null;

    if (!currentNodeId) {
      // Start of conversation - find start node
      const startNode = bot.flows.nodes.find((node: any) => node.type === 'start');
      if (startNode) {
        responseMessage = startNode.data.message;
        
        // Find next node (menu)
        const nextEdge = bot.flows.edges.find((edge: any) => edge.source === startNode.id);
        if (nextEdge) {
          const menuNode = bot.flows.nodes.find((node: any) => node.id === nextEdge.target);
          if (menuNode && menuNode.data.question) {
            responseMessage += '\n\n' + menuNode.data.question;
            if (menuNode.data.options) {
              responseMessage += '\n\n' + menuNode.data.options.join('\n');
            }
            nextNodeId = menuNode.id;
          }
        }
      }
    } else {
      // Process user response based on current node
      const currentNode = bot.flows.nodes.find((node: any) => node.id === currentNodeId);
      
      if (currentNode && currentNode.type === 'question') {
        // Find which option was selected
        const options = currentNode.data.options || [];
        let selectedOptionIndex = -1;
        
        // Try to match user message with options
        const userMsg = messageContent.toLowerCase().trim();
        
        options.forEach((option: string, index: number) => {
          const optionText = option.toLowerCase();
          // Match by number (1, 2, 3...) or by text content
          if (userMsg.includes(`${index + 1}`) || userMsg.includes(optionText.replace(/[^\w\s]/g, ''))) {
            selectedOptionIndex = index;
          }
        });

        if (selectedOptionIndex >= 0) {
          // Find edge with matching label or index
          const outgoingEdges = bot.flows.edges.filter((edge: any) => edge.source === currentNodeId);
          const selectedEdge = outgoingEdges[selectedOptionIndex] || outgoingEdges.find((edge: any) => 
            edge.label && edge.label.toLowerCase().includes(options[selectedOptionIndex].toLowerCase())
          );

          if (selectedEdge) {
            const targetNode = bot.flows.nodes.find((node: any) => node.id === selectedEdge.target);
            
            if (targetNode) {
              nextNodeId = targetNode.id;
              
              // Build response based on node type
              if (targetNode.type === 'message') {
                responseMessage = targetNode.data.message;
                // Continue to next node automatically
                const nextEdge = bot.flows.edges.find((edge: any) => edge.source === targetNode.id);
                if (nextEdge) {
                  const nextNode = bot.flows.nodes.find((node: any) => node.id === nextEdge.target);
                  if (nextNode && nextNode.type === 'question') {
                    responseMessage += '\n\n' + nextNode.data.question;
                    if (nextNode.data.options) {
                      responseMessage += '\n\n' + nextNode.data.options.join('\n');
                    }
                    nextNodeId = nextNode.id;
                  }
                }
              } else if (targetNode.type === 'question') {
                responseMessage = targetNode.data.question;
                if (targetNode.data.options) {
                  responseMessage += '\n\n' + targetNode.data.options.join('\n');
                }
              } else if (targetNode.type === 'action') {
                if (targetNode.data.actionType === 'transfer') {
                  responseMessage = '👤 Aguarde um momento...\n\nEstou transferindo você para um atendente humano.';
                  await supabase
                    .from('conversations')
                    .update({ 
                      status: 'pending',
                      metadata: { ...conversation.metadata, currentNodeId: null }
                    })
                    .eq('id', conversationId);
                  nextNodeId = null;
                } else {
                  responseMessage = targetNode.data.action || 'Processando...';
                  // Continue to next node
                  const nextEdge = bot.flows.edges.find((edge: any) => edge.source === targetNode.id);
                  if (nextEdge) {
                    const nextNode = bot.flows.nodes.find((node: any) => node.id === nextEdge.target);
                    if (nextNode) {
                      if (nextNode.type === 'question') {
                        responseMessage += '\n\n' + nextNode.data.question;
                        if (nextNode.data.options) {
                          responseMessage += '\n\n' + nextNode.data.options.join('\n');
                        }
                        nextNodeId = nextNode.id;
                      } else if (nextNode.type === 'message') {
                        responseMessage += '\n\n' + nextNode.data.message;
                        nextNodeId = nextNode.id;
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          // Invalid option
          responseMessage = '❌ Opção inválida. Por favor, escolha uma das opções disponíveis:\n\n';
          if (currentNode.data.options) {
            responseMessage += currentNode.data.options.join('\n');
          }
          nextNodeId = currentNodeId; // Stay on same node
        }
      }
    }

    if (responseMessage) {
      // Save bot message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'bot',
          content: responseMessage,
          metadata: { nodeId: nextNodeId }
        });

      // Update conversation with new node
      await supabase
        .from('conversations')
        .update({ 
          metadata: { ...conversation.metadata, currentNodeId: nextNodeId }
        })
        .eq('id', conversationId);

      // Send via Evolution API
      await sendEvolutionMessage(instanceName, phoneNumber, responseMessage);
      
      console.log('Bot response sent:', responseMessage.substring(0, 50) + '...');
    }

  } catch (error) {
    console.error('Error in bot response:', error);
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
      textMessage: {
        text: text,
      },
    };

    console.log('Sending Evolution message:', {
      url: `${evolutionApiUrl}/message/sendText/${instanceName}`,
      payload: JSON.stringify(payload, null, 2)
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
    
    if (!response.ok) {
      console.error('Failed to send message via Evolution API:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
    } else {
      console.log('Message sent successfully via Evolution API:', responseText);
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