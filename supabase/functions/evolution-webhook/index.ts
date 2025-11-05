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

    // Process based on event type - normalize to uppercase for comparison
    const eventType = webhook.event.toUpperCase().replace('.', '_');
    
    switch (eventType) {
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
  const messageData = {
    conversation_id: conversationId,
    content: content,
    sender_type: 'user',
    metadata: { 
      external_id: message.key.id,
      sender_name: message.pushName || phoneNumber
    },
    created_at: new Date(message.messageTimestamp * 1000).toISOString()
  };
  
  console.log('Saving message with data:', JSON.stringify(messageData, null, 2));
  
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
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

async function triggerBotResponse(supabase: any, conversationId: string, messageContent: string, phoneNumber: string, instanceName: string) {
  console.log('Triggering bot response...');
  
  // Buscar bot ativo com canal WhatsApp
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

  if (!bots || bots.length === 0) {
    console.log('No active WhatsApp bots found');
    return;
  }

  const bot = bots[0];
  console.log('Using bot:', bot.name);

  // Buscar estado da conversa
  const { data: conversation } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  const conversationState = conversation?.metadata?.bot_state || {
    currentNodeId: 'start-1',
    collectedData: {},
  };

  // Importar e processar o fluxo do bot
  const { BotFlowProcessor } = await import('./bot-flow-processor.ts');
  const processor = new BotFlowProcessor(bot.flows, conversationState);

  const result = await processor.processUserInput(messageContent);

  // Atualizar estado da conversa
  await supabase
    .from('conversations')
    .update({
      metadata: {
        ...conversation?.metadata,
        bot_state: result.newState,
        bot_triggered: true,
      },
      status: result.shouldTransferToAgent ? 'pending' : 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  // Processar chamada de API se necessário
  if (result.shouldCallApi) {
    if (result.shouldCallApi.action === 'fetch-placas') {
      await handleFetchPlacas(supabase, conversationId, phoneNumber, instanceName, bot.flows, result.newState);
      return;
    }
    
    if (result.shouldCallApi.action === 'create-chamado') {
      await handleCreateChamado(supabase, conversationId, phoneNumber, instanceName, result.newState);
      return;
    }
  }

  // Salvar resposta do bot no banco
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: result.response,
      sender_type: 'bot',
      metadata: { bot_id: bot.id, bot_name: bot.name },
      created_at: new Date().toISOString(),
    });

  // Enviar resposta via Evolution API
  await sendEvolutionMessage(instanceName, phoneNumber, result.response);
}

async function handleFetchPlacas(supabase: any, conversationId: string, phoneNumber: string, instanceName: string, botFlow: any, currentState: any) {
  console.log('Fetching placas from Google Sheets...');
  
  try {
    // Buscar dados da Google Sheets API
    const googleSheetsApiUrl = Deno.env.get('GOOGLE_SHEETS_API_URL');
    
    if (!googleSheetsApiUrl) {
      console.log('Google Sheets API URL not configured');
      // Usar placas de exemplo para demonstração
      const placasExemplo = ['ABC-1234', 'DEF-5678', 'GHI-9012', 'JKL-3456'];
      await sendPlacasMenu(supabase, conversationId, phoneNumber, instanceName, placasExemplo, botFlow, currentState);
      return;
    }

    const response = await fetch(googleSheetsApiUrl);
    const data = await response.json();
    
    // Extrair placas dos dados (ajustar conforme estrutura da API)
    const placas = data.placas || data.values?.map((row: any[]) => row[0]) || [];
    
    await sendPlacasMenu(supabase, conversationId, phoneNumber, instanceName, placas, botFlow, currentState);
  } catch (error) {
    console.error('Error fetching placas:', error);
    
    // Enviar mensagem de erro
    const errorMessage = '❌ Erro ao buscar placas. Digite 0 para voltar ao menu.';
    
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: errorMessage,
        sender_type: 'bot',
        created_at: new Date().toISOString(),
      });
    
    await sendEvolutionMessage(instanceName, phoneNumber, errorMessage);
  }
}

async function sendPlacasMenu(supabase: any, conversationId: string, phoneNumber: string, instanceName: string, placas: string[], botFlow: any, currentState: any) {
  // Formatar placas para WhatsApp (máximo 10 opções)
  const placasLimitadas = placas.slice(0, 10);
  const placasFormatadas = placasLimitadas.map((placa, idx) => `${idx + 1}. ${placa}`).join('\n');
  
  const message = `📋 Selecione uma placa:\n\n${placasFormatadas}\n\nDigite o número da placa desejada ou 0 para voltar ao menu.`;
  
  // Atualizar estado com as placas disponíveis
  const newState = {
    ...currentState,
    currentNodeId: 'chamado-placa',
    collectedData: {
      ...currentState.collectedData,
      placas_disponiveis: placasLimitadas,
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
  
  await sendEvolutionMessage(instanceName, phoneNumber, message);
}

async function handleCreateChamado(supabase: any, conversationId: string, phoneNumber: string, instanceName: string, conversationState: any) {
  console.log('Creating chamado...');
  
  const collectedData = conversationState.collectedData;
  
  try {
    // Extrair dados coletados
    const placaSelecionada = collectedData['chamado-placa'] || collectedData.placas_disponiveis?.[0];
    const corretiva = collectedData['chamado-corretiva'] === 'Sim';
    const local = collectedData['chamado-local'];
    const agendamento = collectedData['chamado-agendamento'];
    const descricao = collectedData['chamado-descricao'];
    
    // Buscar company_id da conversa
    const { data: conversation } = await supabase
      .from('conversations')
      .select('company_id, contact_id')
      .eq('id', conversationId)
      .single();
    
    // Gerar número do chamado
    const numeroChamado = `CH-${Date.now().toString().slice(-8)}`;
    
    // Criar chamado no Supabase
    const { data: chamado, error: chamadoError } = await supabase
      .from('chamados')
      .insert({
        company_id: conversation?.company_id,
        conversation_id: conversationId,
        numero_chamado: numeroChamado,
        placa: placaSelecionada,
        local: local,
        descricao: descricao,
        corretiva: corretiva,
        agendamento: agendamento ? new Date(agendamento).toISOString() : null,
        status: 'aberto',
        metadata: {
          origem: 'whatsapp',
          telefone: phoneNumber,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (chamadoError) {
      throw chamadoError;
    }
    
    // Tentar enviar para Google Sheets se configurado
    const googleSheetsApiUrl = Deno.env.get('GOOGLE_SHEETS_API_URL');
    if (googleSheetsApiUrl) {
      try {
        await fetch(googleSheetsApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero_chamado: numeroChamado,
            placa: placaSelecionada,
            local: local,
            descricao: descricao,
            corretiva: corretiva ? 'Sim' : 'Não',
            agendamento: agendamento,
            telefone: phoneNumber,
          }),
        });
      } catch (sheetError) {
        console.error('Error sending to Google Sheets:', sheetError);
        // Continuar mesmo se falhar no Google Sheets
      }
    }
    
    // Mensagem de sucesso
    const successMessage = `✅ Chamado criado com sucesso!\n\n📋 Número: ${numeroChamado}\n🚗 Placa: ${placaSelecionada}\n📍 Local: ${local}\n${corretiva ? '🔧 Tipo: Corretiva\n' : ''}${agendamento ? `📅 Agendamento: ${agendamento}\n` : ''}\n\nDigite 0 para voltar ao menu principal.`;
    
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
    
    await sendEvolutionMessage(instanceName, phoneNumber, successMessage);
    
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
    
    await sendEvolutionMessage(instanceName, phoneNumber, errorMessage);
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
  return remoteJid
    .replace('@s.whatsapp.net', '')
    .replace('@c.us', '')
    .replace('@lid', '');
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