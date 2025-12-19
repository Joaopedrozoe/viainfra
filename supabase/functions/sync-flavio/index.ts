import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = 'VIAINFRAOFICIAL';
    
    // Flávio DP - dados atuais no banco (INVESTIGAÇÃO)
    const phoneJid = '5511996793645@s.whatsapp.net';
    const lidJid = 'cmja77lvt41djo64ib7xf53aq';
    const conversationId = 'c18a76fd-4a13-4436-aeb8-32ab004fc2d5';
    const contactId = 'dc95bdc9-70af-4192-81c1-645749a0d731';
    
    // Vamos procurar por TODOS os chats Flavio para entender o problema

    console.log('='.repeat(60));
    console.log('🔍 INVESTIGANDO FLÁVIO - +55 11 99679-3645');
    console.log('='.repeat(60));
    console.log(`Phone JID: ${phoneJid}`);
    console.log(`LID JID: ${lidJid}`);
    console.log(`Conversation ID: ${conversationId}`);

    const results: any = {
      endpoints_tested: [],
      unique_messages: new Map(),
      chats_found: []
    };

    // PASSO 1: Buscar todos os chats e encontrar o que corresponde ao Flávio
    console.log('\n📡 PASSO 1: Buscar todos os chats');
    let flavioChat: any = null;
    let allFlavioChats: any[] = [];
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const chats = await res.json();
      
      if (Array.isArray(chats)) {
        // Buscar TODOS os Flávios
        for (const chat of chats) {
          const name = (chat.name || chat.pushName || '').toLowerCase();
          const jid = chat.remoteJid || '';
          
          // Buscar qualquer variação de Flavio/Flávio
          if (name.includes('flávio') || name.includes('flavio') ||
              jid.includes('996793645')) {
            console.log(`  ✅ Chat: ${chat.pushName || chat.name}`);
            console.log(`     remoteJid: ${chat.remoteJid}`);
            console.log(`     id: ${chat.id}`);
            console.log(`     updatedAt: ${chat.updatedAt}`);
            
            allFlavioChats.push({
              name: chat.pushName || chat.name,
              remoteJid: chat.remoteJid,
              id: chat.id,
              updatedAt: chat.updatedAt
            });
            
            // Preferir "Flavio DP" se existir
            if ((chat.pushName || chat.name || '').toLowerCase().includes('dp')) {
              flavioChat = chat;
            } else if (!flavioChat) {
              flavioChat = chat;
            }
          }
        }
        
        results.chats_found = allFlavioChats;
        console.log(`  Total chats: ${chats.length}`);
        console.log(`  Chats Flavio/Flávio encontrados: ${allFlavioChats.length}`);
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // PASSO 2: Buscar mensagens pelo Phone JID
    console.log('\n📡 PASSO 2: Mensagens por Phone JID');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: phoneJid } }, 
          limit: 500 
        })
      });
      const data = await res.json();
      const msgs = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
      console.log(`  Status: ${res.status}, Messages: ${msgs.length}`);
      results.endpoints_tested.push({ method: 'findMessages-phone', count: msgs.length });
      
      for (const m of msgs) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, { ...m, source: 'phone' });
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // PASSO 3: Buscar mensagens pelo LID JID do banco
    console.log('\n📡 PASSO 3: Mensagens por LID JID do banco');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: lidJid } }, 
          limit: 500 
        })
      });
      const data = await res.json();
      const msgs = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
      console.log(`  Status: ${res.status}, Messages: ${msgs.length}`);
      results.endpoints_tested.push({ method: 'findMessages-lid', count: msgs.length });
      
      for (const m of msgs) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, { ...m, source: 'lid' });
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // PASSO 4: Se encontrou chat, buscar pelo remoteJid do chat
    if (flavioChat && flavioChat.remoteJid) {
      console.log(`\n📡 PASSO 4: Mensagens pelo remoteJid do chat: ${flavioChat.remoteJid}`);
      try {
        const res = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            where: { key: { remoteJid: flavioChat.remoteJid } }, 
            limit: 500 
          })
        });
        const data = await res.json();
        const msgs = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
        console.log(`  Status: ${res.status}, Messages: ${msgs.length}`);
        results.endpoints_tested.push({ method: 'findMessages-chat', count: msgs.length });
        
        for (const m of msgs) {
          const id = m.key?.id;
          if (id && !results.unique_messages.has(id)) {
            results.unique_messages.set(id, { ...m, source: 'chat' });
          }
        }
      } catch (e: any) {
        console.log(`  Error: ${e.message}`);
      }
    }

    // Processar mensagens
    const allMessages = Array.from(results.unique_messages.values());
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL MENSAGENS ÚNICAS ENCONTRADAS: ${allMessages.length}`);
    console.log('='.repeat(60));

    // Agrupar por fonte
    const bySource: any = {};
    for (const m of allMessages) {
      const src = m.source || 'unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    }
    console.log('Por fonte:', JSON.stringify(bySource));

    // Ordenar por timestamp
    allMessages.sort((a: any, b: any) => 
      (Number(a.messageTimestamp) || 0) - (Number(b.messageTimestamp) || 0)
    );

    // Mostrar primeiras e últimas mensagens
    console.log('\n📝 PRIMEIRAS 5 MENSAGENS:');
    for (let i = 0; i < Math.min(5, allMessages.length); i++) {
      const m = allMessages[i];
      const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
      const dir = m.key?.fromMe ? '→' : '←';
      const msg = m.message || {};
      let txt = msg.conversation || msg.extendedTextMessage?.text || '[mídia]';
      console.log(`${i+1}. ${ts} ${dir}: ${txt.slice(0, 50)} [${m.source}]`);
    }

    console.log('\n📝 ÚLTIMAS 5 MENSAGENS:');
    for (let i = Math.max(0, allMessages.length - 5); i < allMessages.length; i++) {
      const m = allMessages[i];
      const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
      const dir = m.key?.fromMe ? '→' : '←';
      const msg = m.message || {};
      let txt = msg.conversation || msg.extendedTextMessage?.text || '[mídia]';
      console.log(`${i+1}. ${ts} ${dir}: ${txt.slice(0, 50)} [${m.source}]`);
    }

    // Verificar existentes no banco
    const { data: existing } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingIds = new Set(
      (existing || []).map((m: any) => m.metadata?.external_id || m.metadata?.messageId).filter(Boolean)
    );
    console.log(`\n📦 Mensagens já no banco: ${existing?.length || 0}`);

    // Verificar se as mensagens no banco correspondem
    console.log('\n🔍 COMPARANDO COM BANCO:');
    const { data: dbMessages } = await supabase
      .from('messages')
      .select('content, created_at, sender_type, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (dbMessages && dbMessages.length > 0) {
      console.log('Mensagens no banco:');
      for (const m of dbMessages) {
        console.log(`  ${m.created_at} [${m.sender_type}]: ${(m.content || '').slice(0, 50)}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      contact: { 
        name: 'Flávio', 
        phone: '5511996793645',
        lidJid,
        conversationId
      },
      chats_found: results.chats_found,
      endpoints_tested: results.endpoints_tested,
      total_unique_messages: allMessages.length,
      messages_by_source: bySource,
      already_in_db: existing?.length || 0,
      db_messages: dbMessages?.map((m: any) => ({
        content: (m.content || '').slice(0, 50),
        created_at: m.created_at,
        sender_type: m.sender_type
      })),
      flavioChat: flavioChat ? {
        name: flavioChat.pushName || flavioChat.name,
        remoteJid: flavioChat.remoteJid,
        id: flavioChat.id
      } : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
