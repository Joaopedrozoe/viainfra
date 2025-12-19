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
    const remoteJid = '5511975696283@s.whatsapp.net';

    console.log(`🔍 TESTING ALL EVOLUTION API ENDPOINTS`);
    console.log(`API: ${evolutionApiUrl}`);

    const results: any = {};

    // Test all possible endpoints to get messages
    const endpoints = [
      // Standard
      { name: 'findMessages', method: 'POST', path: `/chat/findMessages/${instanceName}`, body: { where: { key: { remoteJid } } } },
      // With limit variations
      { name: 'findMessages-limit500', method: 'POST', path: `/chat/findMessages/${instanceName}`, body: { where: { key: { remoteJid } }, limit: 500 } },
      { name: 'findMessages-noWhere', method: 'POST', path: `/chat/findMessages/${instanceName}`, body: { limit: 100 } },
      // Fetch from device
      { name: 'fetchFromDevice', method: 'POST', path: `/chat/fetchMessages/${instanceName}/${remoteJid}`, body: {} },
      // History
      { name: 'history', method: 'GET', path: `/chat/history/${instanceName}?remoteJid=${remoteJid}`, body: null },
      // Sync
      { name: 'syncMessages', method: 'POST', path: `/chat/syncMessages/${instanceName}`, body: { remoteJid } },
      // Read messages
      { name: 'readMessages', method: 'GET', path: `/chat/readMessages/${instanceName}/${remoteJid}`, body: null },
      // All messages
      { name: 'allMessages', method: 'POST', path: `/message/findAll/${instanceName}`, body: { where: { key: { remoteJid } } } },
    ];

    for (const ep of endpoints) {
      console.log(`\n📡 ${ep.name}: ${ep.method} ${ep.path}`);
      try {
        const opts: RequestInit = {
          method: ep.method,
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        };
        if (ep.body) opts.body = JSON.stringify(ep.body);
        
        const r = await fetch(`${evolutionApiUrl}${ep.path}`, opts);
        const status = r.status;
        
        let count = 0;
        let newest = null;
        
        if (r.ok) {
          const data = await r.json();
          const msgs = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
          count = msgs.length;
          
          if (count > 0) {
            msgs.sort((a: any, b: any) => (Number(b.messageTimestamp) || 0) - (Number(a.messageTimestamp) || 0));
            newest = {
              ts: new Date(Number(msgs[0].messageTimestamp) * 1000).toISOString(),
              content: msgs[0].message?.conversation || msgs[0].message?.extendedTextMessage?.text || '[media]'
            };
          }
        }
        
        console.log(`   Status: ${status}, Count: ${count}`);
        if (newest) console.log(`   Newest: ${newest.ts} - ${newest.content.slice(0,30)}`);
        
        results[ep.name] = { status, count, newest };
      } catch (e: any) {
        console.log(`   Error: ${e.message}`);
        results[ep.name] = { error: e.message };
      }
    }

    // Also check instance status
    console.log(`\n📊 Instance status:`);
    const statusResp = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionApiKey! }
    });
    const statusData = await statusResp.json();
    console.log(`   ${JSON.stringify(statusData)}`);
    results.instanceStatus = statusData;

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
