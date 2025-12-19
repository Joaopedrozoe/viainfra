import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTANCE_NAME = 'VIAINFRAOFICIAL';
const MESSAGE_LIMIT = 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API key missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`\n🚀 FORCE SYNC INBOX - ${INSTANCE_NAME}`);
    console.log(`========================================`);

    // Get company ID
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', INSTANCE_NAME)
      .single();

    if (!instance?.company_id) {
      return new Response(JSON.stringify({ error: 'Instance not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const companyId = instance.company_id;
    console.log(`📍 Company: ${companyId}`);

    const stats = {
      conversationsFixed: 0,
      messagesImported: 0,
      errors: [] as string[]
    };

    // STEP 1: Fix all conversations without instanceName
    console.log(`\n📋 STEP 1: Fixing conversations without instanceName...`);
    
    const { data: brokenConversations } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id')
      .eq('channel', 'whatsapp')
      .eq('company_id', companyId);

    for (const conv of brokenConversations || []) {
      const needsUpdate = !conv.metadata?.instanceName;
      if (needsUpdate) {
        const { error } = await supabase
          .from('conversations')
          .update({
            metadata: { ...conv.metadata, instanceName: INSTANCE_NAME },
            updated_at: new Date().toISOString()
          })
          .eq('id', conv.id);

        if (!error) {
          stats.conversationsFixed++;
          console.log(`   ✅ Fixed: ${conv.id}`);
        }
      }
    }

    console.log(`   📊 ${stats.conversationsFixed} conversations fixed`);

    // STEP 2: Get all chats from Evolution API
    console.log(`\n📋 STEP 2: Fetching all chats from Evolution API...`);
    
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      console.error(`Failed to fetch chats: ${chatsResponse.status}`);
      return new Response(JSON.stringify({ error: 'Failed to fetch chats from Evolution API' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const chatsData = await chatsResponse.json();
    const allChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || chatsData || []);
    console.log(`   📊 ${allChats.length} chats found in Evolution API`);

    // STEP 3: Build map of existing conversations
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select(`
        id, metadata, contact_id,
        contacts!conversations_contact_id_fkey(id, name, phone)
      `)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    const convByJid = new Map<string, any>();
    const convByPhone = new Map<string, any>();
    
    for (const conv of existingConvs || []) {
      const jid = conv.metadata?.remoteJid;
      if (jid) convByJid.set(jid, conv);
      
      const phone = conv.contacts?.phone;
      if (phone) {
        convByPhone.set(phone, conv);
        if (phone.startsWith('55')) convByPhone.set(phone.slice(2), conv);
        else convByPhone.set('55' + phone, conv);
      }
    }

    // STEP 4: Sync messages for each chat that's in our database
    console.log(`\n📋 STEP 3: Syncing messages for all conversations...`);
    
    for (const chat of allChats) {
      const jid = chat.remoteJid || chat.id || chat.jid;
      if (!jid || jid.includes('@lid') || jid.includes('@broadcast') || jid.startsWith('status@')) continue;
      
      const isGroup = jid.includes('@g.us');
      
      // For non-groups, extract phone
      let phone = '';
      if (!isGroup) {
        const phoneMatch = jid.match(/^(\d+)@/);
        if (!phoneMatch) continue;
        phone = phoneMatch[1];
        if (!phone.startsWith('55') && phone.length <= 11) phone = '55' + phone;
      }
      
      // Find existing conversation
      let existingConv = convByJid.get(jid) || (phone ? convByPhone.get(phone) : null);
      if (!existingConv) {
        console.log(`   ⏭️ No DB conversation for ${jid}`);
        continue;
      }

      const conversationId = existingConv.id;
      const contactName = existingConv.contacts?.name || phone;
      
      try {
        // Fetch messages from Evolution API - including from device history
        const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            where: { key: { remoteJid: jid } },
            limit: MESSAGE_LIMIT,
            page: 1
          })
        });

        if (!messagesResponse.ok) {
          console.log(`   ⚠️ Failed to fetch messages for ${contactName}: ${messagesResponse.status}`);
          continue;
        }

        const messagesData = await messagesResponse.json();
        const messages = Array.isArray(messagesData) 
          ? messagesData 
          : (messagesData?.messages?.records || messagesData?.messages || []);

        if (messages.length === 0) {
          console.log(`   ℹ️ No messages for ${contactName}`);
          continue;
        }

        // Get existing message IDs
        const { data: existingMsgs } = await supabase
          .from('messages')
          .select('metadata')
          .eq('conversation_id', conversationId);

        const existingIds = new Set(
          (existingMsgs || [])
            .map(m => m.metadata?.external_id || m.metadata?.message_id)
            .filter(Boolean)
        );

        // Filter new messages
        const newMessages = messages.filter((msg: any) => {
          const msgId = msg.key?.id || msg.id;
          return msgId && !existingIds.has(msgId);
        });

        if (newMessages.length === 0) {
          console.log(`   ✓ ${contactName} is up to date`);
          continue;
        }

        // Insert new messages
        let imported = 0;
        for (const msg of newMessages) {
          const msgId = msg.key?.id || msg.id;
          const fromMe = msg.key?.fromMe || false;
          const content = extractContent(msg);
          const timestamp = msg.messageTimestamp 
            ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
            : new Date().toISOString();

          if (!content) continue;

          const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: fromMe ? 'agent' : 'user',
            content: content,
            created_at: timestamp,
            metadata: {
              external_id: msgId,
              fromMe: fromMe,
              pushName: msg.pushName,
              instanceName: INSTANCE_NAME
            }
          });

          if (!error) {
            imported++;
          }
        }

        if (imported > 0) {
          stats.messagesImported += imported;
          console.log(`   ✅ ${contactName}: +${imported} mensagens`);
          
          // Update conversation timestamp
          const latestTimestamp = messages
            .map((m: any) => m.messageTimestamp ? Number(m.messageTimestamp) * 1000 : 0)
            .reduce((a: number, b: number) => Math.max(a, b), 0);
          
          if (latestTimestamp > 0) {
            await supabase
              .from('conversations')
              .update({ updated_at: new Date(latestTimestamp).toISOString() })
              .eq('id', conversationId);
          }
        }

      } catch (err: any) {
        console.error(`   ❌ Error syncing ${contactName}:`, err.message);
        stats.errors.push(`${contactName}: ${err.message}`);
      }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`\n========================================`);
    console.log(`🎉 SYNC COMPLETO em ${elapsed}s`);
    console.log(`   Conversas corrigidas: ${stats.conversationsFixed}`);
    console.log(`   Mensagens importadas: ${stats.messagesImported}`);
    console.log(`   Erros: ${stats.errors.length}`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({
      success: true,
      elapsed: `${elapsed}s`,
      stats
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
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
  if (m.audioMessage) return m.audioMessage.ptt ? '[Áudio]' : '[Arquivo de áudio]';
  if (m.documentMessage) return `[Documento] ${m.documentMessage.fileName || m.documentMessage.title || ''}`;
  if (m.stickerMessage) return '[Figurinha]';
  if (m.contactMessage) return `[Contato] ${m.contactMessage.displayName || ''}`;
  if (m.locationMessage) return '[Localização]';
  if (m.reactionMessage) return '';
  
  return '';
}
