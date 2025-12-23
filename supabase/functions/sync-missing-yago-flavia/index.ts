import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false;
    
    const instanceName = 'VIAINFRAOFICIAL';
    
    console.log('='.repeat(60));
    console.log('🔄 SYNC MISSING CONTACTS: Yago e Flávia Financeiro');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('='.repeat(60));

    // Targets based on image analysis
    const targets = [
      { 
        name: 'Yago M Sam',
        remoteJid: '5511991593841@s.whatsapp.net',
        conversationId: '61f82363-6d0b-496e-ba6d-8dc39b60a570'
      }
    ];

    const results = [];

    for (const target of targets) {
      console.log(`\n📍 Processing: ${target.name}`);
      
      // Fetch recent messages from Evolution API
      const messagesRes = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          where: { key: { remoteJid: target.remoteJid } },
          limit: 100
        })
      });

      const messagesData = await messagesRes.json();
      const evolutionMessages = messagesData?.messages?.records || messagesData?.messages || [];
      console.log(`  Evolution API messages: ${evolutionMessages.length}`);

      // Get messages from Supabase for this conversation
      const { data: dbMessages } = await supabase
        .from('messages')
        .select('id, content, created_at, metadata')
        .eq('conversation_id', target.conversationId)
        .order('created_at', { ascending: false })
        .limit(200);

      console.log(`  Supabase messages: ${dbMessages?.length || 0}`);

      // Get existing message IDs from metadata
      const existingMessageIds = new Set(
        (dbMessages || [])
          .filter((m: any) => m.metadata?.messageId)
          .map((m: any) => m.metadata.messageId)
      );

      // Find missing messages
      const missingMessages = evolutionMessages.filter((m: any) => {
        const msgId = m.key?.id;
        return msgId && !existingMessageIds.has(msgId);
      });

      console.log(`  Missing messages to import: ${missingMessages.length}`);

      // Sort by timestamp (oldest first)
      missingMessages.sort((a: any, b: any) => {
        const tsA = Number(a.messageTimestamp) || 0;
        const tsB = Number(b.messageTimestamp) || 0;
        return tsA - tsB;
      });

      const imported = [];
      const errors = [];

      if (!dryRun && missingMessages.length > 0) {
        for (const msg of missingMessages) {
          try {
            const timestamp = new Date(Number(msg.messageTimestamp) * 1000);
            const content = extractContent(msg.message);
            const senderType = msg.key?.fromMe ? 'agent' : 'user';

            if (!content) continue;

            const { data: newMsg, error } = await supabase
              .from('messages')
              .insert({
                conversation_id: target.conversationId,
                content: content,
                sender_type: senderType,
                created_at: timestamp.toISOString(),
                metadata: {
                  messageId: msg.key?.id,
                  remoteJid: msg.key?.remoteJid,
                  fromMe: msg.key?.fromMe,
                  pushName: msg.pushName,
                  importedAt: new Date().toISOString()
                }
              })
              .select()
              .single();

            if (error) {
              errors.push({ messageId: msg.key?.id, error: error.message });
            } else {
              imported.push({
                messageId: msg.key?.id,
                content: content.slice(0, 50),
                timestamp: timestamp.toISOString()
              });
            }
          } catch (e: any) {
            errors.push({ messageId: msg.key?.id, error: e.message });
          }
        }

        // Update conversation updated_at to match latest message
        if (imported.length > 0) {
          const latestTimestamp = imported[imported.length - 1].timestamp;
          await supabase
            .from('conversations')
            .update({ updated_at: latestTimestamp })
            .eq('id', target.conversationId);
          console.log(`  Updated conversation timestamp to: ${latestTimestamp}`);
        }
      }

      results.push({
        name: target.name,
        remoteJid: target.remoteJid,
        evolutionMessages: evolutionMessages.length,
        dbMessages: dbMessages?.length || 0,
        missingMessages: missingMessages.length,
        imported: imported.length,
        errors: errors.length,
        sampleMissing: missingMessages.slice(0, 5).map((m: any) => ({
          timestamp: new Date(Number(m.messageTimestamp) * 1000).toISOString(),
          content: extractContent(m.message)?.slice(0, 50),
          fromMe: m.key?.fromMe
        })),
        importedDetails: imported,
        errorDetails: errors
      });
    }

    // Now search for "Flávia Financeiro" - need to find her first
    console.log('\n🔍 Searching for Flávia Financeiro...');
    
    const chatsRes = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const allChats = await chatsRes.json();
    const flaviaChats = (Array.isArray(allChats) ? allChats : []).filter((c: any) => {
      const name = (c.name || c.pushName || '').toLowerCase();
      return name.includes('flavia') || name.includes('flávia') || name.includes('financeiro');
    });

    console.log(`Found ${flaviaChats.length} Flávia-related chats`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      results,
      flaviaChats: flaviaChats.map((c: any) => ({
        name: c.name || c.pushName,
        id: c.id,
        remoteJid: c.remoteJid,
        phone: (c.remoteJid || c.id)?.replace(/@.*/, ''),
        lastMessageAt: c.lastMessageAt
      }))
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractContent(message: any): string {
  if (!message) return '';
  
  return message.conversation || 
         message.extendedTextMessage?.text ||
         (message.imageMessage?.caption || (message.imageMessage ? '[📷 Imagem]' : '')) ||
         (message.videoMessage?.caption || (message.videoMessage ? '[🎥 Vídeo]' : '')) ||
         (message.audioMessage ? '[🎵 Áudio]' : '') ||
         (message.documentMessage ? `[📄 ${message.documentMessage.fileName || 'Documento'}]` : '') ||
         (message.stickerMessage ? '[Figurinha]' : '') ||
         (message.contactMessage ? `[👤 Contato: ${message.contactMessage.displayName}]` : '') ||
         (message.locationMessage ? '[📍 Localização]' : '') ||
         '';
}
