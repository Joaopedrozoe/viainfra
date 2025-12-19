import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = 'VIAINFRAOFICIAL';

    console.log('='.repeat(60));
    console.log('🔍 BUSCANDO MENSAGENS DE TODOS OS FLAVIOS');
    console.log('='.repeat(60));

    const results: any = {
      chats: [],
      messages_by_chat: {}
    };

    // JIDs para testar
    const jidsToTest = [
      { name: 'Phone JID', jid: '5511996793645@s.whatsapp.net' },
      { name: 'LID Flávio', jid: '37486625607885@lid' },
      { name: 'Chat ID 1', jid: 'cmja3u2m53zt6o64i0vgqmb3n' },
      { name: 'Chat ID 2', jid: 'cmja77lvt41djo64ib7xf53aq' }
    ];

    for (const { name, jid } of jidsToTest) {
      console.log(`\n📡 Buscando: ${name} (${jid})`);
      
      try {
        const res = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            where: { key: { remoteJid: jid } }, 
            limit: 100 
          })
        });
        
        const data = await res.json();
        const msgs = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
        console.log(`  Mensagens: ${msgs.length}`);
        
        if (msgs.length > 0) {
          // Ordenar por timestamp
          msgs.sort((a: any, b: any) => 
            (Number(a.messageTimestamp) || 0) - (Number(b.messageTimestamp) || 0)
          );
          
          results.messages_by_chat[name] = [];
          
          console.log('  Últimas 10 mensagens:');
          for (let i = Math.max(0, msgs.length - 10); i < msgs.length; i++) {
            const m = msgs[i];
            const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
            const dir = m.key?.fromMe ? '→' : '←';
            const msg = m.message || {};
            let txt = msg.conversation || msg.extendedTextMessage?.text || 
                      msg.imageMessage?.caption || msg.videoMessage?.caption ||
                      (msg.imageMessage ? '[Imagem]' : '') ||
                      (msg.audioMessage ? '[Áudio]' : '') ||
                      (msg.documentMessage ? `[Doc: ${msg.documentMessage.fileName}]` : '') ||
                      '[outro]';
            
            console.log(`    ${ts} ${dir}: ${txt.slice(0, 60)}`);
            
            results.messages_by_chat[name].push({
              timestamp: ts,
              direction: dir,
              content: txt.slice(0, 100),
              id: m.key?.id
            });
          }
        }
      } catch (e: any) {
        console.log(`  Error: ${e.message}`);
      }
    }

    // Buscar chats para encontrar Flavio DP
    console.log('\n📡 Buscando chat "Flavio DP"');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const chats = await res.json();
      
      if (Array.isArray(chats)) {
        for (const chat of chats) {
          const name = (chat.name || chat.pushName || '').toLowerCase();
          
          if (name.includes('flavio') || name.includes('flávio')) {
            console.log(`  ✅ ${chat.pushName || chat.name}`);
            console.log(`     jid: ${chat.remoteJid}`);
            console.log(`     id: ${chat.id}`);
            
            results.chats.push({
              name: chat.pushName || chat.name,
              remoteJid: chat.remoteJid,
              id: chat.id
            });
          }
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      results
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
