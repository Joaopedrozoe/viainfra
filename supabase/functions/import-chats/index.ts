import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial'];
const BATCH_SIZE = 30; // Process chats in batches
const MESSAGE_LIMIT = 500; // Messages per chat

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceName, forceFullSync = false, specificJids = [] } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!ALLOWED_INSTANCES.includes(instanceName) && !ALLOWED_INSTANCES.includes(instanceName.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Instância não autorizada' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API configuration missing' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`\n========================================`);
    console.log(`📥 IMPORTAÇÃO V3: ${instanceName}`);
    console.log(`   forceFullSync: ${forceFullSync}`);
    console.log(`   specificJids: ${specificJids.length || 'all'}`);
    console.log(`========================================\n`);

    // Get instance record
    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord?.company_id) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;
    console.log(`📍 Company ID: ${companyId}`);

    // Check connection
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionApiKey }
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({ error: 'Instância não acessível' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const statusData = await statusResponse.json();
    const connectionState = statusData?.instance?.state || statusData?.state;
    
    if (connectionState !== 'open' && connectionState !== 'connected') {
      return new Response(JSON.stringify({ error: `Não conectada: ${connectionState}` }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Stats
    const stats = { 
      newContacts: 0, 
      newConversations: 0, 
      updatedConversations: 0,
      newMessages: 0, 
      groups: 0, 
      skipped: 0, 
      errors: 0,
      namesFixed: 0
    };

    // ==========================================
    // PASSO 1: BUSCAR CONTATOS (para nomes)
    // ==========================================
    console.log(`\n📥 PASSO 1: Buscando nomes de contatos...`);
    const contactsNameMap = new Map<string, string>();
    
    try {
      const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        const contacts = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || []);
        
        for (const contact of contacts) {
          const jid = contact.id || contact.jid || contact.remoteJid;
          const name = contact.pushName || contact.name || contact.notify || contact.verifiedName || contact.shortName;
          
          if (jid && name && !jid.includes('@g.us') && !jid.includes('@lid')) {
            const phoneMatch = jid.match(/^(\d+)@/);
            if (phoneMatch) {
              const phone = phoneMatch[1];
              contactsNameMap.set(phone, name);
              // Add variants
              if (phone.startsWith('55') && phone.length >= 12) {
                contactsNameMap.set(phone.slice(2), name);
              } else if (phone.length >= 10 && phone.length <= 11) {
                contactsNameMap.set('55' + phone, name);
              }
            }
          }
        }
        console.log(`   ✅ ${contactsNameMap.size} nomes mapeados`);
      }
    } catch (e) {
      console.log(`   ⚠️ Erro: ${e}`);
    }

    // ==========================================
    // PASSO 2: BUSCAR TODOS OS CHATS
    // ==========================================
    console.log(`\n📥 PASSO 2: Buscando chats da Evolution API...`);
    let allChats: any[] = [];
    
    // Try multiple methods to get all chats
    const chatMethods = [
      { body: {}, name: 'default' },
      { body: { limit: 1000 }, name: 'limit:1000' },
      { body: { limit: 500 }, name: 'limit:500' }
    ];

    for (const method of chatMethods) {
      try {
        const response = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(method.body)
        });
        
        if (response.ok) {
          const data = await response.json();
          const chats = Array.isArray(data) ? data : (data?.chats || []);
          if (chats.length > allChats.length) {
            allChats = chats;
            console.log(`   ✅ ${method.name}: ${chats.length} chats`);
          }
        }
      } catch (e) {
        console.log(`   ⚠️ ${method.name} falhou`);
      }
    }

    console.log(`   📊 Total: ${allChats.length} chats encontrados`);

    // ==========================================
    // PASSO 3: BUSCAR GRUPOS
    // ==========================================
    console.log(`\n📥 PASSO 3: Buscando metadados de grupos...`);
    const groupsMap = new Map<string, any>();
    
    try {
      const response = await fetch(`${evolutionApiUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
        headers: { 'apikey': evolutionApiKey }
      });
      if (response.ok) {
        const groups = await response.json();
        for (const group of (Array.isArray(groups) ? groups : [])) {
          const jid = group.id || group.jid;
          if (jid) groupsMap.set(jid, group);
        }
        console.log(`   ✅ ${groupsMap.size} grupos mapeados`);
      }
    } catch (e) {
      console.log(`   ⚠️ Erro: ${e}`);
    }

    // ==========================================
    // PASSO 4: CARREGAR CONVERSAS EXISTENTES DO DB
    // ==========================================
    console.log(`\n📥 PASSO 4: Carregando conversas existentes...`);
    
    const { data: existingConversations } = await supabase
      .from('conversations')
      .select(`
        id, 
        contact_id,
        metadata,
        contacts!conversations_contact_id_fkey(id, name, phone, metadata)
      `)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    // Build lookup maps
    const convByJid = new Map<string, any>();
    const convByPhone = new Map<string, any>();
    const contactByPhone = new Map<string, any>();
    
    for (const conv of existingConversations || []) {
      const jid = conv.metadata?.remoteJid;
      if (jid) convByJid.set(jid, conv);
      
      const phone = conv.contacts?.phone;
      if (phone) {
        convByPhone.set(phone, conv);
        contactByPhone.set(phone, conv.contacts);
        // Add variants
        if (phone.startsWith('55')) {
          convByPhone.set(phone.slice(2), conv);
          contactByPhone.set(phone.slice(2), conv.contacts);
        } else if (phone.length >= 10) {
          convByPhone.set('55' + phone, conv);
          contactByPhone.set('55' + phone, conv.contacts);
        }
      }
    }

    console.log(`   📊 ${existingConversations?.length || 0} conversas existentes`);

    // ==========================================
    // PASSO 5: PROCESSAR CHATS EM BATCHES
    // ==========================================
    console.log(`\n📥 PASSO 5: Processando ${allChats.length} chats...\n`);
    
    // Filter chats to process
    let chatsToProcess = allChats.filter(chat => {
      const jid = chat.remoteJid || chat.id || chat.jid;
      if (!jid) return false;
      if (jid.includes('@lid') || jid.includes('@broadcast') || jid.startsWith('status@')) return false;
      if (specificJids.length > 0 && !specificJids.includes(jid)) return false;
      return true;
    });

    console.log(`   📊 ${chatsToProcess.length} chats válidos para processar`);

    // Process in batches
    for (let batchStart = 0; batchStart < chatsToProcess.length; batchStart += BATCH_SIZE) {
      const batch = chatsToProcess.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chatsToProcess.length / BATCH_SIZE);
      
      console.log(`\n   📦 Batch ${batchNum}/${totalBatches} (${batch.length} chats)`);
      
      for (const chat of batch) {
        const jid = chat.remoteJid || chat.id || chat.jid;
        const isGroup = jid.includes('@g.us');
        
        try {
          // Extract info
          const groupData = isGroup ? groupsMap.get(jid) : null;
          let chatName = groupData?.subject || chat.name || chat.pushName || chat.notify || '';
          const profilePic = chat.profilePictureUrl || chat.imgUrl || null;
          
          // For contacts, extract phone and get name from map
          let phone = '';
          if (!isGroup) {
            const phoneMatch = jid.match(/^(\d+)@/);
            if (!phoneMatch) { stats.skipped++; continue; }
            phone = phoneMatch[1];
            
            // Normalize phone
            if (!phone.startsWith('55') && phone.length <= 11) {
              phone = '55' + phone;
            }
            
            // Get name from contacts map if needed
            if (!chatName || /^\d+$/.test(chatName)) {
              chatName = contactsNameMap.get(phone) || 
                        contactsNameMap.get(phone.slice(2)) || 
                        phone;
            }
          }

          // Check if conversation exists
          let existingConv = convByJid.get(jid) || (phone ? convByPhone.get(phone) : null);
          let contactId = existingConv?.contact_id;
          let conversationId = existingConv?.id;
          let isNewConversation = !existingConv;

          // Create contact if needed
          if (!contactId) {
            if (isGroup) {
              stats.groups++;
              const groupName = chatName || `Grupo ${jid.slice(-8)}`;
              
              const { data: newContact } = await supabase.from('contacts').insert({
                company_id: companyId,
                name: groupName,
                avatar_url: profilePic,
                metadata: { remoteJid: jid, isGroup: true }
              }).select('id').single();
              
              contactId = newContact?.id;
              if (contactId) stats.newContacts++;
            } else {
              const contactName = chatName || phone;
              
              const { data: newContact } = await supabase.from('contacts').insert({
                company_id: companyId,
                name: contactName,
                phone: phone,
                avatar_url: profilePic,
                metadata: { remoteJid: jid }
              }).select('id').single();
              
              contactId = newContact?.id;
              if (contactId) stats.newContacts++;
            }
          } else {
            // Update contact name if it's just numbers
            const existingName = existingConv?.contacts?.name || '';
            if (/^\d+$/.test(existingName) && chatName && !/^\d+$/.test(chatName)) {
              await supabase.from('contacts').update({ 
                name: chatName,
                metadata: { ...existingConv?.contacts?.metadata, remoteJid: jid },
                updated_at: new Date().toISOString()
              }).eq('id', contactId);
              stats.namesFixed++;
            }
            
            // Ensure remoteJid is in metadata
            if (!existingConv?.contacts?.metadata?.remoteJid) {
              await supabase.from('contacts').update({ 
                metadata: { ...existingConv?.contacts?.metadata, remoteJid: jid },
                updated_at: new Date().toISOString()
              }).eq('id', contactId);
            }
          }

          if (!contactId) { stats.skipped++; continue; }

          // Create conversation if needed
          if (!conversationId) {
            const { data: newConv } = await supabase.from('conversations').insert({
              company_id: companyId,
              contact_id: contactId,
              channel: 'whatsapp',
              status: 'open',
              metadata: isGroup 
                ? { isGroup: true, remoteJid: jid, instanceName } 
                : { remoteJid: jid, instanceName }
            }).select('id').single();
            
            conversationId = newConv?.id;
            isNewConversation = true;
          } else {
            // Ensure metadata has remoteJid
            if (!existingConv?.metadata?.remoteJid) {
              await supabase.from('conversations').update({
                metadata: { ...existingConv?.metadata, remoteJid: jid, instanceName }
              }).eq('id', conversationId);
            }
          }

          if (!conversationId) { stats.skipped++; continue; }

          // Fetch and import messages
          const messages = await fetchMessagesFromEvolution(evolutionApiUrl, evolutionApiKey, instanceName, jid, MESSAGE_LIMIT);
          
          if (messages.length > 0) {
            const imported = await importMessages(supabase, conversationId, messages, jid, forceFullSync);
            stats.newMessages += imported;
            
            if (isNewConversation && imported > 0) {
              stats.newConversations++;
              console.log(`      ✅ NOVO: ${chatName || phone} (+${imported} msgs)`);
            } else if (!isNewConversation && imported > 0) {
              stats.updatedConversations++;
              console.log(`      🔄 ATUALIZADO: ${chatName || phone} (+${imported} msgs)`);
            }
          } else if (isNewConversation) {
            // Remove empty conversation
            await supabase.from('conversations').delete().eq('id', conversationId);
            stats.skipped++;
          }

        } catch (err) {
          console.error(`      ❌ Erro: ${jid}`, err);
          stats.errors++;
        }
      }
      
      // Small delay between batches
      await new Promise(r => setTimeout(r, 200));
    }

    // ==========================================
    // PASSO 6: LIMPEZA
    // ==========================================
    console.log(`\n📥 PASSO 6: Limpando conversas vazias...`);
    
    const { data: allConvs } = await supabase.from('conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    let cleaned = 0;
    for (const conv of allConvs || []) {
      const { count } = await supabase.from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);
      
      if (!count || count === 0) {
        await supabase.from('conversations').delete().eq('id', conv.id);
        cleaned++;
      }
    }
    console.log(`   🗑️ ${cleaned} conversas vazias removidas`);

    // ==========================================
    // PASSO 7: ATUALIZAR TIMESTAMPS
    // ==========================================
    console.log(`\n📥 PASSO 7: Atualizando timestamps...`);
    
    const { data: convsToUpdate } = await supabase.from('conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    for (const conv of convsToUpdate || []) {
      const { data: lastMsg } = await supabase.from('messages')
        .select('created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastMsg) {
        await supabase.from('conversations')
          .update({ updated_at: lastMsg.created_at })
          .eq('id', conv.id);
      }
    }

    // ==========================================
    // PASSO 8: SYNC FOTOS
    // ==========================================
    console.log(`\n📥 PASSO 8: Sincronizando fotos de perfil...`);
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-profile-pictures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companyId, forceUpdate: forceFullSync })
      });
      console.log(`   ✅ Sync de fotos iniciado`);
    } catch (e) {
      console.log(`   ⚠️ Erro sync fotos: ${e}`);
    }

    // Final count
    const { count: finalConvCount } = await supabase.from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    console.log(`\n========================================`);
    console.log(`✅ IMPORTAÇÃO V3 CONCLUÍDA`);
    console.log(`   Conversas totais: ${finalConvCount}`);
    console.log(`   Novas conversas: ${stats.newConversations}`);
    console.log(`   Atualizadas: ${stats.updatedConversations}`);
    console.log(`   Novos contatos: ${stats.newContacts}`);
    console.log(`   Novas mensagens: ${stats.newMessages}`);
    console.log(`   Nomes corrigidos: ${stats.namesFixed}`);
    console.log(`   Grupos: ${stats.groups}`);
    console.log(`   Pulados: ${stats.skipped}`);
    console.log(`   Erros: ${stats.errors}`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({
      success: true,
      stats: { ...stats, totalConversations: finalConvCount, cleaned },
      message: `V3: ${finalConvCount} conversas, ${stats.newConversations} novas, ${stats.updatedConversations} atualizadas, ${stats.newMessages} mensagens`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno',
      details: String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

async function fetchMessagesFromEvolution(
  apiUrl: string,
  apiKey: string,
  instanceName: string,
  jid: string,
  limit: number
): Promise<any[]> {
  const attempts = [
    { where: { key: { remoteJid: jid } }, limit },
    { where: { remoteJid: jid }, limit },
    { remoteJid: jid, limit }
  ];

  for (const body of attempts) {
    try {
      const response = await fetch(`${apiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) continue;

      const data = await response.json();
      let messages: any[] = [];
      
      if (Array.isArray(data?.messages)) messages = data.messages;
      else if (Array.isArray(data?.messages?.records)) messages = data.messages.records;
      else if (Array.isArray(data?.records)) messages = data.records;
      else if (Array.isArray(data)) messages = data;
      
      if (messages.length > 0) return messages;
    } catch (err) { /* continue */ }
  }
  
  return [];
}

async function importMessages(
  supabase: any,
  conversationId: string,
  messages: any[],
  jid: string,
  forceSync: boolean
): Promise<number> {
  try {
    // Get existing message IDs
    const { data: existingMsgs } = await supabase.from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);
    
    const existingIds = new Set(
      (existingMsgs || []).map((m: any) => m.metadata?.messageId).filter(Boolean)
    );

    // Sort messages chronologically
    const sorted = [...messages].sort((a, b) => {
      return Number(a.messageTimestamp || 0) - Number(b.messageTimestamp || 0);
    });

    const toInsert: any[] = [];

    for (const msg of sorted) {
      const messageId = msg.key?.id || msg.id;
      if (!messageId || existingIds.has(messageId)) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const fromMe = msg.key?.fromMe === true;
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      toInsert.push({
        conversation_id: conversationId,
        sender_type: fromMe ? 'agent' : 'user',
        content,
        created_at: timestamp,
        metadata: { 
          messageId, 
          fromMe, 
          remoteJid: jid,
          syncedAt: new Date().toISOString(),
          ...extractAttachment(msg)
        }
      });

      existingIds.add(messageId);
    }

    // Insert in batches
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 50) {
        const chunk = toInsert.slice(i, i + 50);
        try {
          const { error } = await supabase.from('messages').insert(chunk);
          if (error && error.code !== '23505') {
            console.error(`   Insert error:`, error);
          }
        } catch (e: any) {
          if (e.code !== '23505') console.error(`   Insert exception:`, e);
        }
      }

      // Update conversation timestamp
      const { data: lastMsg } = await supabase.from('messages')
        .select('created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        await supabase.from('conversations')
          .update({ updated_at: lastMsg.created_at })
          .eq('id', conversationId);
      }
    }

    return toInsert.length;
  } catch (err) {
    console.error(`   Import error:`, err);
    return 0;
  }
}

function extractContent(msg: any): string {
  const m = msg.message || msg;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `📷 ${m.imageMessage.caption}`;
  if (m.imageMessage) return '📷 Imagem';
  if (m.videoMessage?.caption) return `🎬 ${m.videoMessage.caption}`;
  if (m.videoMessage) return '🎬 Vídeo';
  if (m.audioMessage) return '🎵 Áudio';
  if (m.documentMessage?.fileName) return `📄 ${m.documentMessage.fileName}`;
  if (m.documentMessage) return '📄 Documento';
  if (m.stickerMessage) return '🎨 Sticker';
  if (m.locationMessage) return '📍 Localização';
  if (m.contactMessage) return '👤 Contato';
  if (m.reactionMessage) return `${m.reactionMessage.text || '👍'}`;
  if (m.pollCreationMessage) return `📊 ${m.pollCreationMessage.name || 'Enquete'}`;
  return '';
}

function extractAttachment(msg: any): any {
  const m = msg.message || msg;
  if (m.imageMessage) return { attachment: { type: 'image', mimetype: m.imageMessage.mimetype, hasMedia: true } };
  if (m.videoMessage) return { attachment: { type: 'video', mimetype: m.videoMessage.mimetype, hasMedia: true } };
  if (m.audioMessage) return { attachment: { type: 'audio', mimetype: m.audioMessage.mimetype, ptt: m.audioMessage.ptt, hasMedia: true } };
  if (m.documentMessage) return { attachment: { type: 'document', mimetype: m.documentMessage.mimetype, fileName: m.documentMessage.fileName, hasMedia: true } };
  return {};
}
