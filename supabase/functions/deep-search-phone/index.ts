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
    console.log('🔍 BUSCA PROFUNDA - NÚMERO 5511996793645');
    console.log('='.repeat(60));

    const results: any = {
      all_messages: [],
      search_methods: []
    };

    // Método 1: Buscar pelo phone JID
    console.log('\n📡 1. findMessages com phone JID');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: '5511996793645@s.whatsapp.net' } }, 
          limit: 500 
        })
      });
      const data = await res.json();
      const msgs = data?.messages?.records || data?.messages || [];
      console.log(`  Encontradas: ${msgs.length}`);
      results.search_methods.push({ method: 'phone-jid', count: msgs.length });
      
      for (const m of msgs) {
        results.all_messages.push({ ...m, source: 'phone' });
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // Método 2: fetchMessages
    console.log('\n📡 2. fetchMessages');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/fetchMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: '5511996793645',
          count: 500
        })
      });
      const data = await res.json();
      const msgs = data?.messages || [];
      console.log(`  Encontradas: ${msgs.length}`);
      results.search_methods.push({ method: 'fetchMessages', count: msgs.length });
      
      for (const m of msgs) {
        const exists = results.all_messages.some((x: any) => x.key?.id === m.key?.id);
        if (!exists) {
          results.all_messages.push({ ...m, source: 'fetch' });
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // Método 3: LID 37486625607885@lid
    console.log('\n📡 3. findMessages com LID');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: '37486625607885@lid' } }, 
          limit: 500 
        })
      });
      const data = await res.json();
      const msgs = data?.messages?.records || data?.messages || [];
      console.log(`  Encontradas: ${msgs.length}`);
      results.search_methods.push({ method: 'lid', count: msgs.length });
      
      for (const m of msgs) {
        const exists = results.all_messages.some((x: any) => x.key?.id === m.key?.id);
        if (!exists) {
          results.all_messages.push({ ...m, source: 'lid' });
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // Método 4: Número puro
    console.log('\n📡 4. findMessages número puro');
    try {
      const res = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: '5511996793645' } }, 
          limit: 500 
        })
      });
      const data = await res.json();
      const msgs = data?.messages?.records || data?.messages || [];
      console.log(`  Encontradas: ${msgs.length}`);
      results.search_methods.push({ method: 'number-pure', count: msgs.length });
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // Ordenar todas as mensagens
    results.all_messages.sort((a: any, b: any) => 
      (Number(a.messageTimestamp) || 0) - (Number(b.messageTimestamp) || 0)
    );

    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL MENSAGENS ÚNICAS: ${results.all_messages.length}`);
    console.log('='.repeat(60));

    // Mostrar TODAS as mensagens
    console.log('\n📝 TODAS AS MENSAGENS:');
    const formattedMessages = [];
    for (let i = 0; i < results.all_messages.length; i++) {
      const m = results.all_messages[i];
      const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
      const dir = m.key?.fromMe ? '→ ENVIADA' : '← RECEBIDA';
      const msg = m.message || {};
      let txt = msg.conversation || msg.extendedTextMessage?.text || 
                msg.imageMessage?.caption || msg.videoMessage?.caption ||
                (msg.imageMessage ? '[Imagem]' : '') ||
                (msg.audioMessage ? '[Áudio]' : '') ||
                (msg.documentMessage ? `[Doc: ${msg.documentMessage.fileName}]` : '') ||
                (msg.stickerMessage ? '[Sticker]' : '') ||
                '[outro]';
      
      console.log(`${i+1}. ${ts} ${dir}: ${txt.slice(0, 80)}`);
      
      formattedMessages.push({
        index: i + 1,
        timestamp: ts,
        direction: m.key?.fromMe ? 'sent' : 'received',
        content: txt,
        source: m.source,
        id: m.key?.id
      });
    }

    return new Response(JSON.stringify({
      success: true,
      phone: '5511996793645',
      total_messages: results.all_messages.length,
      search_methods: results.search_methods,
      messages: formattedMessages
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
