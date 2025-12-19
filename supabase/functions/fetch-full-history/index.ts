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
    
    // Dados do Adão
    const phoneJid = '5511991480719@s.whatsapp.net';
    const lidJid = '200579720728694@lid';
    const conversationId = '5d80fd12-1c42-4871-82af-15064f27f486';

    console.log('='.repeat(60));
    console.log('🔍 FETCH FULL HISTORY - Adão');
    console.log('='.repeat(60));
    console.log(`Phone JID: ${phoneJid}`);
    console.log(`LID JID: ${lidJid}`);
    console.log(`Instance: ${instanceName}`);
    console.log(`API URL: ${evolutionApiUrl}`);

    const results: any = {
      endpoints_tested: [],
      total_messages_found: 0,
      unique_messages: new Map(),
      imported: 0
    };

    // ============================================
    // MÉTODO 1: findMessages com phone JID
    // ============================================
    console.log('\n📡 MÉTODO 1: findMessages com phone JID');
    try {
      const url1 = `${evolutionApiUrl}/chat/findMessages/${instanceName}`;
      const res1 = await fetch(url1, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: phoneJid } }, 
          limit: 500 
        })
      });
      const data1 = await res1.json();
      const msgs1 = data1?.messages?.records || data1?.messages || (Array.isArray(data1) ? data1 : []);
      console.log(`  Status: ${res1.status}, Messages: ${msgs1.length}`);
      results.endpoints_tested.push({ method: 'findMessages-phone', count: msgs1.length });
      
      for (const m of msgs1) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // MÉTODO 2: findMessages com LID JID
    // ============================================
    console.log('\n📡 MÉTODO 2: findMessages com LID JID');
    try {
      const url2 = `${evolutionApiUrl}/chat/findMessages/${instanceName}`;
      const res2 = await fetch(url2, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: lidJid } }, 
          limit: 500 
        })
      });
      const data2 = await res2.json();
      const msgs2 = data2?.messages?.records || data2?.messages || (Array.isArray(data2) ? data2 : []);
      console.log(`  Status: ${res2.status}, Messages: ${msgs2.length}`);
      results.endpoints_tested.push({ method: 'findMessages-lid', count: msgs2.length });
      
      for (const m of msgs2) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // MÉTODO 3: fetchMessages (força sync do WhatsApp)
    // ============================================
    console.log('\n📡 MÉTODO 3: fetchMessages (sync do WhatsApp)');
    try {
      const url3 = `${evolutionApiUrl}/chat/fetchMessages/${instanceName}`;
      const res3 = await fetch(url3, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: phoneJid,
          count: 500
        })
      });
      const data3 = await res3.json();
      const msgs3 = data3?.messages?.records || data3?.messages || (Array.isArray(data3) ? data3 : []);
      console.log(`  Status: ${res3.status}, Messages: ${msgs3.length}`);
      results.endpoints_tested.push({ method: 'fetchMessages-phone', count: msgs3.length });
      
      for (const m of msgs3) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // MÉTODO 4: fetchMessages com LID
    // ============================================
    console.log('\n📡 MÉTODO 4: fetchMessages com LID');
    try {
      const url4 = `${evolutionApiUrl}/chat/fetchMessages/${instanceName}`;
      const res4 = await fetch(url4, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: lidJid,
          count: 500
        })
      });
      const data4 = await res4.json();
      const msgs4 = data4?.messages?.records || data4?.messages || (Array.isArray(data4) ? data4 : []);
      console.log(`  Status: ${res4.status}, Messages: ${msgs4.length}`);
      results.endpoints_tested.push({ method: 'fetchMessages-lid', count: msgs4.length });
      
      for (const m of msgs4) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // MÉTODO 5: syncMessages (webhook sync)
    // ============================================
    console.log('\n📡 MÉTODO 5: syncMessages');
    try {
      const url5 = `${evolutionApiUrl}/chat/syncMessages/${instanceName}`;
      const res5 = await fetch(url5, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          remoteJid: phoneJid
        })
      });
      const data5 = await res5.json();
      console.log(`  Status: ${res5.status}, Response:`, JSON.stringify(data5).slice(0, 200));
      results.endpoints_tested.push({ method: 'syncMessages', response: res5.status });
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // MÉTODO 6: getMessages (endpoint alternativo)
    // ============================================
    console.log('\n📡 MÉTODO 6: getMessages');
    try {
      const url6 = `${evolutionApiUrl}/chat/getMessages/${instanceName}`;
      const res6 = await fetch(url6, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          remoteJid: phoneJid,
          limit: 500
        })
      });
      const data6 = await res6.json();
      const msgs6 = data6?.messages?.records || data6?.messages || (Array.isArray(data6) ? data6 : []);
      console.log(`  Status: ${res6.status}, Messages: ${msgs6.length}`);
      results.endpoints_tested.push({ method: 'getMessages', count: msgs6.length });
      
      for (const m of msgs6) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // MÉTODO 7: Buscar todos os chats e filtrar
    // ============================================
    console.log('\n📡 MÉTODO 7: Buscar todos os chats');
    try {
      const url7 = `${evolutionApiUrl}/chat/findChats/${instanceName}`;
      const res7 = await fetch(url7, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const chats = await res7.json();
      console.log(`  Status: ${res7.status}, Total chats: ${Array.isArray(chats) ? chats.length : 'N/A'}`);
      
      // Procurar chat do Adão
      if (Array.isArray(chats)) {
        const adaoChat = chats.find((c: any) => 
          c.remoteJid === phoneJid || 
          c.remoteJid === lidJid ||
          c.id === phoneJid ||
          c.id === lidJid ||
          c.name?.toLowerCase().includes('adao') ||
          c.name?.toLowerCase().includes('adão')
        );
        if (adaoChat) {
          console.log(`  Found Adão chat:`, JSON.stringify(adaoChat).slice(0, 300));
          results.adaoChat = adaoChat;
        } else {
          console.log(`  Adão chat not found in list`);
          // Listar primeiros 5 chats para debug
          console.log(`  First 5 chats:`, chats.slice(0, 5).map((c: any) => ({
            id: c.id || c.remoteJid,
            name: c.name || c.pushName
          })));
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // MÉTODO 8: Tentar com número limpo
    // ============================================
    console.log('\n📡 MÉTODO 8: fetchMessages com número limpo');
    try {
      const url8 = `${evolutionApiUrl}/chat/fetchMessages/${instanceName}`;
      const res8 = await fetch(url8, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: '5511991480719',
          count: 500
        })
      });
      const data8 = await res8.json();
      const msgs8 = data8?.messages?.records || data8?.messages || (Array.isArray(data8) ? data8 : []);
      console.log(`  Status: ${res8.status}, Messages: ${msgs8.length}`);
      results.endpoints_tested.push({ method: 'fetchMessages-clean', count: msgs8.length });
      
      for (const m of msgs8) {
        const id = m.key?.id;
        if (id && !results.unique_messages.has(id)) {
          results.unique_messages.set(id, m);
        }
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }

    // ============================================
    // Processar mensagens únicas encontradas
    // ============================================
    const allMessages = Array.from(results.unique_messages.values());
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL MENSAGENS ÚNICAS ENCONTRADAS: ${allMessages.length}`);
    console.log('='.repeat(60));

    // Ordenar por timestamp
    allMessages.sort((a: any, b: any) => 
      (Number(a.messageTimestamp) || 0) - (Number(b.messageTimestamp) || 0)
    );

    // Mostrar todas as mensagens encontradas
    console.log('\n📝 TODAS AS MENSAGENS:');
    for (let i = 0; i < allMessages.length; i++) {
      const m = allMessages[i];
      const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
      const dir = m.key?.fromMe ? '→ ENVIADA' : '← RECEBIDA';
      const msg = m.message || {};
      let txt = msg.conversation || msg.extendedTextMessage?.text || '';
      if (!txt) {
        if (msg.audioMessage) txt = `[Áudio ${msg.audioMessage.seconds || 0}s]`;
        else if (msg.imageMessage) txt = msg.imageMessage.caption || '[Imagem]';
        else if (msg.videoMessage) txt = msg.videoMessage.caption || '[Vídeo]';
        else if (msg.documentMessage) txt = `[Doc] ${msg.documentMessage.fileName || ''}`;
        else txt = '[Mídia]';
      }
      console.log(`${i+1}. ${ts} ${dir}: ${txt.slice(0, 60)}`);
    }

    // Verificar mensagens já existentes no banco
    const { data: existing } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingIds = new Set(
      (existing || []).map(m => m.metadata?.external_id).filter(Boolean)
    );
    console.log(`\n📦 Mensagens já no banco: ${existing?.length || 0}`);

    // Importar novas mensagens
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
        console.log(`✅ Importada: ${content.slice(0, 40)}`);
      } else {
        console.log(`❌ Erro ao importar: ${error.message}`);
      }
    }

    console.log(`\n🎉 IMPORTADAS: ${imported} novas mensagens`);

    return new Response(JSON.stringify({
      success: true,
      endpoints_tested: results.endpoints_tested,
      total_unique_messages: allMessages.length,
      already_in_db: existing?.length || 0,
      imported,
      messages_preview: allMessages.slice(0, 10).map((m: any) => ({
        timestamp: new Date(Number(m.messageTimestamp) * 1000).toISOString(),
        fromMe: m.key?.fromMe,
        content: (m.message?.conversation || m.message?.extendedTextMessage?.text || '[mídia]').slice(0, 50)
      }))
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
