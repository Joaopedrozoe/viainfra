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
    
    // Via Logistic
    const phoneJid = '5511918752320@s.whatsapp.net';
    const conversationId = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a';
    const contactId = '37c3e917-d9f3-416d-8a75-0fc2b52bec19';

    console.log('='.repeat(60));
    console.log('🔍 SYNC VIA LOGISTIC');
    console.log('='.repeat(60));
    console.log(`Phone JID: ${phoneJid}`);
    console.log(`Conversation ID: ${conversationId}`);

    const results: any = {
      endpoints_tested: [],
      unique_messages: new Map()
    };

    // MÉTODO 1: findMessages com phone JID
    console.log('\n📡 MÉTODO 1: findMessages');
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
      results.endpoints_tested.push({ method: 'findMessages', count: msgs.length });
      
      for (const m of msgs) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // MÉTODO 2: fetchMessages
    console.log('\n📡 MÉTODO 2: fetchMessages');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/fetchMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: phoneJid,
          count: 500
        })
      });
      const data = await res.json();
      const msgs = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
      console.log(`  Status: ${res.status}, Messages: ${msgs.length}`);
      results.endpoints_tested.push({ method: 'fetchMessages', count: msgs.length });
      
      for (const m of msgs) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // MÉTODO 3: Buscar LID associado
    console.log('\n📡 MÉTODO 3: Buscar chats para encontrar LID');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const chats = await res.json();
      
      if (Array.isArray(chats)) {
        const viaLogisticChat = chats.find((c: any) => 
          c.remoteJid === phoneJid || 
          c.id === phoneJid ||
          c.name?.toLowerCase().includes('via log') ||
          c.pushName?.toLowerCase().includes('via log')
        );
        
        if (viaLogisticChat) {
          console.log(`  Found chat:`, JSON.stringify(viaLogisticChat).slice(0, 400));
          results.chatInfo = viaLogisticChat;
          
          // Se encontrar um LID diferente, buscar mensagens também
          if (viaLogisticChat.remoteJid && viaLogisticChat.remoteJid !== phoneJid) {
            const lidRes = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
              method: 'POST',
              headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                where: { key: { remoteJid: viaLogisticChat.remoteJid } }, 
                limit: 500 
              })
            });
            const lidData = await lidRes.json();
            const lidMsgs = lidData?.messages?.records || lidData?.messages || [];
            console.log(`  LID Messages: ${lidMsgs.length}`);
            
            for (const m of lidMsgs) {
              const id = m.key?.id;
              if (id && !results.unique_messages.has(id)) {
                results.unique_messages.set(id, m);
              }
            }
          }
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // Processar mensagens
    const allMessages = Array.from(results.unique_messages.values());
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL MENSAGENS ENCONTRADAS: ${allMessages.length}`);
    console.log('='.repeat(60));

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
      console.log(`${i+1}. ${ts} ${dir}: ${txt.slice(0, 50)}`);
    }

    console.log('\n📝 ÚLTIMAS 5 MENSAGENS:');
    for (let i = Math.max(0, allMessages.length - 5); i < allMessages.length; i++) {
      const m = allMessages[i];
      const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
      const dir = m.key?.fromMe ? '→' : '←';
      const msg = m.message || {};
      let txt = msg.conversation || msg.extendedTextMessage?.text || '[mídia]';
      console.log(`${i+1}. ${ts} ${dir}: ${txt.slice(0, 50)}`);
    }

    // Verificar existentes
    const { data: existing } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingIds = new Set(
      (existing || []).map(m => m.metadata?.external_id || m.metadata?.messageId).filter(Boolean)
    );
    console.log(`\n📦 Mensagens já no banco: ${existing?.length || 0}`);

    // Importar novas
    let imported = 0;
    for (const m of allMessages) {
      const id = m.key?.id;
      if (!id || existingIds.has(id)) continue;

      const msg = m.message || {};
      let content = msg.conversation || msg.extendedTextMessage?.text;
      if (!content) {
        if (msg.audioMessage) content = `[Áudio ${msg.audioMessage.seconds || 0}s]`;
        else if (msg.imageMessage) content = msg.imageMessage.caption || '[Imagem]';
        else if (msg.videoMessage) content = msg.videoMessage.caption || '[Vídeo]';
        else if (msg.documentMessage) content = `[Documento] ${msg.documentMessage.fileName || ''}`;
        else if (msg.contactMessage) content = `👤 Contato: ${msg.contactMessage.displayName || ''}`;
        else if (msg.contactsArrayMessage) content = `👥 ${msg.contactsArrayMessage.contacts?.length || 0} contatos`;
        else continue;
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: m.key?.fromMe ? 'agent' : 'user',
        content,
        created_at: new Date(Number(m.messageTimestamp) * 1000).toISOString(),
        metadata: { 
          external_id: id, 
          fromMe: m.key?.fromMe, 
          instanceName,
          remoteJid: m.key?.remoteJid
        }
      });

      if (!error) {
        imported++;
        console.log(`✅ ${content.slice(0, 40)}`);
      }
    }

    console.log(`\n🎉 IMPORTADAS: ${imported} novas mensagens`);

    return new Response(JSON.stringify({
      success: true,
      endpoints_tested: results.endpoints_tested,
      total_unique: allMessages.length,
      already_in_db: existing?.length || 0,
      imported,
      chatInfo: results.chatInfo
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
