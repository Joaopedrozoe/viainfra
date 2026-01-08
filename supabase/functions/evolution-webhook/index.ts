import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { BotFlowProcessor } from './bot-flow-processor.ts';

// IMPORTANTE: Instâncias autorizadas para processamento
const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial', 'Via Infra ', 'Via Infra', 'JUNIORCORRETOR'];

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
    
    // Processar mensagens enviadas (fromMe) - SALVAR mas não acionar bot
    if (message.key.fromMe) {
      console.log('📤 Mensagem ENVIADA detectada - será salva como agent');
      (message as any)._skipBot = true;
      (message as any)._isOutgoing = true;
      // NÃO usar continue - processar e salvar a mensagem normalmente
    }
    // ============================================================
    // CORREÇÃO CRÍTICA: Reações devem usar o remoteJid da mensagem ORIGINAL
    // O reactionMessage.key.remoteJid indica onde a mensagem reagida está
    // ============================================================
    const reactionMsg = (message.message as any)?.reactionMessage;
    let effectiveRemoteJid = message.key.remoteJid;
    
    if (reactionMsg?.key?.remoteJid) {
      const originalRemoteJid = reactionMsg.key.remoteJid;
      console.log(`⚡ REAÇÃO detectada: remoteJid original=${message.key.remoteJid}, mensagem original=${originalRemoteJid}`);
      
      // A reação deve ir para a conversa onde a mensagem original está
      // Se a mensagem original é de um grupo, a reação deve ir para o grupo
      if (originalRemoteJid.includes('@g.us') && !message.key.remoteJid.includes('@g.us')) {
        console.log(`⚡ Corrigindo remoteJid: ${message.key.remoteJid} -> ${originalRemoteJid} (grupo)`);
        effectiveRemoteJid = originalRemoteJid;
        // Atualizar o key da mensagem para o grupo
        message.key.remoteJid = originalRemoteJid;
      }
    }

    // Processar grupos - salvar mensagens mas não acionar bot
    const isGroupMessage = effectiveRemoteJid.includes('@g.us');
    if (isGroupMessage) {
      console.log(`📢 Mensagem de GRUPO recebida: ${effectiveRemoteJid}`);
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

    const remoteJid = effectiveRemoteJid;
    const isLidFormat = remoteJid.includes('@lid');
    const messageContent = extractMessageContent(message);
    const contactName = message.pushName || 'Sem Nome';
    
    // ============================================================
    // PROCESSAMENTO DE MENSAGENS @LID
    // IMPORTANTE: @lid NÃO tem número de telefone real diretamente
    // Mas DEVEMOS vincular ao contato existente usando a tabela lid_phone_mapping
    // para evitar duplicação de conversas
    // ============================================================
    if (isLidFormat) {
      const lidId = remoteJid.replace('@lid', '');
      console.log(`📱 Mensagem @lid recebida: LID=${lidId}, Nome=${contactName}, fromMe=${message.key.fromMe}`);
      
      // MARCAR PARA NÃO ACIONAR BOT - @lid não tem número para envio direto
      (message as any)._skipBot = true;
      
      // Obter company_id da instância
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('company_id')
        .eq('instance_name', webhook.instance)
        .maybeSingle();
      
      const companyId = instanceData?.company_id;
      
      if (!companyId) {
        console.error('❌ Não foi possível determinar company_id para @lid');
        continue;
      }
      
      // ============================================================
      // BUSCA PRIORITÁRIA 1: Mapeamento LID -> telefone na tabela dedicada
      // ============================================================
      const { data: lidMapping } = await supabase
        .from('lid_phone_mapping')
        .select('phone, contact_id')
        .eq('lid', lidId)
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (lidMapping && lidMapping.contact_id) {
        console.log(`✅ LID mapeado para telefone: ${lidMapping.phone} (contact: ${lidMapping.contact_id})`);
        
        // Buscar conversa do contato mapeado - incluindo resolved para reabrir
        const { data: mappedConv } = await supabase
          .from('conversations')
          .select('*, contacts(*)')
          .eq('contact_id', lidMapping.contact_id)
          .eq('channel', 'whatsapp')
          .in('status', ['open', 'pending', 'resolved'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (mappedConv) {
          console.log(`✅ Conversa encontrada via mapeamento LID: ${mappedConv.id}`);
          
          // Reabrir se necessário
          if (mappedConv.status === 'resolved' || mappedConv.archived) {
            await supabase
              .from('conversations')
              .update({ 
                status: 'open',
                archived: false,
                metadata: { ...mappedConv.metadata, lidJid: remoteJid },
                updated_at: new Date().toISOString()
              })
              .eq('id', mappedConv.id);
            console.log(`🔄 Conversa reaberta via mapeamento LID: ${mappedConv.id}`);
          } else {
            // Atualizar lidJid no metadata da conversa
            await supabase
              .from('conversations')
              .update({ 
                metadata: { ...mappedConv.metadata, lidJid: remoteJid },
                updated_at: new Date().toISOString()
              })
              .eq('id', mappedConv.id);
          }
          
          // Salvar mensagem na conversa existente
          await saveMessage(supabase, mappedConv.id, message, messageContent, lidMapping.phone, webhook.instance, (message as any)._isOutgoing);
          console.log(`✅ Mensagem @lid salva na conversa correta (via mapeamento).`);
          continue;
        }
      }
      
      // ============================================================
      // BUSCA PRIORITÁRIA 2: Se é mensagem ENVIADA (fromMe), buscar conversa
      // ativa recente. REGRA FUNDAMENTAL: Para mensagens fromMe @lid, 
      // NUNCA criar nova conversa - a mensagem deve ir para conversa existente
      // ============================================================
      if (message.key.fromMe) {
        console.log(`🔍 Mensagem ENVIADA para @lid - buscando conversa correta...`);
        
        // ESTRATÉGIA 1: Buscar conversa que JÁ TEM este lidJid mapeado
        const { data: convWithLidJid } = await supabase
          .from('conversations')
          .select('id, contact_id, status, metadata, contacts(phone, name)')
          .or(`metadata->>remoteJid.eq.${remoteJid},metadata->>lidJid.eq.${remoteJid}`)
          .eq('channel', 'whatsapp')
          .eq('company_id', companyId)
          .not('contacts.phone', 'is', null) // Só conversas com telefone real
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (convWithLidJid && convWithLidJid.contacts?.phone) {
          console.log(`✅ Conversa encontrada por lidJid com telefone: ${convWithLidJid.contacts.phone}`);
          
          // Atualizar timestamp
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convWithLidJid.id);
          
          await saveMessage(supabase, convWithLidJid.id, message, messageContent, convWithLidJid.contacts.phone, webhook.instance, true);
          console.log(`✅ Mensagem enviada @lid salva via conversa com lidJid.`);
          continue;
        }
        
        // ESTRATÉGIA 2: Buscar contatos COM telefone pelo nome e encontrar
        // a conversa com atividade mais recente
        if (contactName && contactName !== 'Sem Nome') {
          console.log(`🔍 Buscando contatos com telefone pelo nome: ${contactName}`);
          
          // Normalizar nome para comparação
          const normalizedName = contactName.toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const firstName = normalizedName.split(/\s+/)[0] || '';
          
          // Buscar TODOS contatos com primeiro nome similar para detectar ambiguidade
          const { data: allContacts } = await supabase
            .from('contacts')
            .select('id, phone, name')
            .eq('company_id', companyId)
            .not('phone', 'is', null)
            .order('updated_at', { ascending: false })
            .limit(100);
          
          if (allContacts && allContacts.length > 0) {
            // Filtrar contatos com primeiro nome similar
            const contactsWithSimilarName = allContacts.filter(c => {
              const cName = (c.name || '').toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              const cFirstName = cName.split(/\s+/)[0] || '';
              return firstName && cFirstName && (
                cFirstName === firstName ||
                cFirstName.includes(firstName) ||
                firstName.includes(cFirstName)
              );
            });
            
            console.log(`📊 Contatos com primeiro nome similar a "${firstName}": ${contactsWithSimilarName.length}`);
            
            // PROTEÇÃO: Se há MÚLTIPLOS contatos com nome similar, NÃO criar mapeamento
            if (contactsWithSimilarName.length > 1) {
              console.log(`⚠️ MÚLTIPLOS CONTATOS com nome similar - NÃO criando mapeamento para evitar erro`);
              console.log(`⚠️ Contatos: ${contactsWithSimilarName.slice(0, 5).map(c => `${c.name} (${c.phone})`).join(', ')}`);
              // Não fazer nada - deixar cair para a estratégia 3 ou falhar silenciosamente
            } else {
              // Apenas UM contato - seguro fazer match
              const contactsByName = allContacts.filter(c => 
                (c.name || '').toLowerCase().trim() === normalizedName
              );
              
              if (contactsByName.length === 1) {
                const contact = contactsByName[0];
                console.log(`✅ ÚNICO contato com nome EXATO: ${contact.name} (${contact.phone})`);
                
                // Buscar conversa do contato
                const { data: conv } = await supabase
                  .from('conversations')
                  .select('id, updated_at, status, metadata')
                  .eq('contact_id', contact.id)
                  .eq('channel', 'whatsapp')
                  .in('status', ['open', 'pending', 'resolved'])
                  .order('updated_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                
                if (conv) {
                  // Criar mapeamento LID -> telefone PERMANENTE (só com match único e exato)
                  await supabase
                    .from('lid_phone_mapping')
                    .upsert({
                      lid: lidId,
                      phone: contact.phone,
                      contact_id: contact.id,
                      company_id: companyId,
                      instance_name: webhook.instance
                    }, { onConflict: 'lid,company_id' });
                  
                  console.log(`✅ Mapeamento LID->telefone criado (match único): ${lidId} -> ${contact.phone}`);
                  
                  // Atualizar conversa com lidJid
                  const convMetadata = conv.metadata || {};
                  await supabase
                    .from('conversations')
                    .update({ 
                      status: conv.status === 'resolved' ? 'open' : conv.status,
                      archived: false,
                      metadata: { ...convMetadata, lidJid: remoteJid },
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', conv.id);
                  
                  await saveMessage(supabase, conv.id, message, messageContent, contact.phone, webhook.instance, true);
                  console.log(`✅ Mensagem enviada @lid salva na conversa correta (match único).`);
                  continue;
                }
              } else {
                console.log(`⚠️ Nenhum contato com nome EXATO "${normalizedName}" - não criando mapeamento`);
              }
            }
          }
        }
        
        // ESTRATÉGIA 3: Se ainda não encontrou, buscar a conversa MAIS RECENTE 
        // que foi aberta/atualizada pelo agente (última atividade de agente)
        // IMPORTANTE: NÃO criar mapeamento por nome parcial - muito arriscado
        console.log(`🔍 Tentando encontrar conversa por atividade recente de agente...`);
        
        const { data: recentAgentConvs } = await supabase
          .from('conversations')
          .select(`
            id, 
            contact_id, 
            status, 
            metadata, 
            updated_at,
            contacts(phone, name)
          `)
          .eq('channel', 'whatsapp')
          .eq('company_id', companyId)
          .not('contacts.phone', 'is', null)
          .in('status', ['open', 'pending'])
          .order('updated_at', { ascending: false })
          .limit(20);
        
        if (recentAgentConvs && recentAgentConvs.length > 0 && contactName && contactName !== 'Sem Nome') {
          // Normalizar nome para comparação
          const normalizedMsgName = contactName.toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          
          // PRIMEIRO: Verificar se há MÚLTIPLOS contatos com primeiro nome similar
          const msgFirstName = normalizedMsgName.split(/\s+/)[0] || '';
          
          const convsWithSimilarFirstName = recentAgentConvs.filter(conv => {
            if (!conv.contacts?.name) return false;
            const convName = conv.contacts.name.toLowerCase().trim()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const convFirstName = convName.split(/\s+/)[0] || '';
            return msgFirstName && convFirstName && (
              convFirstName === msgFirstName ||
              convFirstName.includes(msgFirstName) ||
              msgFirstName.includes(convFirstName)
            );
          });
          
          console.log(`📊 Conversas recentes com primeiro nome similar: ${convsWithSimilarFirstName.length}`);
          
          // Se há MÚLTIPLOS, NÃO criar mapeamento para evitar erro
          if (convsWithSimilarFirstName.length > 1) {
            console.log(`⚠️ MÚLTIPLAS CONVERSAS com nome similar - NÃO criando mapeamento`);
            console.log(`⚠️ Conversas: ${convsWithSimilarFirstName.map(c => `${c.contacts?.name} (${c.contacts?.phone})`).join(', ')}`);
          } else {
            // Tentar encontrar conversa com nome EXATO
            for (const conv of recentAgentConvs) {
              if (!conv.contacts?.phone || !conv.contacts?.name) continue;
              
              const normalizedConvName = conv.contacts.name.toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              
              // Exigir match EXATO
              if (normalizedConvName === normalizedMsgName) {
                console.log(`✅ Conversa encontrada por nome EXATO: ${conv.contacts.name} (${conv.contacts.phone})`);
                
                // Criar mapeamento (só com match exato)
                await supabase
                  .from('lid_phone_mapping')
                  .upsert({
                    lid: lidId,
                    phone: conv.contacts.phone,
                    contact_id: conv.contact_id,
                    company_id: companyId,
                    instance_name: webhook.instance
                  }, { onConflict: 'lid,company_id' });
                
                await supabase
                  .from('conversations')
                  .update({ 
                    metadata: { ...conv.metadata, lidJid: remoteJid },
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', conv.id);
                
                await saveMessage(supabase, conv.id, message, messageContent, conv.contacts.phone, webhook.instance, true);
                console.log(`✅ Mensagem enviada @lid salva via conversa recente (nome exato).`);
                continue;
              }
            }
          }
        }
        
        // REGRA FINAL: Se é mensagem ENVIADA e não encontramos destino, 
        // NÃO CRIAR NOVA CONVERSA - apenas logar o erro
        console.error(`⛔ MENSAGEM ENVIADA @lid SEM DESTINO IDENTIFICADO - NÃO CRIANDO NOVA CONVERSA`);
        console.error(`⛔ LID: ${lidId}, Nome: ${contactName}, Conteúdo: ${messageContent?.substring(0, 50)}`);
        console.error(`⛔ Esta mensagem será perdida para evitar duplicação de conversas`);
        continue; // Ignorar a mensagem ao invés de criar nova conversa
      }
      
      // ============================================================
      // NOVA BUSCA: Tentar resolver LID via Evolution API
      // ============================================================
      let resolvedPhone = null;
      try {
        const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
        
        if (evolutionApiUrl && evolutionApiKey) {
          console.log(`🔍 Tentando resolver LID via Evolution API...`);
          
          // Buscar contatos na Evolution API
          const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${webhook.instance}`, {
            method: 'POST',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ where: { id: remoteJid } })
          });
          
          if (contactsResponse.ok) {
            const contactsData = await contactsResponse.json();
            const contacts = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || contactsData?.data || []);
            
            // Procurar contato que tenha número de telefone
            for (const c of contacts) {
              const cId = c.id || c.remoteJid || '';
              if (cId.includes(lidId)) {
                // Tentar extrair telefone do pushName ou de outro campo
                const possiblePhone = c.number || c.phone || 
                  (c.id && !c.id.includes('@lid') ? c.id.replace(/@.*/, '') : null);
                
                if (possiblePhone && /^\d{10,15}$/.test(possiblePhone)) {
                  resolvedPhone = possiblePhone;
                  console.log(`✅ Telefone resolvido via Evolution API: ${resolvedPhone}`);
                  break;
                }
              }
            }
            
            // Se não encontrou, tentar buscar pelo nome
            if (!resolvedPhone && contactName && contactName !== 'Sem Nome') {
              for (const c of contacts) {
                const cName = (c.pushName || c.name || '').toLowerCase();
                if (cName === contactName.toLowerCase()) {
                  const possiblePhone = c.number || c.phone || 
                    (c.id && !c.id.includes('@lid') ? c.id.replace(/@.*/, '') : null);
                  
                  if (possiblePhone && /^\d{10,15}$/.test(possiblePhone)) {
                    resolvedPhone = possiblePhone;
                    console.log(`✅ Telefone resolvido por nome via Evolution API: ${resolvedPhone}`);
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (apiError) {
        console.log(`⚠️ Erro ao buscar LID na Evolution API: ${apiError.message}`);
      }
      
      // Se resolvemos o telefone, criar o mapeamento e buscar conversa
      if (resolvedPhone) {
        // Buscar contato existente com este telefone
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('phone', resolvedPhone)
          .eq('company_id', companyId)
          .maybeSingle();
        
        if (existingContact) {
          // Criar mapeamento
          await supabase
            .from('lid_phone_mapping')
            .upsert({
              lid: lidId,
              phone: resolvedPhone,
              contact_id: existingContact.id,
              company_id: companyId,
              instance_name: webhook.instance
            }, { onConflict: 'lid,company_id' });
          
          console.log(`✅ Mapeamento LID->telefone criado: ${lidId} -> ${resolvedPhone}`);
          
          // Buscar conversa do contato
          const { data: resolvedConv } = await supabase
            .from('conversations')
            .select('*, contacts(*)')
            .eq('contact_id', existingContact.id)
            .eq('channel', 'whatsapp')
            .in('status', ['open', 'pending', 'resolved'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (resolvedConv) {
            // Reabrir se necessário
            if (resolvedConv.status === 'resolved' || resolvedConv.status === 'closed') {
              await supabase
                .from('conversations')
                .update({ 
                  status: 'open',
                  archived: false,
                  metadata: { ...resolvedConv.metadata, lidJid: remoteJid },
                  updated_at: new Date().toISOString()
                })
                .eq('id', resolvedConv.id);
              console.log(`🔄 Conversa reaberta via resolução de LID: ${resolvedConv.id}`);
            } else {
              await supabase
                .from('conversations')
                .update({ 
                  metadata: { ...resolvedConv.metadata, lidJid: remoteJid },
                  updated_at: new Date().toISOString()
                })
                .eq('id', resolvedConv.id);
            }
            
            await saveMessage(supabase, resolvedConv.id, message, messageContent, resolvedPhone, webhook.instance, (message as any)._isOutgoing);
            console.log(`✅ Mensagem @lid salva na conversa correta (via resolução Evolution API).`);
            continue;
          }
        }
      }
      
      // ============================================================
      // BUSCA PROGRESSIVA COM PROTEÇÃO ANTI-DUPLICATA
      // Busca TODAS as conversas com este LID e usa a mais antiga (primeira criada)
      // ============================================================
      let existingLidConv = null;
      let linkedContactId = null;
      let linkedPhone = null;
      
      // Busca TODAS as conversas com este remoteJid para detectar duplicatas
      const { data: allConvsByJid } = await supabase
        .from('conversations')
        .select('*, contacts(*)')
        .eq('metadata->>remoteJid', remoteJid)
        .eq('channel', 'whatsapp')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true }); // Mais antiga primeiro
      
      if (allConvsByJid && allConvsByJid.length > 0) {
        // Usar a conversa MAIS ANTIGA (primeira criada) - as outras são duplicatas
        existingLidConv = allConvsByJid[0];
        console.log(`✅ Conversa encontrada por remoteJid: ${existingLidConv.id} (de ${allConvsByJid.length} encontradas)`);
        
        // Se há duplicatas, logar para futuro cleanup
        if (allConvsByJid.length > 1) {
          console.warn(`⚠️ DUPLICATAS DETECTADAS: ${allConvsByJid.length} conversas com mesmo LID ${lidId}`);
          console.warn(`⚠️ IDs duplicados: ${allConvsByJid.slice(1).map((c: any) => c.id).join(', ')}`);
        }
      }
      
      // Busca 2: Pelo lidJid no metadata
      if (!existingLidConv) {
        const { data: allConvsByLidJid } = await supabase
          .from('conversations')
          .select('*, contacts(*)')
          .eq('metadata->>lidJid', remoteJid)
          .eq('channel', 'whatsapp')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });
        
        if (allConvsByLidJid && allConvsByLidJid.length > 0) {
          existingLidConv = allConvsByLidJid[0];
          console.log(`✅ Conversa encontrada por lidJid: ${existingLidConv.id}`);
        }
      }
      
      // Busca 3: Pelo lidId no metadata do contato
      if (!existingLidConv) {
        const { data: contactByLidId } = await supabase
          .from('contacts')
          .select('id, phone, name')
          .eq('company_id', companyId)
          .contains('metadata', { lidId: lidId })
          .maybeSingle();
        
        if (contactByLidId) {
          console.log(`✅ Contato encontrado por lidId no metadata: ${contactByLidId.name}`);
          
          const { data: convOfLidContact } = await supabase
            .from('conversations')
            .select('*, contacts(*)')
            .eq('contact_id', contactByLidId.id)
            .eq('channel', 'whatsapp')
            .in('status', ['open', 'pending', 'resolved'])
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          
          if (convOfLidContact) {
            existingLidConv = convOfLidContact;
            linkedContactId = contactByLidId.id;
            linkedPhone = contactByLidId.phone;
            console.log(`✅ Conversa encontrada por lidId: ${existingLidConv.id}`);
          }
        }
      }
      
      // ============================================================
      // Busca 4: Pelo pushName PARCIAL - busca contatos que CONTENHAM parte do nome
      // Ex: "T Informatica" deve encontrar "Anthony Informatica" se for único
      // ============================================================
      if (!existingLidConv && contactName && contactName !== 'Sem Nome') {
        console.log(`🔍 Buscando contato por nome (busca flexível): "${contactName}"`);
        
        // NOVA ESTRATÉGIA: Buscar por partes do nome que não sejam iniciais
        const normalizedContactName = contactName.toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const nameParts = normalizedContactName.split(/\s+/).filter(p => p.length > 2);
        
        // Se o nome tem partes (ex: "T Informatica" -> ["informatica"])
        if (nameParts.length > 0) {
          // Identificar partes significativas (não iniciais/letras soltas)
          const significantParts = nameParts.filter(p => p.length >= 4);
          
          if (significantParts.length > 0) {
            console.log(`🔍 Partes significativas do nome: ${significantParts.join(', ')}`);
            
            // Buscar contatos que contenham TODAS as partes significativas
            const { data: matchingContacts } = await supabase
              .from('contacts')
              .select('id, phone, name, updated_at')
              .eq('company_id', companyId)
              .not('phone', 'is', null)
              .order('updated_at', { ascending: false })
              .limit(100);
            
            if (matchingContacts && matchingContacts.length > 0) {
              // Filtrar contatos que contenham TODAS as partes significativas
              const contactsWithAllParts = matchingContacts.filter(c => {
                const cName = (c.name || '').toLowerCase().trim()
                  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return significantParts.every(part => cName.includes(part));
              });
              
              console.log(`📊 Contatos com partes significativas "${significantParts.join('+')}": ${contactsWithAllParts.length}`);
              
              // Se há EXATAMENTE UM contato, é match seguro
              if (contactsWithAllParts.length === 1) {
                const matchedContact = contactsWithAllParts[0];
                console.log(`✅ MATCH ÚNICO por partes significativas: ${matchedContact.name} (${matchedContact.phone})`);
                
                linkedContactId = matchedContact.id;
                linkedPhone = matchedContact.phone;
                
                // Buscar conversa deste contato
                const { data: convOfPartialMatch } = await supabase
                  .from('conversations')
                  .select('*, contacts(*)')
                  .eq('contact_id', matchedContact.id)
                  .eq('channel', 'whatsapp')
                  .in('status', ['open', 'pending', 'resolved'])
                  .order('updated_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                
                if (convOfPartialMatch) {
                  existingLidConv = convOfPartialMatch;
                  console.log(`✅ Conversa encontrada por match parcial: ${existingLidConv.id}`);
                  
                  // Criar mapeamento LID para futuras mensagens
                  await supabase
                    .from('lid_phone_mapping')
                    .upsert({
                      lid: lidId,
                      phone: linkedPhone,
                      contact_id: linkedContactId,
                      company_id: companyId,
                      instance_name: webhook.instance
                    }, { onConflict: 'lid,company_id' });
                  
                  console.log(`✅ Mapeamento LID->telefone criado (match parcial): ${lidId} -> ${linkedPhone}`);
                }
              } else if (contactsWithAllParts.length > 1) {
                console.log(`⚠️ MÚLTIPLOS CONTATOS com partes similares - tentando match exato`);
              }
            }
          }
        }
        
        // Se já encontramos conversa pelo match parcial, pular a busca antiga
        if (existingLidConv) {
          console.log(`✅ Já encontrado via match parcial - pulando busca antiga`);
        } else {
          // Busca por score (fallback se match parcial não funcionou)
          const firstName = nameParts[0] || '';
        
        // Buscar contatos COM telefone que possam corresponder
        const { data: potentialContacts } = await supabase
          .from('contacts')
          .select('id, phone, name, updated_at')
          .eq('company_id', companyId)
          .not('phone', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(100);
        
        if (potentialContacts && potentialContacts.length > 0) {
          // PRIMEIRO: Contar quantos contatos têm primeiro nome similar
          const contactsWithSimilarFirstName = potentialContacts.filter(c => {
            const cName = (c.name || '').toLowerCase().trim()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const cFirstName = cName.split(/\s+/)[0] || '';
            return firstName && cFirstName && (
              cFirstName === firstName ||
              cFirstName.includes(firstName) ||
              firstName.includes(cFirstName)
            );
          });
          
          console.log(`📊 Contatos com primeiro nome similar a "${firstName}": ${contactsWithSimilarFirstName.length}`);
          
          // Se há MÚLTIPLOS contatos com nome similar, NÃO criar mapeamento automático
          // para evitar associação errada (ex: múltiplas "Flavia"s)
          if (contactsWithSimilarFirstName.length > 1) {
            console.log(`⚠️ MÚLTIPLOS CONTATOS com nome similar - NÃO criando mapeamento automático`);
            console.log(`⚠️ Contatos: ${contactsWithSimilarFirstName.map(c => `${c.name} (${c.phone})`).join(', ')}`);
            // NÃO criar mapeamento - deixar mensagem ir para nova conversa ou fallback
          } else {
            // Apenas UM contato - podemos fazer match seguro
            let bestMatch = null;
            let bestScore = 0;
            
            for (const c of potentialContacts) {
              const normalizedName = (c.name || '').toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              let score = 0;
              
              // Match exato = 100 pontos
              if (normalizedName === normalizedContactName) {
                score = 100;
              }
              // Match case-insensitive contém = 70 pontos (só se nome completo)
              else if (normalizedName === normalizedContactName || 
                       (normalizedContactName.length >= 10 && normalizedName.includes(normalizedContactName))) {
                score = 70;
              }
              // Match de nome completo (primeiro + último) = 50-60 pontos
              else {
                const cNameParts = normalizedName.split(/\s+/).filter(p => p.length > 2);
                let matchingParts = 0;
                let totalParts = Math.max(nameParts.length, cNameParts.length);
                
                for (const part of nameParts) {
                  if (cNameParts.some(cp => cp === part)) { // Match EXATO de cada parte
                    matchingParts++;
                  }
                }
                
                // Só dar pontos se TODAS as partes batem
                if (matchingParts === nameParts.length && matchingParts === cNameParts.length) {
                  score = 60;
                } else if (matchingParts >= 2 && matchingParts === nameParts.length) {
                  score = 50;
                }
              }
              
              if (score > bestScore) {
                bestScore = score;
                bestMatch = c;
              }
            }
            
            // AUMENTADO: Aceitar match APENAS com score >= 90 (quase exato)
            // Isso evita confusão entre nomes similares
            if (bestMatch && bestScore >= 90) {
              console.log(`✅ Contato encontrado por nome EXATO: "${bestMatch.name}" (score: ${bestScore}, phone: ${bestMatch.phone})`);
              linkedContactId = bestMatch.id;
              linkedPhone = bestMatch.phone;
              
              // Buscar conversa deste contato
              const { data: convOfContact } = await supabase
                .from('conversations')
                .select('*, contacts(*)')
                .eq('contact_id', bestMatch.id)
                .eq('channel', 'whatsapp')
                .in('status', ['open', 'pending', 'resolved'])
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (convOfContact) {
                existingLidConv = convOfContact;
                console.log(`✅ Conversa encontrada por nome EXATO: ${existingLidConv.id}`);
                
                // CRIAR MAPEAMENTO para futuras mensagens (só com match exato)
                await supabase
                  .from('lid_phone_mapping')
                  .upsert({
                    lid: lidId,
                    phone: linkedPhone,
                    contact_id: linkedContactId,
                    company_id: companyId,
                    instance_name: webhook.instance
                  }, { onConflict: 'lid,company_id' });
                
                console.log(`✅ Mapeamento LID->telefone criado (match exato): ${lidId} -> ${linkedPhone}`);
              }
            } else {
              console.log(`⚠️ Match insuficiente para "${contactName}" (score: ${bestScore}, requer 90+)`);
            }
          }
        }
        } // fim do else da busca por score
      }
      
      // ============================================================
      // Busca 5: Última conversa ATIVA com mensagem recente (fallback)
      // IMPORTANTE: Só criar mapeamento se nome for EXATO (não parcial)
      // Para evitar confusão entre "Flavia Oliveira" e "Flávia Financeiro"
      // ============================================================
      if (!existingLidConv && !message.key.fromMe && contactName && contactName !== 'Sem Nome') {
        console.log(`🔍 Buscando conversa ativa recente com nome EXATO...`);
        
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        
        // Normalizar nome para comparação
        const normalizedMsgName = contactName.toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        const { data: recentActiveConvs } = await supabase
          .from('conversations')
          .select(`
            id,
            contact_id,
            status,
            metadata,
            updated_at,
            contacts(id, phone, name)
          `)
          .eq('channel', 'whatsapp')
          .eq('company_id', companyId)
          .in('status', ['open', 'pending'])
          .gte('updated_at', thirtyMinAgo)
          .not('contacts.phone', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(20);
        
        if (recentActiveConvs && recentActiveConvs.length > 0) {
          // PRIMEIRO: Verificar se há MÚLTIPLOS contatos com primeiro nome similar
          const msgFirstName = normalizedMsgName.split(/\s+/)[0] || '';
          
          const convsWithSimilarFirstName = recentActiveConvs.filter(conv => {
            if (!conv.contacts?.name) return false;
            const convName = conv.contacts.name.toLowerCase().trim()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const convFirstName = convName.split(/\s+/)[0] || '';
            return msgFirstName && convFirstName && (
              convFirstName === msgFirstName ||
              convFirstName.includes(msgFirstName) ||
              msgFirstName.includes(convFirstName)
            );
          });
          
          console.log(`📊 Conversas ativas com primeiro nome similar: ${convsWithSimilarFirstName.length}`);
          
          // Se há MÚLTIPLOS, NÃO criar mapeamento para evitar erro
          if (convsWithSimilarFirstName.length > 1) {
            console.log(`⚠️ MÚLTIPLAS CONVERSAS com nome similar - NÃO criando mapeamento`);
            console.log(`⚠️ Conversas: ${convsWithSimilarFirstName.map(c => `${c.contacts?.name} (${c.contacts?.phone})`).join(', ')}`);
          } else {
            // Tentar encontrar conversa com nome EXATO
            for (const conv of recentActiveConvs) {
              if (!conv.contacts?.name) continue;
              
              const normalizedConvName = conv.contacts.name.toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              
              // Exigir match EXATO ou muito próximo (90%+ similaridade)
              if (normalizedConvName === normalizedMsgName) {
                console.log(`✅ Conversa ativa recente com nome EXATO: ${conv.contacts.name} (${conv.contacts.phone})`);
                
                existingLidConv = conv;
                linkedContactId = conv.contacts.id;
                linkedPhone = conv.contacts.phone;
                
                // Criar mapeamento (só com match exato)
                await supabase
                  .from('lid_phone_mapping')
                  .upsert({
                    lid: lidId,
                    phone: linkedPhone,
                    contact_id: linkedContactId,
                    company_id: companyId,
                    instance_name: webhook.instance
                  }, { onConflict: 'lid,company_id' });
                
                console.log(`✅ Mapeamento LID->telefone criado via nome EXATO: ${lidId} -> ${linkedPhone}`);
                break;
              }
            }
          }
        }
      }
      
      if (existingLidConv) {
        // Reabrir se necessário
        if (existingLidConv.status === 'resolved' || existingLidConv.status === 'closed') {
          await supabase
            .from('conversations')
            .update({ 
              status: 'open',
              archived: false,
              metadata: { ...existingLidConv.metadata, lidJid: remoteJid },
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLidConv.id);
          console.log(`🔄 Conversa reaberta: ${existingLidConv.id}`);
        } else {
          // Atualizar o lidJid para facilitar buscas futuras
          await supabase
            .from('conversations')
            .update({ 
              metadata: { ...existingLidConv.metadata, lidJid: remoteJid },
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLidConv.id);
        }
        
        // Atualizar nome do contato se mudou
        if (existingLidConv.contacts && existingLidConv.contacts.name !== contactName && contactName !== 'Sem Nome') {
          await supabase
            .from('contacts')
            .update({ name: contactName })
            .eq('id', existingLidConv.contacts.id);
          console.log(`📝 Nome do contato atualizado: ${existingLidConv.contacts.name} -> ${contactName}`);
        }
        
        // Salvar mensagem na conversa existente
        const phoneForMsg = linkedPhone || existingLidConv.contacts?.phone || lidId;
        await saveMessage(supabase, existingLidConv.id, message, messageContent, phoneForMsg, webhook.instance, (message as any)._isOutgoing);
        
        console.log(`✅ Mensagem @lid salva na conversa existente.`);
        continue;
      }
      
      // ============================================================
      // ÚLTIMA OPÇÃO: Criar nova conversa para esse LID
      // COM PROTEÇÃO ANTI-RACE-CONDITION
      // ============================================================
      console.log(`⚠️ @lid sem conversa existente - tentando criar nova conversa para LID ${lidId}`);
      console.log(`⚠️ ATENÇÃO: Isso pode indicar um contato novo ou falha no matching`);
      
      // PROTEÇÃO: Verificar NOVAMENTE antes de criar (anti-race-condition)
      const { data: lastCheckConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('metadata->>remoteJid', remoteJid)
        .eq('channel', 'whatsapp')
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();
      
      if (lastCheckConv) {
        console.log(`⚠️ RACE CONDITION EVITADA: Conversa ${lastCheckConv.id} foi criada por outro processo`);
        await saveMessage(supabase, lastCheckConv.id, message, messageContent, lidId, webhook.instance, (message as any)._isOutgoing);
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
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar contato @lid:', createError);
        continue;
      }
      
      console.log(`✅ Novo contato @lid criado: ${newContact.id} - ${contactName}`);
      
      // PROTEÇÃO FINAL: Verificar mais uma vez antes de criar conversa
      const { data: finalCheck } = await supabase
        .from('conversations')
        .select('id')
        .eq('metadata->>remoteJid', remoteJid)
        .eq('channel', 'whatsapp')
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();
      
      if (finalCheck) {
        console.log(`⚠️ RACE CONDITION EVITADA (final): Conversa ${finalCheck.id} já existe`);
        await saveMessage(supabase, finalCheck.id, message, messageContent, lidId, webhook.instance, (message as any)._isOutgoing);
        continue;
      }
      
      // Criar nova conversa para esse LID com BOT DESABILITADO
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: newContact.id,
          channel: 'whatsapp',
          status: 'open',
          company_id: companyId,
          bot_active: false,
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
        // Se erro de constraint, buscar a conversa que já existe
        if (convError.code === '23505') {
          console.log(`⚠️ Conversa já existe (constraint) - buscando...`);
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('metadata->>remoteJid', remoteJid)
            .eq('channel', 'whatsapp')
            .limit(1)
            .maybeSingle();
          
          if (existingConv) {
            await saveMessage(supabase, existingConv.id, message, messageContent, lidId, webhook.instance, (message as any)._isOutgoing);
            continue;
          }
        }
        console.error('❌ Erro ao criar conversa @lid:', convError);
        continue;
      }
      
      console.log(`✅ Nova conversa @lid criada: ${newConv.id} - BOT DESABILITADO`);
      
      // Salvar mensagem
      await saveMessage(supabase, newConv.id, message, messageContent, lidId, webhook.instance, (message as any)._isOutgoing);
      console.log(`✅ Mensagem @lid salva.`);
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
      
      // Agendar atualização de foto do grupo em background
      scheduleGroupAvatarUpdate(supabase, groupContact, groupId, webhook.instance);

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
      
      // Salvar mensagem do grupo COM processamento de mídia
      const savedGroupMsg = await saveGroupMessage(supabase, groupConversation.id, message, messageContent, participantName, groupId, webhook.instance);
      
      if (savedGroupMsg) {
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
    
    // Agendar atualização de avatar em background (só se desatualizado)
    if (contact.phone && webhook.instance) {
      scheduleAvatarUpdate(supabase, contact, webhook.instance);
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
    
    // Verificar se é uma reação - reações NÃO devem atualizar updated_at
    const isReaction = isReactionMessage(message);
    
    // Save message - returns null if duplicate
    const savedMessage = await saveMessage(supabase, conversation.id, message, messageContent, contactPhone, webhook.instance, (message as any)._isOutgoing);
    
    // PROTEÇÃO: Se a mensagem foi duplicada, não aciona o bot
    if (!savedMessage) {
      console.log('⚠️ Mensagem duplicada - ignorando trigger do bot');
      continue;
    }
    
    // Atualizar updated_at APENAS se NÃO for reação
    if (!isReaction) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date(message.messageTimestamp * 1000).toISOString() })
        .eq('id', conversation.id);
    } else {
      console.log('⚡ Reação detectada - NÃO atualizando timestamp da conversa');
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

  // ============================================================
  // PRIORITY 3: Verificar lid_phone_mapping - pode já ter mapeamento
  // Se existe mapeamento para este telefone, usar o contato existente
  // ============================================================
  if (normalizedPhone) {
    const { data: lidMapping } = await supabase
      .from('lid_phone_mapping')
      .select('contact_id, lid')
      .eq('phone', normalizedPhone)
      .eq('company_id', companyId)
      .maybeSingle();
    
    if (lidMapping && lidMapping.contact_id) {
      const { data: mappedContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', lidMapping.contact_id)
        .single();
      
      if (mappedContact) {
        console.log(`✅ Found contact via lid_phone_mapping: ${mappedContact.name} (LID: ${lidMapping.lid})`);
        
        // Atualizar telefone e remoteJid se necessário
        if (!mappedContact.phone || mappedContact.phone !== normalizedPhone) {
          await supabase
            .from('contacts')
            .update({ 
              phone: normalizedPhone,
              metadata: { ...mappedContact.metadata, remoteJid: remoteJid },
              updated_at: new Date().toISOString()
            })
            .eq('id', mappedContact.id);
          mappedContact.phone = normalizedPhone;
        }
        return mappedContact;
      }
    }
  }

  // ============================================================
  // PRIORITY 4: Buscar contato LID sem telefone pelo NOME EXATO
  // Se existe um contato LID com o mesmo nome, vincular o telefone a ele
  // ============================================================
  if (normalizedPhone && name && name !== 'Sem Nome') {
    console.log(`🔍 Buscando contato LID sem telefone pelo nome: "${name}"`);
    
    // Normalizar nome para comparação
    const normalizedName = name.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Buscar contatos LID sem telefone
    const { data: lidContacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .is('phone', null)
      .contains('metadata', { isLidContact: true })
      .limit(50);
    
    if (lidContacts && lidContacts.length > 0) {
      // Filtrar por nome exato ou muito similar
      const matchingLidContacts = lidContacts.filter((c: any) => {
        const cName = (c.name || '').toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return cName === normalizedName;
      });
      
      // Se encontrou EXATAMENTE UM contato com nome igual, vincular o telefone
      if (matchingLidContacts.length === 1) {
        const lidContact = matchingLidContacts[0];
        console.log(`✅ VINCULANDO telefone ${normalizedPhone} ao contato LID existente: ${lidContact.name} (${lidContact.id})`);
        
        // Atualizar o contato LID com o telefone real
        await supabase
          .from('contacts')
          .update({ 
            phone: normalizedPhone,
            metadata: { 
              ...lidContact.metadata, 
              remoteJid: remoteJid,
              isLidContact: false, // Não é mais só LID
              phoneLinkedAt: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', lidContact.id);
        
        // Criar mapeamento LID -> telefone para futuras mensagens
        if (lidContact.metadata?.lidId) {
          await supabase
            .from('lid_phone_mapping')
            .upsert({
              lid: lidContact.metadata.lidId,
              phone: normalizedPhone,
              contact_id: lidContact.id,
              company_id: companyId,
              instance_name: instanceName || 'VIAINFRAOFICIAL'
            }, { onConflict: 'lid,company_id' });
          console.log(`✅ Mapeamento LID->telefone criado: ${lidContact.metadata.lidId} -> ${normalizedPhone}`);
        }
        
        lidContact.phone = normalizedPhone;
        return lidContact;
      } else if (matchingLidContacts.length > 1) {
        console.log(`⚠️ MÚLTIPLOS contatos LID com mesmo nome "${name}" - NÃO vinculando automaticamente`);
      }
    }
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

  // Agendar busca de avatar em background para novos contatos
  if (normalizedPhone && instanceName) {
    scheduleAvatarUpdate(supabase, newContact, instanceName);
  }

  console.log('✅ Created new contact:', newContact.id);
  return newContact;
}

// Verifica se já checamos o avatar hoje (evita múltiplas verificações por dia)
function wasAvatarCheckedToday(contact: any): boolean {
  const lastChecked = contact.metadata?.avatar_last_checked;
  if (!lastChecked) return false;
  
  const lastCheckTime = new Date(lastChecked).getTime();
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  return lastCheckTime > oneDayAgo;
}

// Verifica se avatar precisa de atualização (desatualizado > 7 dias ou inexistente)
function shouldUpdateAvatar(contact: any): boolean {
  // OTIMIZAÇÃO: Se já verificamos hoje, pular
  if (wasAvatarCheckedToday(contact)) {
    return false;
  }
  
  // Se não tem avatar, precisa buscar
  if (!contact.avatar_url) return true;
  
  // Se avatar é placeholder ou inválido
  if (contact.avatar_url.includes('placeholder') || contact.avatar_url.includes('default-avatar')) {
    return true;
  }
  
  // Verificar se avatar é antigo (> 7 dias desde última atualização real)
  const lastAvatarUpdate = contact.metadata?.avatar_updated_at || contact.updated_at;
  if (lastAvatarUpdate) {
    const lastUpdate = new Date(lastAvatarUpdate).getTime();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (lastUpdate < sevenDaysAgo) {
      return true;
    }
  }
  
  return false;
}

// Função para atualizar avatar de forma eficiente (roda em background)
async function updateContactProfilePicture(supabase: any, contact: any, instanceName: string, forceUpdate: boolean = false) {
  if (!contact.phone) return;
  
  // Verificar se precisa atualizar
  if (!forceUpdate && !shouldUpdateAvatar(contact)) {
    return;
  }
  
  const now = new Date().toISOString();
  
  // SEMPRE marcar que verificamos hoje (mesmo que não atualize o avatar)
  await supabase
    .from('contacts')
    .update({ 
      metadata: { 
        ...contact.metadata, 
        avatar_last_checked: now 
      }
    })
    .eq('id', contact.id);
  
  console.log(`📷 [Avatar Sync] Verificando foto de ${contact.name} (${contact.phone})...`);
  
  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionKey) {
      console.log('⚠️ EVOLUTION_API_KEY not configured');
      return;
    }
    
    // Buscar URL da foto no Evolution API
    const remoteJid = contact.phone.includes('@') ? contact.phone : `${contact.phone}@s.whatsapp.net`;
    
    const response = await fetch(`${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({ number: remoteJid }),
    });
    
    if (!response.ok) {
      console.log(`⚠️ Foto não disponível para ${contact.name}: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const pictureUrl = data.profilePictureUrl || data.pictureUrl || data.url;
    
    if (!pictureUrl) {
      console.log(`📷 Sem foto de perfil para ${contact.name}`);
      return;
    }
    
    // Baixar a imagem
    const imageResp = await fetch(pictureUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!imageResp.ok) {
      console.log(`⚠️ Falha ao baixar imagem: ${imageResp.status}`);
      return;
    }
    
    const contentType = imageResp.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResp.arrayBuffer();
    const blob = new Uint8Array(imageBuffer);
    
    // Determinar extensão
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    
    const fileName = `${contact.id}.${extension}`;
    
    // Upload para storage do Supabase
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, blob, {
        contentType,
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`❌ Erro upload avatar: ${uploadError.message}`);
      // Fallback: usar URL direto
      await supabase
        .from('contacts')
        .update({ avatar_url: pictureUrl, updated_at: new Date().toISOString() })
        .eq('id', contact.id);
      contact.avatar_url = pictureUrl;
      return;
    }
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);
    
    const newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    
    // Atualizar contato com avatar E marcar data de atualização
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('contacts')
      .update({ 
        avatar_url: newAvatarUrl, 
        updated_at: now,
        metadata: {
          ...contact.metadata,
          avatar_updated_at: now,
          avatar_last_checked: now
        }
      })
      .eq('id', contact.id);
    
    if (error) {
      console.error('❌ Error updating contact avatar:', error);
    } else {
      console.log(`✅ Avatar atualizado: ${contact.name}`);
      contact.avatar_url = newAvatarUrl;
    }
  } catch (error) {
    console.error(`❌ Erro ao atualizar avatar de ${contact.name}:`, error);
  }
}

// Versão assíncrona que roda em background (não bloqueia webhook)
function scheduleAvatarUpdate(supabase: any, contact: any, instanceName: string) {
  if (!contact.phone || !shouldUpdateAvatar(contact)) return;
  
  // Usar EdgeRuntime.waitUntil se disponível, senão executar async sem await
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(updateContactProfilePicture(supabase, contact, instanceName));
  } else {
    // Executar em background sem bloquear
    updateContactProfilePicture(supabase, contact, instanceName).catch(err => {
      console.error('Background avatar update failed:', err);
    });
  }
}

// Atualiza foto de grupo em background
async function updateGroupProfilePicture(supabase: any, contact: any, groupJid: string, instanceName: string) {
  if (!shouldUpdateAvatar(contact)) return;
  
  console.log(`📷 [Group Avatar Sync] Verificando foto do grupo ${contact.name}...`);
  
  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionKey) return;
    
    // Tentar buscar foto do grupo
    const response = await fetch(`${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({ number: groupJid }),
    });
    
    if (!response.ok) {
      console.log(`⚠️ Foto do grupo não disponível: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const pictureUrl = data.profilePictureUrl || data.pictureUrl || data.url;
    
    if (!pictureUrl) {
      console.log(`📷 Sem foto para grupo ${contact.name}`);
      return;
    }
    
    // Baixar a imagem
    const imageResp = await fetch(pictureUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!imageResp.ok) return;
    
    const contentType = imageResp.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResp.arrayBuffer();
    const blob = new Uint8Array(imageBuffer);
    
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    
    const fileName = `${contact.id}.${extension}`;
    
    // Upload para storage
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, blob, { contentType, upsert: true });
    
    if (uploadError) {
      // Fallback: usar URL direto
      await supabase.from('contacts')
        .update({ avatar_url: pictureUrl, updated_at: new Date().toISOString() })
        .eq('id', contact.id);
      return;
    }
    
    const { data: urlData } = supabase.storage.from('profile-pictures').getPublicUrl(fileName);
    const newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    
    await supabase.from('contacts')
      .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
      .eq('id', contact.id);
    
    console.log(`✅ Foto do grupo atualizada: ${contact.name}`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar foto do grupo:`, error);
  }
}

// Agendar atualização de foto de grupo em background
function scheduleGroupAvatarUpdate(supabase: any, contact: any, groupJid: string, instanceName: string) {
  if (!shouldUpdateAvatar(contact)) return;
  
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(updateGroupProfilePicture(supabase, contact, groupJid, instanceName));
  } else {
    updateGroupProfilePicture(supabase, contact, groupJid, instanceName).catch(err => {
      console.error('Background group avatar update failed:', err);
    });
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
    }
    // NOTA: Não atualizar updated_at aqui - será feito em processNewMessage
    // exceto para reações que NÃO devem atualizar o timestamp
    
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

async function saveMessage(supabase: any, conversationId: string, message: EvolutionMessage, content: string, phoneNumber: string, instanceName: string, isOutgoing: boolean = false) {
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
  
  // CORREÇÃO: Definir sender_type baseado em fromMe/isOutgoing
  const senderType = isOutgoing || message.key.fromMe ? 'agent' : 'user';
  
  const messageData = {
    conversation_id: conversationId,
    content: content,
    sender_type: senderType,
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
// SAVE GROUP MESSAGE - COM PROCESSAMENTO DE MÍDIA
// ============================================================
async function saveGroupMessage(supabase: any, conversationId: string, message: EvolutionMessage, content: string, participantName: string, groupId: string, instanceName: string) {
  const externalId = message.key.id;
  
  // Check for duplicate
  const alreadyProcessed = await isMessageAlreadyProcessed(supabase, externalId);
  if (alreadyProcessed) {
    console.log(`⚠️ Group message ${externalId} already processed`);
    return null;
  }
  
  // Extract attachment if any - CRITICAL: This was missing in groups!
  let attachment = extractAttachment(message);
  
  if (attachment && attachment.url) {
    console.log('📎 [GROUP] Attachment detected:', attachment.type, attachment.url);
    
    const storageUrl = await downloadAndUploadMedia(supabase, attachment, message, conversationId, instanceName);
    
    if (storageUrl) {
      attachment = {
        ...attachment,
        url: storageUrl,
      };
      console.log('✅ [GROUP] Attachment URL replaced with Supabase Storage URL');
    } else {
      console.log('⚠️ [GROUP] Could not upload media, keeping original URL');
    }
  }
  
  const messageMetadata: Record<string, any> = { 
    external_id: externalId,
    sender_name: participantName,
    isGroup: true,
    groupId: groupId
  };
  
  // CRITICAL: Include attachment in metadata for groups
  if (attachment) {
    messageMetadata.attachment = attachment;
    console.log('📎 [GROUP] Attachment added to metadata:', attachment.type);
  }
  
  const messageData = {
    conversation_id: conversationId,
    content: `*${participantName}*:\n${content}`,
    sender_type: 'user',
    metadata: messageMetadata,
    created_at: message.messageTimestamp 
      ? new Date(message.messageTimestamp * 1000).toISOString() 
      : new Date().toISOString()
  };
  
  console.log('📥 [GROUP] Saving group message with data:', JSON.stringify({
    ...messageData,
    metadata: {
      ...messageMetadata,
      attachment: attachment ? `${attachment.type} (${attachment.url?.substring(0, 50)}...)` : null
    }
  }, null, 2));
  
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      console.log('⚠️ [GROUP] Duplicate message detected by constraint.');
      return null;
    }
    console.error('❌ [GROUP] Error saving message:', error);
    throw error;
  }
  
  if (!data) {
    console.error('❌ [GROUP] Message insert returned no data');
    throw new Error('Failed to save group message');
  }

  console.log('✅ [GROUP] Message saved successfully with ID:', data.id);
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
  
  // Tratar reações (emoji reactions)
  if ((msgContent as any).reactionMessage) {
    const reaction = (msgContent as any).reactionMessage;
    const emoji = reaction.text || '👍';
    const quotedText = reaction.key?.id ? 'mensagem' : 'mensagem';
    return `Reagiu com ${emoji}`;
  }
  
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

// Verificar se a mensagem é uma reação
function isReactionMessage(message: EvolutionMessage): boolean {
  return !!(message.message as any)?.reactionMessage;
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
