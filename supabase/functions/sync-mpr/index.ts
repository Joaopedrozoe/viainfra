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

    console.log(`🔄 SYNC v2 - ${remoteJid}`);
    console.log(`API: ${evolutionApiUrl}`);

    // Fetch messages
    const url = `${evolutionApiUrl}/chat/findMessages/${instanceName}`;
    console.log(`Calling: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'apikey': evolutionApiKey!, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        where: { key: { remoteJid } }, 
        limit: 200
      })
    });

    console.log(`Status: ${response.status}`);
    
    const rawData = await response.text();
    console.log(`Raw response (first 500 chars): ${rawData.slice(0, 500)}`);
    
    const data = JSON.parse(rawData);
    const messages = data?.messages?.records || data?.messages || (Array.isArray(data) ? data : []);
    
    console.log(`Messages from API: ${messages.length}`);

    // Get existing
    const { data: existing } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingIds = new Set(
      (existing || []).map(m => m.metadata?.external_id).filter(Boolean)
    );
    console.log(`Existing in DB: ${existing?.length}`);

    // Sort by timestamp desc
    messages.sort((a: any, b: any) => 
      (Number(b.messageTimestamp) || 0) - (Number(a.messageTimestamp) || 0)
    );

    // Log newest 5
    console.log(`\nNewest 5 from API:`);
    for (let i = 0; i < Math.min(5, messages.length); i++) {
      const m = messages[i];
      const ts = new Date(Number(m.messageTimestamp) * 1000).toISOString();
      const dir = m.key?.fromMe ? '→' : '←';
      const msg = m.message || {};
      const txt = msg.conversation || msg.extendedTextMessage?.text || 
                  (msg.audioMessage ? `[Audio ${msg.audioMessage.seconds}s]` : '[media]');
      console.log(`  ${i+1}. ${ts} ${dir} ${txt.slice(0,40)}`);
    }

    // Import new
    let imported = 0;
    for (const m of messages) {
      const id = m.key?.id;
      if (!id || existingIds.has(id)) continue;

      const msg = m.message || {};
      let content = msg.conversation || msg.extendedTextMessage?.text;
      if (!content) {
        if (msg.audioMessage) content = `[Áudio ${msg.audioMessage.seconds || 0}s]`;
        else if (msg.imageMessage) content = msg.imageMessage.caption || '[Imagem]';
        else if (msg.documentMessage) content = `[Documento] ${msg.documentMessage.fileName || ''}`;
        else continue;
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_type: m.key?.fromMe ? 'agent' : 'user',
        content,
        created_at: new Date(Number(m.messageTimestamp) * 1000).toISOString(),
        metadata: { external_id: id, fromMe: m.key?.fromMe, instanceName }
      });

      if (!error) {
        imported++;
        console.log(`✅ ${content.slice(0,30)}`);
      }
    }

    // Update conversation timestamp
    if (messages.length > 0) {
      const newest = Math.max(...messages.map((m: any) => Number(m.messageTimestamp) || 0));
      await supabase.from('conversations')
        .update({ updated_at: new Date(newest * 1000).toISOString() })
        .eq('id', conversationId);
    }

    console.log(`\n✅ Imported: ${imported}`);

    return new Response(JSON.stringify({
      success: true,
      apiMessages: messages.length,
      dbMessages: existing?.length,
      imported
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
