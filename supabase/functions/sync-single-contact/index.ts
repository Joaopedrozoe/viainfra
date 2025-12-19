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

    const body = await req.json().catch(() => ({}));
    const phone = body.phone || '5511975696283';
    const targetJid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;

    console.log(`\n🔄 SYNC SINGLE CONTACT: ${phone}`);
    console.log(`   Target JID: ${targetJid}`);

    // Method 1: Try /messages/fetch/{instance} - gets ALL messages
    console.log(`\n📡 Method 1: /messages/fetch/${INSTANCE_NAME}`);
    let allMessages: any[] = [];
    
    try {
      const fetchResponse = await fetch(`${evolutionApiUrl}/messages/fetch/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: { 'apikey': evolutionApiKey! }
      });
      
      console.log(`   Status: ${fetchResponse.status}`);
      
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        allMessages = Array.isArray(data) ? data : (data?.messages || data?.data || []);
        console.log(`   Total messages: ${allMessages.length}`);
      }
    } catch (err: any) {
      console.log(`   Error: ${err.message}`);
    }

    // Method 2: Try /chat/fetchMessages/{instance}
    if (allMessages.length === 0) {
      console.log(`\n📡 Method 2: /chat/fetchMessages/${INSTANCE_NAME}`);
      try {
        const fetchResponse = await fetch(`${evolutionApiUrl}/chat/fetchMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 1000 })
        });
        
        console.log(`   Status: ${fetchResponse.status}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          allMessages = Array.isArray(data) ? data : (data?.messages?.records || data?.messages || data?.data || []);
          console.log(`   Total messages: ${allMessages.length}`);
        }
      } catch (err: any) {
        console.log(`   Error: ${err.message}`);
      }
    }

    // Method 3: Try without filtering on findMessages
    if (allMessages.length === 0) {
      console.log(`\n📡 Method 3: /chat/findMessages without filter`);
      try {
        const fetchResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 1000 })
        });
        
        console.log(`   Status: ${fetchResponse.status}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          allMessages = Array.isArray(data) ? data : (data?.messages?.records || data?.messages || data?.data || []);
          console.log(`   Total messages: ${allMessages.length}`);
        }
      } catch (err: any) {
        console.log(`   Error: ${err.message}`);
      }
    }

    // Filter messages for target JID locally
    console.log(`\n🔍 Filtering for ${targetJid}...`);
    const filteredMessages = allMessages.filter((msg: any) => {
      const msgJid = msg.key?.remoteJid?.toLowerCase();
      return msgJid === targetJid.toLowerCase();
    });

    console.log(`   Found ${filteredMessages.length} messages for this contact`);

    // Sort by timestamp
    const sortedMessages = filteredMessages.sort((a: any, b: any) => {
      const tsA = Number(a.messageTimestamp || 0);
      const tsB = Number(b.messageTimestamp || 0);
      return tsB - tsA;
    });

    // Log latest messages
    console.log(`\n📋 Latest messages:`);
    for (let i = 0; i < Math.min(5, sortedMessages.length); i++) {
      const msg = sortedMessages[i];
      const ts = msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000).toISOString() : '?';
      const content = extractContent(msg);
      const fromMe = msg.key?.fromMe ? '→' : '←';
      console.log(`   ${i + 1}. ${ts} ${fromMe} ${content.slice(0, 50)}`);
    }

    // Find conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, metadata')
      .or(`metadata->>remoteJid.eq.${targetJid}`)
      .maybeSingle();

    let conversationId = conversation?.id;

    if (!conversationId) {
      // Try by phone
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone', phone.replace(/\D/g, ''))
        .maybeSingle();

      if (contact) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('contact_id', contact.id)
          .maybeSingle();
        conversationId = conv?.id;
      }
    }

    if (!conversationId) {
      return new Response(JSON.stringify({
        error: 'Conversation not found',
        phone,
        targetJid,
        messagesFound: sortedMessages.length
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`\n💾 Syncing to conversation: ${conversationId}`);

    // Get existing messages
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('id, metadata, created_at')
      .eq('conversation_id', conversationId);

    const existingIds = new Set<string>();
    (existingMsgs || []).forEach(m => {
      if (m.metadata?.messageId) existingIds.add(m.metadata.messageId);
      if (m.metadata?.key?.id) existingIds.add(m.metadata.key.id);
    });

    console.log(`   Existing messages: ${existingMsgs?.length || 0}`);

    // Insert new messages
    let inserted = 0;
    for (const msg of sortedMessages) {
      const messageId = msg.key?.id || msg.id;
      
      if (existingIds.has(messageId)) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: msg.key?.fromMe ? 'agent' : 'user',
          content,
          created_at: timestamp,
          metadata: {
            messageId,
            key: msg.key,
            source: 'sync-single-contact'
          }
        });

      if (!error) {
        inserted++;
        console.log(`   ✅ Inserted: ${timestamp} - ${content.slice(0, 30)}`);
      }
    }

    // Update conversation timestamp
    if (inserted > 0) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    console.log(`\n✅ SYNC COMPLETE: ${inserted} new messages inserted`);

    return new Response(JSON.stringify({
      success: true,
      phone,
      conversationId,
      totalFromApi: allMessages.length,
      filteredForContact: sortedMessages.length,
      existingInDb: existingMsgs?.length || 0,
      newInserted: inserted
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractContent(msg: any): string {
  if (!msg?.message) return '';
  const m = msg.message;
  
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `[Imagem] ${m.imageMessage.caption}`;
  if (m.imageMessage) return '[Imagem]';
  if (m.videoMessage?.caption) return `[Vídeo] ${m.videoMessage.caption}`;
  if (m.videoMessage) return '[Vídeo]';
  if (m.audioMessage) return '[Áudio]';
  if (m.documentMessage?.fileName) return `[Documento: ${m.documentMessage.fileName}]`;
  if (m.documentMessage) return '[Documento]';
  if (m.stickerMessage) return '[Sticker]';
  if (m.contactMessage) return '[Contato]';
  if (m.locationMessage) return '[Localização]';
  
  return '';
}
