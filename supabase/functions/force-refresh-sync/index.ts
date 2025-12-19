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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const remoteJid = '5511975696283@s.whatsapp.net';

    console.log(`\n🔄 FORCE REFRESH - ${INSTANCE_NAME}`);

    // 1. Try to restart/reconnect instance to force sync
    console.log(`\n1. Attempting to refresh instance connection...`);
    
    // Try different restart endpoints
    const restartEndpoints = [
      { url: `/instance/restart/${INSTANCE_NAME}`, method: 'PUT' },
      { url: `/instance/refresh/${INSTANCE_NAME}`, method: 'POST' },
      { url: `/chat/updatePresence/${INSTANCE_NAME}`, method: 'PUT', body: { remoteJid } },
    ];

    for (const ep of restartEndpoints) {
      try {
        const r = await fetch(`${evolutionApiUrl}${ep.url}`, {
          method: ep.method,
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
          body: ep.body ? JSON.stringify(ep.body) : undefined
        });
        console.log(`   ${ep.url}: ${r.status}`);
        if (r.ok) {
          const data = await r.json().catch(() => ({}));
          console.log(`   Response: ${JSON.stringify(data).slice(0, 100)}`);
        }
      } catch (e: any) {
        console.log(`   ${ep.url}: error - ${e.message}`);
      }
    }

    // 2. Wait a moment for sync
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Now fetch messages again - try without pagination first
    console.log(`\n2. Fetching messages...`);
    
    const r = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        where: { key: { remoteJid } }, 
        limit: 500
      })
    });
    
    console.log(`   Response status: ${r.status}`);
    
    let allMessages: any[] = [];
    if (r.ok) {
      const data = await r.json();
      console.log(`   Response structure: ${Object.keys(data).join(', ')}`);
      allMessages = Array.isArray(data) ? data : (data?.messages?.records || data?.messages || []);
      console.log(`   Messages found: ${allMessages.length}`);
    } else {
      const errText = await r.text();
      console.log(`   Error: ${errText}`);
    }

    // Deduplicate by message ID
    const uniqueMessages = new Map();
    for (const msg of allMessages) {
      const id = msg.key?.id || msg.id;
      if (id && !uniqueMessages.has(id)) {
        uniqueMessages.set(id, msg);
      }
    }

    const messages = Array.from(uniqueMessages.values());
    console.log(`\n3. Total unique messages: ${messages.length}`);

    // Sort by timestamp
    messages.sort((a: any, b: any) => {
      return (Number(b.messageTimestamp) || 0) - (Number(a.messageTimestamp) || 0);
    });

    // Log newest 10
    console.log(`\n4. Newest 10 messages:`);
    for (let i = 0; i < Math.min(10, messages.length); i++) {
      const m = messages[i];
      const ts = m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000).toISOString() : '?';
      const fromMe = m.key?.fromMe ? '➡️ SENT' : '⬅️ RECV';
      let content = '';
      if (m.message?.conversation) content = m.message.conversation;
      else if (m.message?.extendedTextMessage?.text) content = m.message.extendedTextMessage.text;
      else if (m.message?.audioMessage) content = `[AUDIO ${m.message.audioMessage.seconds}s]`;
      else if (m.message?.imageMessage) content = '[IMAGE]';
      else if (m.message?.documentMessage) content = `[DOC: ${m.message.documentMessage.fileName}]`;
      else content = `[${Object.keys(m.message || {}).join(', ')}]`;
      
      console.log(`   ${i+1}. ${ts} ${fromMe} ${content.slice(0, 60)}`);
    }

    // 5. Now sync to database
    console.log(`\n5. Syncing to database...`);
    
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', '6033f765-cb84-45ff-858c-ea51fc444529');

    const existingIds = new Set(
      (existingMsgs || [])
        .map(m => m.metadata?.external_id || m.metadata?.message_id)
        .filter(Boolean)
    );

    let imported = 0;
    for (const msg of messages) {
      const msgId = msg.key?.id || msg.id;
      if (!msgId || existingIds.has(msgId)) continue;

      let content = '';
      const m = msg.message || {};
      if (m.conversation) content = m.conversation;
      else if (m.extendedTextMessage?.text) content = m.extendedTextMessage.text;
      else if (m.audioMessage) content = `[Áudio ${m.audioMessage.seconds || '?'}s]`;
      else if (m.imageMessage?.caption) content = `[Imagem] ${m.imageMessage.caption}`;
      else if (m.imageMessage) content = '[Imagem]';
      else if (m.documentMessage) content = `[Documento] ${m.documentMessage.fileName || ''}`;
      else continue;

      if (!content) continue;

      const fromMe = msg.key?.fromMe || false;
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      const { error } = await supabase.from('messages').insert({
        conversation_id: '6033f765-cb84-45ff-858c-ea51fc444529',
        sender_type: fromMe ? 'agent' : 'user',
        content: content,
        created_at: timestamp,
        metadata: {
          external_id: msgId,
          fromMe: fromMe,
          pushName: msg.pushName,
          instanceName: INSTANCE_NAME,
          force_synced: true
        }
      });

      if (!error) {
        imported++;
        console.log(`   ✅ Imported: ${timestamp} - ${content.slice(0, 40)}`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Update conversation timestamp
    if (imported > 0 && messages.length > 0) {
      const newestTs = Math.max(...messages.map((m: any) => Number(m.messageTimestamp) || 0));
      if (newestTs > 0) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date(newestTs * 1000).toISOString() })
          .eq('id', '6033f765-cb84-45ff-858c-ea51fc444529');
      }
    }

    console.log(`\n✅ COMPLETE: ${imported} new messages imported`);

    return new Response(JSON.stringify({
      success: true,
      totalFromApi: messages.length,
      existingInDb: existingMsgs?.length || 0,
      newImported: imported,
      newestMessage: messages[0] ? {
        timestamp: new Date(Number(messages[0].messageTimestamp) * 1000).toISOString(),
        fromMe: messages[0].key?.fromMe,
        content: messages[0].message?.conversation || messages[0].message?.extendedTextMessage?.text || '[media]'
      } : null
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
