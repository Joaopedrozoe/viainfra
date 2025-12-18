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
    console.log(`📥 IMPORTAÇÃO: ${instanceName}`);
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
    const stats = { contacts: 0, conversations: 0, messages: 0, groups: 0 };

    // 1. BUSCAR CHATS
    console.log(`📥 Buscando chats...`);
    
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error('Falha ao buscar chats');
    }

    const chatsData = await chatsResponse.json();
    const allChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || []);
    console.log(`✅ ${allChats.length} chats encontrados`);

    // 2. BUSCAR CONTATOS PARA NOMES
    let contactsData: any[] = [];
    try {
      const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: {} })
      });
      if (contactsResponse.ok) {
        const data = await contactsResponse.json();
        contactsData = Array.isArray(data) ? data : [];
      }
    } catch (e) { /* ignore */ }

    // Mapa JID -> nome
    const nameMap = new Map<string, string>();
    for (const c of contactsData) {
      const jid = c.remoteJid || c.jid || c.id;
      const name = c.pushName || c.name || c.notify || c.verifiedName;
      if (jid && name) nameMap.set(jid, name);
    }

    // 3. PROCESSAR CHATS (limite de 100 para evitar timeout)
    const chatsToProcess = allChats.slice(0, 100);
    console.log(`🔄 Processando ${chatsToProcess.length} chats...\n`);

    for (const chat of chatsToProcess) {
      const jid = chat.remoteJid || chat.id || chat.jid || '';
      if (!jid || jid.includes('@broadcast') || jid.startsWith('status@')) continue;
      
      const isGroup = jid.includes('@g.us');
      const chatName = chat.name || chat.pushName || chat.subject || nameMap.get(jid) || '';
      const profilePic = chat.profilePictureUrl || chat.imgUrl || null;

      try {
        let contactId: string | null = null;
        let convId: string | null = null;
        
        if (isGroup) {
          stats.groups++;
          let groupName = chatName || `Grupo ${jid.slice(-8)}`;

          // Criar/encontrar contato do grupo
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

          if (!existingConv) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                company_id: companyId,
                contact_id: contactId,
                channel: 'whatsapp',
                status: 'open',
                metadata: { isGroup: true, remoteJid: jid, instanceName }
              })
              .select('id')
              .single();
            convId = newConv?.id;
            if (convId) stats.conversations++;
          } else {
            convId = existingConv.id;
          }
        } else {
          // CONTATO INDIVIDUAL
          const isLid = jid.includes('@lid');
          const phoneMatch = jid.match(/^(\d+)@/);
          if (!phoneMatch) continue;
          
          const rawNumber = phoneMatch[1];
          if (rawNumber.length > 15) continue; // ID inválido
          
          let phone = rawNumber;
          const name = chatName || nameMap.get(jid) || '';

          if (isLid) {
            if (!name || name === rawNumber) continue;
            
            // Match por nome
            const normalizeStr = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const normalizedName = normalizeStr(name);
            
            const { data: allContacts } = await supabase
              .from('contacts')
              .select('id, name, phone')
              .eq('company_id', companyId)
              .not('phone', 'is', null);
            
            let existingContact = null;
            if (allContacts) {
              existingContact = allContacts.find(c => {
                if (!c.name) return false;
                const normalizedContactName = normalizeStr(c.name);
                return normalizedContactName === normalizedName || 
                       normalizedContactName.includes(normalizedName) ||
                       normalizedName.includes(normalizedContactName);
              });
            }
            
            if (!existingContact) continue;
            
            contactId = existingContact.id;
            phone = existingContact.phone;
          } else {
            // Normalizar telefone
            if (phone.length === 10 || phone.length === 11) {
              phone = '55' + phone;
            }
            if (phone.length < 8 || phone.length > 15) continue;

            // Criar/encontrar contato
            let { data: existingContact } = await supabase
              .from('contacts')
              .select('id, name, avatar_url')
              .eq('company_id', companyId)
              .eq('phone', phone)
              .maybeSingle();

            if (!existingContact) {
              const { data: newContact } = await supabase
                .from('contacts')
                .insert({
                  company_id: companyId,
                  name: name || phone,
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

          if (!existingConv) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                company_id: companyId,
                contact_id: contactId,
                channel: 'whatsapp',
                status: 'open',
                metadata: { remoteJid: jid, instanceName }
              })
              .select('id')
              .single();
            convId = newConv?.id;
            if (convId) stats.conversations++;
          } else {
            convId = existingConv.id;
          }
        }

        // IMPORTAR MENSAGENS
        if (convId && jid) {
          const msgCount = await syncMessagesSimple(supabase, evolutionApiUrl, evolutionApiKey, instanceName, convId, jid);
          stats.messages += msgCount;
        }
      } catch (err) {
        console.error(`Erro processando ${jid}:`, err);
      }
    }

    // Sync profile pictures
    console.log(`📷 Sincronizando fotos de perfil...`);
    const { data: contactsWithoutPic } = await supabase
      .from('contacts')
      .select('id, phone, metadata')
      .eq('company_id', companyId)
      .is('avatar_url', null)
      .not('phone', 'is', null)
      .limit(50);

    console.log(`📷 ${contactsWithoutPic?.length || 0} contatos sem foto`);

    for (const contact of contactsWithoutPic || []) {
      try {
        const jid = contact.metadata?.remoteJid || `${contact.phone}@s.whatsapp.net`;
        const picResponse = await fetch(`${evolutionApiUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: jid })
        });
        
        if (picResponse.ok) {
          const picData = await picResponse.json();
          const picUrl = picData?.profilePictureUrl || picData?.profilePicUrl || picData?.url;
          if (picUrl) {
            await supabase.from('contacts').update({ avatar_url: picUrl }).eq('id', contact.id);
            console.log(`  ✅ Foto atualizada: ${contact.phone}`);
          }
        }
      } catch (e) { /* ignore */ }
    }

    console.log(`\n========================================`);
    console.log(`✅ IMPORTAÇÃO CONCLUÍDA`);
    console.log(`========================================`);
    console.log(`📊 Contatos: ${stats.contacts} criados`);
    console.log(`📊 Conversas: ${stats.conversations} criadas`);
    console.log(`📊 Mensagens: ${stats.messages} importadas`);
    console.log(`📊 Grupos: ${stats.groups}`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({ 
      success: true,
      stats,
      totalChats: allChats.length,
      processedChats: chatsToProcess.length
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

// Simplified message sync
async function syncMessagesSimple(
  supabase: any,
  evolutionApiUrl: string,
  evolutionApiKey: string,
  instanceName: string,
  conversationId: string,
  jid: string
): Promise<number> {
  try {
    console.log(`  🔍 Buscando mensagens para jid: ${jid}`);
    console.log(`  📡 URL: ${evolutionApiUrl}/chat/findMessages/${instanceName}`);
    
    const response = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: { key: { remoteJid: jid } }, limit: 1000 })
    });
    
    console.log(`  📥 Status: ${response.status}`);
    
    if (!response.ok) return 0;

    const data = await response.json();
    const rawMessages = data?.messages;
    console.log(`  📦 data type: ${typeof data}, keys: ${Object.keys(data || {}).join(', ')}`);
    console.log(`  📦 rawMessages type: ${typeof rawMessages}, isArray: ${Array.isArray(rawMessages)}`);
    
    // Handle multiple possible response structures:
    // { messages: [...] } or { messages: { records: [...] } } or { records: [...] }
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
    
    console.log(`  📨 ${messages.length} mensagens encontradas`);
    
    if (!messages.length) return 0;

    // Get existing messageIds for this conversation to avoid duplicates
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);
    
    const existingMessageIds = new Set(
      (existingMsgs || [])
        .map(m => m.metadata?.messageId || m.metadata?.external_id)
        .filter(Boolean)
    );
    
    console.log(`  📦 ${existingMessageIds.size} mensagens já existentes`);

    let imported = 0;
    for (const msg of messages) {
      const messageId = msg.key?.id || msg.id;
      if (!messageId) continue;
      
      // Skip if message already exists
      if (existingMessageIds.has(messageId)) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const fromMe = msg.key?.fromMe === true;
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: fromMe ? 'agent' : 'user',
        content,
        created_at: timestamp,
        metadata: { messageId, fromMe, remoteJid: jid }
      });

      // Add to set to prevent duplicates within same import batch
      existingMessageIds.add(messageId);
      imported++;
    }

    // Update conversation timestamp
    if (imported > 0) {
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
    console.error(`Erro sync messages:`, err);
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
