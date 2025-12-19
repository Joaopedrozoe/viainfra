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
    const remoteJid = '5511975696283@s.whatsapp.net';
    const conversationId = '6033f765-cb84-45ff-858c-ea51fc444529';

    console.log(`🔄 FORCE FULL SYNC`);
    console.log(`API: ${evolutionApiUrl}`);

    // 1. Restart instance to force refresh
    console.log(`\n1. Restarting instance...`);
    try {
      const restartResp = await fetch(`${evolutionApiUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionApiKey! }
      });
      console.log(`   Restart status: ${restartResp.status}`);
    } catch (e) {
      console.log(`   Restart failed, continuing...`);
    }

    // Wait for restart
    await new Promise(r => setTimeout(r, 3000));

    // 2. Fetch messages WITHOUT any filters
    console.log(`\n2. Fetching ALL messages for this JID...`);
    
    const messagesResp = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        where: { key: { remoteJid } }
      })
    });

    console.log(`   Status: ${messagesResp.status}`);
    const rawData = await messagesResp.text();
    console.log(`   Raw length: ${rawData.length}`);

    let messages: any[] = [];
    try {
      const data = JSON.parse(rawData);
      messages = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
    } catch (e) {
      console.log(`   Parse error: ${e}`);
    }

    console.log(`   Total messages: ${messages.length}`);

    // Sort by timestamp desc
    messages.sort((a: any, b: any) => 
      (Number(b.messageTimestamp) || 0) - (Number(a.messageTimestamp) || 0)
    );

    // Log ALL messages with timestamps
    console.log(`\n3. ALL messages from API (sorted by time):`);
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const ts = m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000).toISOString() : '?';
      const dir = m.key?.fromMe ? '→' : '←';
      const msg = m.message || {};
      let txt = msg.conversation || msg.extendedTextMessage?.text || 
                (msg.audioMessage ? `[Audio ${msg.audioMessage.seconds}s]` : 
                 msg.imageMessage ? '[Image]' : 
                 msg.documentMessage ? '[Doc]' : '[?]');
      console.log(`   ${i+1}. ${ts} ${dir} ${txt.slice(0,50)}`);
    }

    // 4. Get existing messages from DB
    const { data: existing } = await supabase
      .from('messages')
      .select('id, metadata, created_at, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    console.log(`\n4. Existing in DB: ${existing?.length}`);
    
    const existingIds = new Set(
      (existing || []).map(m => m.metadata?.external_id).filter(Boolean)
    );

    // 5. Find NEW messages not in DB
    const newMessages = messages.filter((m: any) => {
      const id = m.key?.id;
      return id && !existingIds.has(id);
    });

    console.log(`\n5. NEW messages to import: ${newMessages.length}`);
    
    // 6. Import new messages
    let imported = 0;
    for (const m of newMessages) {
      const msg = m.message || {};
      let content = msg.conversation || msg.extendedTextMessage?.text;
      if (!content) {
        if (msg.audioMessage) content = `[Áudio ${msg.audioMessage.seconds || 0}s]`;
        else if (msg.imageMessage) content = msg.imageMessage.caption || '[Imagem]';
        else if (msg.documentMessage) content = `[Documento] ${msg.documentMessage.fileName || ''}`;
        else continue;
      }

      const ts = m.messageTimestamp 
        ? new Date(Number(m.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: m.key?.fromMe ? 'agent' : 'user',
        content,
        created_at: ts,
        metadata: { 
          external_id: m.key?.id, 
          fromMe: m.key?.fromMe, 
          instanceName,
          full_sync: true 
        }
      });

      if (!error) {
        imported++;
        console.log(`   ✅ ${ts}: ${content.slice(0,40)}`);
      } else {
        console.log(`   ❌ ${error.message}`);
      }
    }

    // Update conversation timestamp
    if (messages.length > 0) {
      const newest = Math.max(...messages.map((m: any) => Number(m.messageTimestamp) || 0));
      if (newest > 0) {
        await supabase.from('conversations')
          .update({ updated_at: new Date(newest * 1000).toISOString() })
          .eq('id', conversationId);
      }
    }

    console.log(`\n✅ DONE: ${imported} imported`);

    return new Response(JSON.stringify({
      success: true,
      apiTotal: messages.length,
      dbTotal: existing?.length,
      newImported: imported,
      newestInApi: messages[0] ? {
        ts: new Date(Number(messages[0].messageTimestamp) * 1000).toISOString(),
        content: messages[0].message?.conversation || messages[0].message?.extendedTextMessage?.text || '[media]'
      } : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
