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

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const stats = {
      step1_remoteJidFixed: 0,
      step2_contaminatedDeleted: 0,
      step3_conversationsProcessed: 0,
      step4_messagesImported: 0,
      step5_conversationsUpdated: 0,
      errors: [] as string[]
    };

    console.log('🚀 FULL INBOX SYNC - Starting complete synchronization');

    // Get company_id
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', INSTANCE_NAME)
      .single();

    if (!instance?.company_id) {
      throw new Error('Instance not found');
    }

    const companyId = instance.company_id;
    console.log(`📌 Company ID: ${companyId}`);

    // ============================================
    // STEP 1: Fix remoteJid for all conversations
    // ============================================
    console.log('\n📍 STEP 1: Fixing remoteJid for conversations missing it...');
    
    const { data: conversationsToFix } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    for (const conv of conversationsToFix || []) {
      const metadata = conv.metadata || {};
      
      // If missing remoteJid but has contact, get phone from contact
      if (!metadata.remoteJid && conv.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('phone, metadata')
          .eq('id', conv.contact_id)
          .single();

        if (contact) {
          // Try to get remoteJid from contact metadata first
          const contactRemoteJid = contact.metadata?.remoteJid;
          let remoteJid = contactRemoteJid;
          
          // If not in contact metadata, construct from phone
          if (!remoteJid && contact.phone) {
            const cleanPhone = contact.phone.replace(/\D/g, '');
            if (cleanPhone.length >= 10) {
              remoteJid = `${cleanPhone}@s.whatsapp.net`;
            }
          }

          if (remoteJid) {
            const { error } = await supabase
              .from('conversations')
              .update({
                metadata: {
                  ...metadata,
                  remoteJid,
                  instanceName: INSTANCE_NAME
                }
              })
              .eq('id', conv.id);

            if (!error) {
              stats.step1_remoteJidFixed++;
              console.log(`  ✅ Fixed conversation ${conv.id} with remoteJid: ${remoteJid}`);
            }
          }
        }
      }
      
      // Also ensure instanceName is set
      if (!metadata.instanceName && metadata.remoteJid) {
        await supabase
          .from('conversations')
          .update({
            metadata: {
              ...metadata,
              instanceName: INSTANCE_NAME
            }
          })
          .eq('id', conv.id);
      }
    }

    console.log(`  📊 Step 1 complete: ${stats.step1_remoteJidFixed} conversations fixed`);

    // ============================================
    // STEP 2: Clean contaminated messages
    // ============================================
    console.log('\n🧹 STEP 2: Cleaning contaminated messages...');

    // Find conversations where messages don't match the conversation's remoteJid
    const { data: allConversations } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    for (const conv of allConversations || []) {
      const convRemoteJid = conv.metadata?.remoteJid;
      if (!convRemoteJid) continue;
      
      // Extract phone from conversation's remoteJid
      const convPhone = convRemoteJid.split('@')[0];

      // Get all messages with external_id (imported messages)
      const { data: messages } = await supabase
        .from('messages')
        .select('id, metadata')
        .eq('conversation_id', conv.id)
        .not('metadata->external_id', 'is', null);

      for (const msg of messages || []) {
        const msgRemoteJid = msg.metadata?.remoteJid || msg.metadata?.from || msg.metadata?.to;
        if (!msgRemoteJid) continue;
        
        const msgPhone = msgRemoteJid.split('@')[0];
        
        // If message phone doesn't match conversation phone - it's contaminated
        if (msgPhone !== convPhone && !msgRemoteJid.includes(convPhone)) {
          const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', msg.id);

          if (!error) {
            stats.step2_contaminatedDeleted++;
            console.log(`  🗑️ Deleted contaminated message ${msg.id} (msg: ${msgPhone}, conv: ${convPhone})`);
          }
        }
      }
    }

    console.log(`  📊 Step 2 complete: ${stats.step2_contaminatedDeleted} contaminated messages deleted`);

    // ============================================
    // STEP 3: Build map of DB conversations by remoteJid
    // ============================================
    console.log('\n📍 STEP 3: Building conversation map...');
    
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    // Map by remoteJid and by phone number
    const convByJid = new Map<string, any>();
    const convByPhone = new Map<string, any>();
    
    for (const conv of existingConvs || []) {
      if (conv.metadata?.remoteJid) {
        const jid = conv.metadata.remoteJid;
        convByJid.set(jid, conv);
        
        // Also map by phone for flexibility
        const phone = jid.split('@')[0];
        if (phone) {
          convByPhone.set(phone, conv);
        }
      }
    }
    
    console.log(`  📊 Mapped ${convByJid.size} conversations by remoteJid`);

    // ============================================
    // STEP 4: Fetch messages directly from Evolution API for each DB conversation
    // ============================================
    console.log('\n🔄 STEP 4: Syncing messages for each conversation...');

    for (const [jid, conv] of convByJid.entries()) {
      // Skip groups for now
      if (jid.includes('@g.us')) continue;
      
      stats.step3_conversationsProcessed++;

      try {
        console.log(`  📱 Processing ${jid}...`);
        
        // Fetch messages from Evolution API
        const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            where: { key: { remoteJid: jid } },
            limit: 200
          })
        });

        if (!messagesResponse.ok) {
          console.log(`  ⚠️ Failed to fetch messages for ${jid}: ${messagesResponse.status}`);
          continue;
        }

        const apiData = await messagesResponse.json();
        
        // Handle different response formats
        let messageList: any[] = [];
        if (Array.isArray(apiData)) {
          messageList = apiData;
        } else if (apiData.messages?.records) {
          messageList = apiData.messages.records;
        } else if (apiData.messages && Array.isArray(apiData.messages)) {
          messageList = apiData.messages;
        }

        if (messageList.length === 0) {
          console.log(`  ⏭️ No messages from API for ${jid}`);
          continue;
        }

        console.log(`  📩 Got ${messageList.length} messages from API`);

        // Get existing message external_ids
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('metadata')
          .eq('conversation_id', conv.id);

        const existingIds = new Set<string>();
        for (const msg of existingMessages || []) {
          if (msg.metadata?.external_id) existingIds.add(msg.metadata.external_id);
          if (msg.metadata?.message_id) existingIds.add(msg.metadata.message_id);
        }

        // Import new messages
        const newMessages = [];
        let latestTimestamp = 0;

        for (const apiMsg of messageList) {
          const key = apiMsg.key || {};
          const messageId = key.id || apiMsg.id || apiMsg.messageId;
          
          if (!messageId || existingIds.has(messageId)) continue;

          const content = extractContent(apiMsg);
          if (!content) continue;

          // Parse timestamp
          let timestamp: string;
          if (apiMsg.messageTimestamp) {
            const ts = Number(apiMsg.messageTimestamp);
            // If timestamp is in seconds, convert to milliseconds
            const timestampMs = ts > 1e12 ? ts : ts * 1000;
            timestamp = new Date(timestampMs).toISOString();
            if (ts > latestTimestamp) latestTimestamp = ts;
          } else {
            timestamp = new Date().toISOString();
          }

          newMessages.push({
            conversation_id: conv.id,
            sender_type: key.fromMe ? 'agent' : 'user',
            content,
            created_at: timestamp,
            metadata: {
              external_id: messageId,
              message_id: messageId,
              remoteJid: jid,
              fromMe: key.fromMe || false,
              instanceName: INSTANCE_NAME
            }
          });

          existingIds.add(messageId);
        }

        if (newMessages.length > 0) {
          console.log(`  📤 Inserting ${newMessages.length} new messages...`);
          
          const { error } = await supabase
            .from('messages')
            .insert(newMessages);

          if (!error) {
            stats.step4_messagesImported += newMessages.length;
            console.log(`  ✅ Imported ${newMessages.length} messages for ${jid}`);

            // Update conversation timestamp
            if (latestTimestamp > 0) {
              const timestampMs = latestTimestamp > 1e12 ? latestTimestamp : latestTimestamp * 1000;
              await supabase
                .from('conversations')
                .update({ updated_at: new Date(timestampMs).toISOString() })
                .eq('id', conv.id);
              stats.step5_conversationsUpdated++;
            }
          } else {
            stats.errors.push(`Insert error for ${jid}: ${error.message}`);
            console.log(`  ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`  ⏭️ No new messages for ${jid}`);
        }

      } catch (err: any) {
        stats.errors.push(`Error processing ${jid}: ${err.message}`);
        console.log(`  ❌ Error: ${err.message}`);
      }
    }

    console.log(`\n📊 STEP 4 complete: ${stats.step4_messagesImported} messages imported`);

    // ============================================
    // STEP 5: Update all conversation timestamps
    // ============================================
    console.log('\n⏰ STEP 5: Updating conversation timestamps...');

    for (const [_, conv] of convByJid.entries()) {
      const { data: latestMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestMsg) {
        await supabase
          .from('conversations')
          .update({ updated_at: latestMsg.created_at })
          .eq('id', conv.id);
      }
    }

    console.log(`  📊 Step 5 complete`);

    // Final summary
    console.log('\n🎉 FULL INBOX SYNC COMPLETE');
    console.log('============================');
    console.log(`Step 1 - remoteJid fixed: ${stats.step1_remoteJidFixed}`);
    console.log(`Step 2 - Contaminated deleted: ${stats.step2_contaminatedDeleted}`);
    console.log(`Step 3 - Conversations processed: ${stats.step3_conversationsProcessed}`);
    console.log(`Step 4 - Messages imported: ${stats.step4_messagesImported}`);
    console.log(`Step 5 - Timestamps updated: ${stats.step5_conversationsUpdated}`);
    console.log(`Errors: ${stats.errors.length}`);
    if (stats.errors.length > 0) {
      console.log(`Error details: ${JSON.stringify(stats.errors)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      stats
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractContent(msg: any): string {
  const message = msg.message || msg;
  
  if (typeof message === 'string') return message;
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption || '[Imagem]';
  if (message.imageMessage) return '[Imagem]';
  if (message.videoMessage?.caption) return message.videoMessage.caption || '[Vídeo]';
  if (message.videoMessage) return '[Vídeo]';
  if (message.audioMessage) return '[Áudio]';
  if (message.documentMessage?.fileName) return `[Documento: ${message.documentMessage.fileName}]`;
  if (message.documentMessage) return '[Documento]';
  if (message.stickerMessage) return '[Figurinha]';
  if (message.contactMessage) return '[Contato]';
  if (message.locationMessage) return '[Localização]';
  if (message.reactionMessage) return '';
  if (message.protocolMessage) return '';
  
  // Try to get any text content
  const text = msg.body || msg.text || msg.caption;
  if (text) return text;
  
  return '';
}
