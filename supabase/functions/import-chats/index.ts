import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceName } = await req.json();
    
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
    console.log(`📥 IMPORTAÇÃO COMPLETA: ${instanceName}`);
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
    const stats = { contacts: 0, conversations: 0, messages: 0, groups: 0, skipped: 0, updated: 0 };

    // ==========================================
    // ESTRATÉGIA: BUSCAR CONTATOS + CHATS + GRUPOS
    // Para garantir cobertura completa
    // ==========================================

    // 1. BUSCAR TODOS OS CONTATOS (fonte mais completa)
    console.log(`📥 Buscando contatos...`);
    let allContacts: any[] = [];
    try {
      const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: {} })
      });
      if (contactsResponse.ok) {
        const data = await contactsResponse.json();
        allContacts = Array.isArray(data) ? data : [];
        console.log(`✅ ${allContacts.length} contatos encontrados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro buscando contatos: ${e}`);
    }

    // 2. BUSCAR CHATS (para timestamps e dados adicionais)
    console.log(`📥 Buscando chats...`);
    let allChats: any[] = [];
    try {
      const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        allChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || []);
        console.log(`✅ ${allChats.length} chats ativos encontrados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro buscando chats: ${e}`);
    }

    // 3. BUSCAR GRUPOS
    console.log(`📥 Buscando grupos...`);
    let allGroups: any[] = [];
    try {
      const groupsResponse = await fetch(`${evolutionApiUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
        headers: { 'apikey': evolutionApiKey }
      });
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        allGroups = Array.isArray(groupsData) ? groupsData : [];
        console.log(`✅ ${allGroups.length} grupos encontrados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro buscando grupos: ${e}`);
    }

    // Criar mapa de JIDs para evitar duplicatas
    const processedJids = new Set<string>();
    const jidToData = new Map<string, any>();

    // Mapear chats por JID (fonte primária de timestamps)
    for (const chat of allChats) {
      const jid = chat.remoteJid || chat.id || chat.jid;
      if (jid) {
        jidToData.set(jid, { ...jidToData.get(jid), ...chat });
      }
    }

    // Adicionar contatos ao mapa
    for (const contact of allContacts) {
      const jid = contact.remoteJid || contact.jid || contact.id;
      if (jid) {
        const existing = jidToData.get(jid) || {};
        jidToData.set(jid, { 
          ...existing,
          pushName: contact.pushName || existing.pushName,
          name: contact.name || existing.name,
          profilePictureUrl: contact.profilePictureUrl || existing.profilePictureUrl
        });
      }
    }

    // Adicionar grupos ao mapa
    for (const group of allGroups) {
      const jid = group.id || group.jid;
      if (jid) {
        jidToData.set(jid, { 
          ...jidToData.get(jid), 
          ...group,
          isGroup: true,
          name: group.subject || group.name
        });
      }
    }

    console.log(`\n📊 Total de JIDs únicos para processar: ${jidToData.size}\n`);

    // 4. PROCESSAR CADA JID
    let processed = 0;
    const total = jidToData.size;

    for (const [jid, data] of jidToData) {
      processed++;
      
      // Filtros básicos
      if (!jid || jid.includes('@broadcast') || jid.startsWith('status@') || jid.includes('@lid')) {
        stats.skipped++;
        continue;
      }

      const isGroup = jid.includes('@g.us') || data.isGroup === true;
      const chatName = data.subject || data.name || data.pushName || data.notify || data.verifiedName || '';

      try {
        // Extrair telefone (para não-grupos)
        let phone = '';
        if (!isGroup) {
          const phoneMatch = jid.match(/^(\d+)@/);
          if (!phoneMatch) {
            stats.skipped++;
            continue;
          }
          phone = phoneMatch[1];
          
          // Normalizar telefone brasileiro
          if (phone.length === 10 || phone.length === 11) {
            phone = '55' + phone;
          }
          
          // Validação flexível
          if (phone.length < 8 || phone.length > 15) {
            stats.skipped++;
            continue;
          }
        }

        // BUSCAR MENSAGENS - aumentado limite para 1000
        const messages = await fetchMessagesFromApi(evolutionApiUrl, evolutionApiKey, instanceName, jid, 1000);
        
        if (messages.length === 0) {
          stats.skipped++;
          continue;
        }

        // Log de progresso a cada 20 processados
        if (processed % 20 === 0) {
          console.log(`  📊 Progresso: ${processed}/${total} (${stats.conversations} conversas, ${stats.messages} mensagens)`);
        }

        // Criar/atualizar contato
        let contactId: string | null = null;
        const profilePic = data.profilePictureUrl || data.imgUrl || null;

        if (isGroup) {
          stats.groups++;
          const groupName = chatName || `Grupo ${jid.slice(-8)}`;

          let { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('company_id', companyId)
            .eq('metadata->>remoteJid', jid)
            .maybeSingle();

          if (!existingContact) {
            const { data: newContact } = await supabase
              .from('contacts')
              .insert({
                company_id: companyId,
                name: groupName,
                avatar_url: profilePic,
                metadata: { remoteJid: jid, isGroup: true }
              })
              .select('id')
              .single();
            contactId = newContact?.id;
            if (contactId) stats.contacts++;
          } else {
            contactId = existingContact.id;
            // Atualizar nome do grupo se mudou
            if (chatName) {
              await supabase.from('contacts').update({ name: groupName }).eq('id', contactId);
            }
          }
        } else {
          // Contato individual - buscar por telefone
          let { data: existingContact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('phone', phone)
            .maybeSingle();

          if (!existingContact) {
            const contactName = chatName || phone;
            const { data: newContact } = await supabase
              .from('contacts')
              .insert({
                company_id: companyId,
                name: contactName,
                phone: phone,
                avatar_url: profilePic,
                metadata: { remoteJid: jid }
              })
              .select('id')
              .single();
            contactId = newContact?.id;
            if (contactId) stats.contacts++;
          } else {
            contactId = existingContact.id;
            
            // IMPORTANTE: Atualizar nome se estava usando telefone como nome
            const shouldUpdateName = chatName && 
              (existingContact.name === phone || 
               existingContact.name === existingContact.id ||
               /^\d+$/.test(existingContact.name));
               
            if (shouldUpdateName) {
              await supabase.from('contacts').update({ 
                name: chatName,
                metadata: { remoteJid: jid }
              }).eq('id', contactId);
              stats.updated++;
            }
          }
        }

        if (!contactId) continue;

        // Criar/encontrar conversa
        let { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('company_id', companyId)
          .eq('contact_id', contactId)
          .eq('channel', 'whatsapp')
          .maybeSingle();

        let convId = existingConv?.id;

        if (!existingConv) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              company_id: companyId,
              contact_id: contactId,
              channel: 'whatsapp',
              status: 'open',
              metadata: isGroup 
                ? { isGroup: true, remoteJid: jid, instanceName }
                : { remoteJid: jid, instanceName }
            })
            .select('id')
            .single();
          convId = newConv?.id;
          if (convId) stats.conversations++;
        }

        if (!convId) continue;

        // Importar mensagens
        const imported = await importMessagesToDb(supabase, convId, messages, jid);
        stats.messages += imported;

      } catch (err) {
        console.error(`Erro processando ${jid}:`, err);
      }
    }

    // Sync profile pictures
    console.log(`\n📷 Sincronizando fotos de perfil...`);
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-profile-pictures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instanceName, companyId })
      });
    } catch (e) {
      console.log(`  ⚠️ Não foi possível sincronizar fotos`);
    }

    console.log(`\n========================================`);
    console.log(`✅ IMPORTAÇÃO CONCLUÍDA`);
    console.log(`========================================`);
    console.log(`📊 JIDs processados: ${processed}`);
    console.log(`📊 Contatos criados: ${stats.contacts}`);
    console.log(`📊 Contatos atualizados: ${stats.updated}`);
    console.log(`📊 Conversas criadas: ${stats.conversations}`);
    console.log(`📊 Mensagens importadas: ${stats.messages}`);
    console.log(`📊 Grupos: ${stats.groups}`);
    console.log(`📊 Ignorados: ${stats.skipped}`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({ 
      success: true,
      stats,
      totalJids: jidToData.size,
      processed
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha ao importar conversas', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// Buscar mensagens da API Evolution
async function fetchMessagesFromApi(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  instanceName: string,
  jid: string,
  limit: number = 1000
): Promise<any[]> {
  try {
    const response = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: { key: { remoteJid: jid } }, limit })
    });
    
    if (!response.ok) return [];

    const data = await response.json();
    const rawMessages = data?.messages;
    
    let messages: any[] = [];
    if (Array.isArray(rawMessages)) {
      messages = rawMessages;
    } else if (rawMessages?.records && Array.isArray(rawMessages.records)) {
      messages = rawMessages.records;
    } else if (data?.records && Array.isArray(data.records)) {
      messages = data.records;
    } else if (Array.isArray(data)) {
      messages = data;
    }
    
    return messages;
  } catch (err) {
    return [];
  }
}

// Importar mensagens para o banco de dados
async function importMessagesToDb(
  supabase: any,
  conversationId: string,
  messages: any[],
  jid: string
): Promise<number> {
  try {
    // Get existing messageIds to avoid duplicates
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);
    
    const existingMessageIds = new Set(
      (existingMsgs || [])
        .map((m: any) => m.metadata?.messageId || m.metadata?.external_id)
        .filter(Boolean)
    );

    let imported = 0;
    const messagesToInsert: any[] = [];

    for (const msg of messages) {
      const messageId = msg.key?.id || msg.id;
      if (!messageId || existingMessageIds.has(messageId)) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const fromMe = msg.key?.fromMe === true;
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      // Extrair dados de mídia para persistência
      const attachment = extractAttachment(msg);

      messagesToInsert.push({
        conversation_id: conversationId,
        sender_type: fromMe ? 'agent' : 'user',
        content,
        created_at: timestamp,
        metadata: { 
          messageId, 
          fromMe, 
          remoteJid: jid,
          ...(attachment && { attachment })
        }
      });

      existingMessageIds.add(messageId);
      imported++;
    }

    // Insert em batch para performance
    if (messagesToInsert.length > 0) {
      // Insert em chunks de 100 para evitar timeout
      for (let i = 0; i < messagesToInsert.length; i += 100) {
        const chunk = messagesToInsert.slice(i, i + 100);
        await supabase.from('messages').insert(chunk);
      }

      // Update conversation timestamp with last message
      const { data: lastMsg } = await supabase
        .from('messages')
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

    return imported;
  } catch (err) {
    console.error(`Erro importando mensagens:`, err);
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
  
  return '';
}

function extractAttachment(msg: any): any {
  const m = msg.message || msg;
  
  if (m.imageMessage) {
    return {
      type: 'image',
      mimetype: m.imageMessage.mimetype,
      caption: m.imageMessage.caption,
      hasMedia: true
    };
  }
  if (m.videoMessage) {
    return {
      type: 'video',
      mimetype: m.videoMessage.mimetype,
      caption: m.videoMessage.caption,
      hasMedia: true
    };
  }
  if (m.audioMessage) {
    return {
      type: 'audio',
      mimetype: m.audioMessage.mimetype,
      ptt: m.audioMessage.ptt,
      hasMedia: true
    };
  }
  if (m.documentMessage) {
    return {
      type: 'document',
      mimetype: m.documentMessage.mimetype,
      fileName: m.documentMessage.fileName,
      hasMedia: true
    };
  }
  
  return null;
}