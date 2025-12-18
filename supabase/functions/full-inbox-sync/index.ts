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
      apiChatsFound: 0,
      conversationsCreated: 0,
      contactsCreated: 0,
      messagesImported: 0,
      conversationsUpdated: 0,
      errors: [] as string[]
    };

    console.log('🚀 FULL INBOX SYNC - PROFESSIONAL SYNC STARTING');
    console.log('================================================');

    // Get company_id from instance
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
    // STEP 1: Fetch ALL chats from Evolution API
    // ============================================
    console.log('\n📍 STEP 1: Fetching ALL chats from Evolution API...');
    
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error(`Failed to fetch chats: ${chatsResponse.status}`);
    }

    const apiChats = await chatsResponse.json();
    console.log(`📱 API returned ${apiChats.length} chats`);
    stats.apiChatsFound = apiChats.length;

    // ============================================
    // STEP 2: Build map of existing conversations by remoteJid
    // ============================================
    console.log('\n📍 STEP 2: Building existing conversations map...');
    
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    const convByJid = new Map<string, any>();
    const convByPhone = new Map<string, any>();
    
    for (const conv of existingConvs || []) {
      if (conv.metadata?.remoteJid) {
        const jid = conv.metadata.remoteJid;
        convByJid.set(jid, conv);
        const phone = jid.split('@')[0];
        if (phone) convByPhone.set(phone, conv);
      }
    }
    
    console.log(`📊 Existing conversations: ${convByJid.size}`);

    // ============================================
    // STEP 3: Process each chat - Create missing contacts/conversations
    // ============================================
    console.log('\n📍 STEP 3: Processing each chat - creating missing conversations...');

    for (const chat of apiChats) {
      const remoteJid = chat.id || chat.remoteJid || chat.jid;
      if (!remoteJid) continue;
      
      // Skip groups
      if (remoteJid.includes('@g.us')) continue;
      
      // Skip @lid chats (internal format)
      if (remoteJid.includes('@lid')) continue;
      
      // Check if conversation already exists
      const phone = remoteJid.split('@')[0];
      let existingConv = convByJid.get(remoteJid) || convByPhone.get(phone);
      
      if (existingConv) {
        // Update remoteJid in metadata if missing
        if (!existingConv.metadata?.remoteJid) {
          await supabase
            .from('conversations')
            .update({
              metadata: {
                ...(existingConv.metadata || {}),
                remoteJid,
                instanceName: INSTANCE_NAME
              }
            })
            .eq('id', existingConv.id);
        }
        continue;
      }

      // === CREATE NEW CONVERSATION ===
      console.log(`\n➕ Creating conversation for: ${remoteJid}`);
      
      const contactName = chat.name || chat.pushName || chat.notify || phone;
      
      // Check if contact exists by phone
      let contact = null;
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', companyId)
        .eq('phone', phone)
        .maybeSingle();

      if (existingContact) {
        contact = existingContact;
        console.log(`  ✅ Found existing contact: ${contact.name}`);
        
        // Update remoteJid if missing
        if (!contact.metadata?.remoteJid) {
          await supabase
            .from('contacts')
            .update({
              metadata: { ...(contact.metadata || {}), remoteJid },
              name: contactName || contact.name,
              updated_at: new Date().toISOString()
            })
            .eq('id', contact.id);
        }
      } else {
        // Create new contact
        console.log(`  ➕ Creating new contact: ${contactName} (${phone})`);
        
        // Try to fetch profile picture
        let avatarUrl = null;
        try {
          const ppResponse = await fetch(`${evolutionApiUrl}/chat/fetchProfilePictureUrl/${INSTANCE_NAME}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey
            },
            body: JSON.stringify({ number: phone })
          });
          if (ppResponse.ok) {
            const ppData = await ppResponse.json();
            avatarUrl = ppData.profilePictureUrl || ppData.pictureUrl || ppData.url || null;
          }
        } catch (e) {
          console.log(`  ⚠️ Could not fetch profile picture`);
        }

        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            name: contactName,
            phone: phone,
            avatar_url: avatarUrl,
            company_id: companyId,
            metadata: { remoteJid },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (contactError) {
          console.log(`  ❌ Error creating contact: ${contactError.message}`);
          stats.errors.push(`Contact error for ${phone}: ${contactError.message}`);
          continue;
        }

        contact = newContact;
        stats.contactsCreated++;
        console.log(`  ✅ Contact created: ${contact.id}`);
      }

      // Create conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          contact_id: contact.id,
          company_id: companyId,
          channel: 'whatsapp',
          status: 'open',
          bot_active: true,
          metadata: {
            remoteJid,
            instanceName: INSTANCE_NAME
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (convError) {
        console.log(`  ❌ Error creating conversation: ${convError.message}`);
        stats.errors.push(`Conversation error for ${phone}: ${convError.message}`);
        continue;
      }

      stats.conversationsCreated++;
      console.log(`  ✅ Conversation created: ${newConv.id}`);

      // Add to maps for message sync
      convByJid.set(remoteJid, newConv);
      convByPhone.set(phone, newConv);
    }

    console.log(`\n📊 Step 3 complete: ${stats.conversationsCreated} conversations created, ${stats.contactsCreated} contacts created`);

    // ============================================
    // STEP 4: Sync messages for ALL conversations
    // ============================================
    console.log('\n📍 STEP 4: Syncing messages for all conversations...');

    let processedCount = 0;
    for (const [jid, conv] of convByJid.entries()) {
      // Skip groups
      if (jid.includes('@g.us')) continue;
      
      processedCount++;
      
      try {
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
          console.log(`  ⚠️ Failed to fetch messages for ${jid.substring(0, 15)}...`);
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

        if (messageList.length === 0) continue;

        // Get existing message IDs
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
          const ts = Number(apiMsg.messageTimestamp || 0);
          if (ts > 0) {
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
          const { error } = await supabase
            .from('messages')
            .insert(newMessages);

          if (!error) {
            stats.messagesImported += newMessages.length;

            // Update conversation timestamp
            if (latestTimestamp > 0) {
              const timestampMs = latestTimestamp > 1e12 ? latestTimestamp : latestTimestamp * 1000;
              await supabase
                .from('conversations')
                .update({ updated_at: new Date(timestampMs).toISOString() })
                .eq('id', conv.id);
              stats.conversationsUpdated++;
            }
          }
        }

      } catch (err: any) {
        stats.errors.push(`Error syncing ${jid}: ${err.message}`);
      }
    }

    console.log(`📊 Step 4 complete: ${stats.messagesImported} messages imported from ${processedCount} conversations`);

    // ============================================
    // STEP 5: Update ALL conversation timestamps based on latest message
    // ============================================
    console.log('\n📍 STEP 5: Fixing all conversation timestamps...');

    const { data: allConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    for (const conv of allConvs || []) {
      const { data: latestMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestMsg) {
        await supabase
          .from('conversations')
          .update({ updated_at: latestMsg.created_at })
          .eq('id', conv.id);
      }
    }

    console.log(`📊 Step 5 complete: timestamps updated`);

    // Final summary
    console.log('\n🎉 FULL INBOX SYNC COMPLETE');
    console.log('============================');
    console.log(`API Chats Found: ${stats.apiChatsFound}`);
    console.log(`Conversations Created: ${stats.conversationsCreated}`);
    console.log(`Contacts Created: ${stats.contactsCreated}`);
    console.log(`Messages Imported: ${stats.messagesImported}`);
    console.log(`Conversations Updated: ${stats.conversationsUpdated}`);
    console.log(`Errors: ${stats.errors.length}`);
    if (stats.errors.length > 0) {
      console.log(`Error details: ${JSON.stringify(stats.errors.slice(0, 10))}`);
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
  
  const text = msg.body || msg.text || msg.caption;
  if (text) return text;
  
  return '';
}
