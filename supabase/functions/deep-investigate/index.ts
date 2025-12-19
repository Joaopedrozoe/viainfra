import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTANCE_NAME = 'VIAINFRAOFICIAL';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const remoteJid = '5511975696283@s.whatsapp.net';

    console.log(`\n🔍 DEEP INVESTIGATION - ${remoteJid}`);
    console.log(`API URL: ${evolutionApiUrl}`);

    const results: any = {};

    // 1. Fetch messages with different params
    console.log(`\n📥 1. Fetching with standard params...`);
    const r1 = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: { key: { remoteJid } }, limit: 100 })
    });
    const d1 = await r1.json();
    const msgs1 = Array.isArray(d1) ? d1 : (d1?.messages?.records || d1?.messages || []);
    console.log(`   Count: ${msgs1.length}`);
    results.standard = { count: msgs1.length, status: r1.status };

    // 2. Try with timestamp filter (get messages after a certain time)
    console.log(`\n📥 2. Fetching with timestamp filter...`);
    const afterTs = Math.floor(Date.now() / 1000) - 86400; // last 24h
    const r2 = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        where: { key: { remoteJid }, messageTimestamp: { $gte: afterTs } }, 
        limit: 100 
      })
    });
    const d2 = await r2.json();
    const msgs2 = Array.isArray(d2) ? d2 : (d2?.messages?.records || d2?.messages || []);
    console.log(`   Count: ${msgs2.length}`);
    results.withTimestamp = { count: msgs2.length, status: r2.status };

    // 3. Try to sync/fetch history from device
    console.log(`\n📥 3. Trying to sync from device...`);
    const syncEndpoints = [
      `/chat/syncMessages/${INSTANCE_NAME}`,
      `/chat/fetchMessages/${INSTANCE_NAME}`,
      `/message/findMany/${INSTANCE_NAME}`,
      `/chat/messages/${INSTANCE_NAME}`,
    ];
    
    for (const ep of syncEndpoints) {
      try {
        const r = await fetch(`${evolutionApiUrl}${ep}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ remoteJid, count: 100 })
        });
        console.log(`   ${ep}: ${r.status}`);
        if (r.ok) {
          const data = await r.json();
          const msgs = Array.isArray(data) ? data : (data?.messages || data?.data || []);
          console.log(`   Messages: ${msgs.length}`);
          results[ep] = { status: r.status, count: msgs.length };
        }
      } catch (e: any) {
        console.log(`   ${ep}: error - ${e.message}`);
      }
    }

    // 4. Get the raw response to see structure
    console.log(`\n📥 4. Raw API response structure...`);
    console.log(JSON.stringify(d1).slice(0, 1000));

    // 5. List all available messages sorted by timestamp
    console.log(`\n📥 5. All messages sorted by time (newest first):`);
    const allMsgs = msgs1.sort((a: any, b: any) => {
      return (Number(b.messageTimestamp) || 0) - (Number(a.messageTimestamp) || 0);
    });
    
    for (let i = 0; i < Math.min(10, allMsgs.length); i++) {
      const m = allMsgs[i];
      const ts = m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000).toISOString() : '?';
      const fromMe = m.key?.fromMe ? '➡️' : '⬅️';
      let content = '';
      if (m.message?.conversation) content = m.message.conversation;
      else if (m.message?.extendedTextMessage?.text) content = m.message.extendedTextMessage.text;
      else if (m.message?.audioMessage) content = '[AUDIO]';
      else if (m.message?.imageMessage) content = '[IMAGE]';
      else if (m.message?.documentMessage) content = '[DOC]';
      else content = JSON.stringify(m.message || {}).slice(0, 50);
      
      console.log(`   ${i+1}. ${ts} ${fromMe} ${content.slice(0, 50)}`);
    }

    // 6. Check instance connection state
    console.log(`\n📥 6. Instance connection state...`);
    const connResp = await fetch(`${evolutionApiUrl}/instance/connectionState/${INSTANCE_NAME}`, {
      headers: { 'apikey': evolutionApiKey! }
    });
    const connData = await connResp.json();
    console.log(`   State: ${JSON.stringify(connData)}`);
    results.connectionState = connData;

    // 7. Try to restart/refresh instance to force sync
    console.log(`\n📥 7. Checking instance info...`);
    const infoResp = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': evolutionApiKey! }
    });
    const instances = await infoResp.json();
    const ourInstance = Array.isArray(instances) 
      ? instances.find((i: any) => i.instanceName === INSTANCE_NAME || i.name === INSTANCE_NAME)
      : instances;
    console.log(`   Instance: ${JSON.stringify(ourInstance)?.slice(0, 300)}`);

    return new Response(JSON.stringify({
      success: true,
      remoteJid,
      totalMessagesFound: msgs1.length,
      newestMessage: allMsgs[0] ? {
        timestamp: new Date(Number(allMsgs[0].messageTimestamp) * 1000).toISOString(),
        fromMe: allMsgs[0].key?.fromMe,
        content: allMsgs[0].message?.conversation || allMsgs[0].message?.extendedTextMessage?.text || '[media]'
      } : null,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
