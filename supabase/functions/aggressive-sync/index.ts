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
    const targetPhone = body.phone || '5511975696283';
    const conversationId = body.conversationId;

    console.log(`\n🔥 AGGRESSIVE SYNC - ${targetPhone || conversationId}`);

    // Find conversation
    let conv;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('id, contact_id, metadata, contacts!inner(phone, name)')
        .eq('id', conversationId)
        .maybeSingle();
      conv = data;
    } else {
      // Try multiple phone formats
      const phoneClean = targetPhone.replace(/\D/g, '');
      const phoneLast8 = phoneClean.slice(-8);
      
      const { data } = await supabase
        .from('conversations')
        .select('id, contact_id, metadata, contacts!inner(phone, name)')
        .eq('channel', 'whatsapp')
        .or(`contacts.phone.eq.${phoneClean},contacts.phone.like.%${phoneLast8}%`)
        .limit(1)
        .maybeSingle();
      conv = data;
    }

    if (!conv) {
      console.log('❌ Conversation not found');
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const jid = conv.metadata?.remoteJid || `${targetPhone}@s.whatsapp.net`;
    console.log(`📍 Found conversation: ${conv.id}`);
    console.log(`📍 JID: ${jid}`);
    console.log(`📍 Contact: ${conv.contacts?.name}`);

    // Fetch ALL messages from Evolution API
    console.log(`\n📥 Fetching messages from Evolution API...`);
    
    const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: { key: { remoteJid: jid } },
        limit: 500
      })
    });

    if (!messagesResponse.ok) {
      const errText = await messagesResponse.text();
      console.error(`❌ Evolution API error: ${messagesResponse.status} - ${errText}`);
      return new Response(JSON.stringify({ error: 'Evolution API error', details: errText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messagesData = await messagesResponse.json();
    const messages = Array.isArray(messagesData) 
      ? messagesData 
      : (messagesData?.messages?.records || messagesData?.messages || messagesData?.data || []);

    console.log(`📊 Evolution API returned ${messages.length} messages`);

    // Log last 5 messages from API
    console.log(`\n📋 Last 5 messages from Evolution API:`);
    const sorted = [...messages].sort((a: any, b: any) => {
      const tsA = Number(a.messageTimestamp || 0);
      const tsB = Number(b.messageTimestamp || 0);
      return tsB - tsA;
    });

    for (let i = 0; i < Math.min(5, sorted.length); i++) {
      const msg = sorted[i];
      const ts = msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000).toISOString() : 'no timestamp';
      const content = extractContent(msg);
      const fromMe = msg.key?.fromMe ? '➡️ SENT' : '⬅️ RECEIVED';
      console.log(`   ${i + 1}. ${ts} ${fromMe}: ${content.slice(0, 50)}`);
    }

    // Get existing messages
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('metadata, created_at')
      .eq('conversation_id', conv.id);

    const existingIds = new Set(
      (existingMsgs || [])
        .map(m => m.metadata?.external_id || m.metadata?.message_id)
        .filter(Boolean)
    );

    console.log(`\n📊 Existing messages in DB: ${existingMsgs?.length || 0}`);

    // Find and insert missing messages
    let imported = 0;
    const newMessages = [];

    for (const msg of messages) {
      const msgId = msg.key?.id || msg.id;
      if (!msgId || existingIds.has(msgId)) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const fromMe = msg.key?.fromMe || false;
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      newMessages.push({
        conversation_id: conv.id,
        sender_type: fromMe ? 'agent' : 'user',
        content: content,
        created_at: timestamp,
        metadata: {
          external_id: msgId,
          fromMe: fromMe,
          pushName: msg.pushName,
          instanceName: INSTANCE_NAME,
          synced_aggressively: true
        }
      });
    }

    if (newMessages.length > 0) {
      console.log(`\n📥 Inserting ${newMessages.length} new messages...`);
      
      for (const msg of newMessages) {
        const { error } = await supabase.from('messages').insert(msg);
        if (!error) {
          imported++;
          console.log(`   ✅ ${msg.created_at}: ${msg.content.slice(0, 40)}...`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }

      // Update conversation timestamp
      const latestTs = newMessages
        .map(m => new Date(m.created_at).getTime())
        .reduce((a, b) => Math.max(a, b), 0);

      if (latestTs > 0) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date(latestTs).toISOString() })
          .eq('id', conv.id);
      }
    }

    console.log(`\n✅ SYNC COMPLETE: ${imported} new messages imported`);

    return new Response(JSON.stringify({
      success: true,
      phone: targetPhone,
      conversationId: conv.id,
      contactName: conv.contacts?.name,
      evolutionMessages: messages.length,
      existingMessages: existingMsgs?.length || 0,
      newMessagesImported: imported
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

function extractContent(msg: any): string {
  if (!msg?.message) return '';
  
  const m = msg.message;
  
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `[Imagem] ${m.imageMessage.caption}`;
  if (m.imageMessage) return '[Imagem]';
  if (m.videoMessage?.caption) return `[Vídeo] ${m.videoMessage.caption}`;
  if (m.videoMessage) return '[Vídeo]';
  if (m.audioMessage) return m.audioMessage.ptt ? '[Áudio]' : '[Arquivo de áudio]';
  if (m.documentMessage) return `[Documento] ${m.documentMessage.fileName || ''}`;
  if (m.stickerMessage) return '[Figurinha]';
  if (m.contactMessage) return `[Contato] ${m.contactMessage.displayName || ''}`;
  if (m.locationMessage) return '[Localização]';
  if (m.reactionMessage) return '';
  
  return '';
}
