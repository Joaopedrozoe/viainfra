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
      cleanedDuplicates: 0,
      apiChatsFound: 0,
      conversationsCreated: 0,
      contactsCreated: 0,
      messagesImported: 0,
      conversationsUpdated: 0,
      errors: [] as string[]
    };

    console.log('🚀 FULL INBOX SYNC V2 - PROFESSIONAL SYNC');
    console.log('==========================================');

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
    // STEP 0: Clean up duplicate contacts with @lid IDs
    // ============================================
    console.log('\n🧹 STEP 0: Cleaning duplicate @lid contacts...');
    
    // Delete contacts with invalid phone (contains 'cmja' or '@lid')
    const { data: invalidContacts } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('company_id', companyId)
      .or('phone.like.%cmja%,phone.like.%@lid%,metadata->>remoteJid.like.%@lid%');

    if (invalidContacts && invalidContacts.length > 0) {
      console.log(`  🗑️ Found ${invalidContacts.length} invalid contacts to clean`);
      
      for (const contact of invalidContacts) {
        // First delete conversations linked to this contact
        await supabase.from('conversations').delete().eq('contact_id', contact.id);
        // Then delete the contact
        await supabase.from('contacts').delete().eq('id', contact.id);
        stats.cleanedDuplicates++;
      }
      console.log(`  ✅ Cleaned ${stats.cleanedDuplicates} invalid contacts`);
    }

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
    // STEP 2: Build map of existing conversations
    // ============================================
    console.log('\n📍 STEP 2: Building existing conversations map...');
    
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id, contacts(name, phone)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    const convByJid = new Map<string, any>();
    const convByPhone = new Map<string, any>();
    
    for (const conv of existingConvs || []) {
      if (conv.metadata?.remoteJid) {
        const jid = conv.metadata.remoteJid;
        convByJid.set(jid, conv);
        const phone = jid.split('@')[0];
        if (phone && /^\d+$/.test(phone)) {
          convByPhone.set(phone, conv);
        }
      }
    }
    
    console.log(`📊 Existing valid conversations: ${convByJid.size}`);

    // ============================================
    // STEP 3: Process each chat - Only create for VALID phone numbers
    // ============================================
    console.log('\n📍 STEP 3: Processing valid chats...');

    for (const chat of apiChats) {
      const remoteJid = chat.id || chat.remoteJid || chat.jid;
      if (!remoteJid) continue;
      
      // Skip groups
      if (remoteJid.includes('@g.us')) continue;
      
      // Skip @lid format - we can't use these
      if (remoteJid.includes('@lid') || remoteJid.startsWith('cmj')) continue;
      
      // Extract phone - must be digits only
      const phone = remoteJid.split('@')[0];
      if (!phone || !/^\d{10,15}$/.test(phone)) {
        console.log(`  ⏭️ Skipping invalid phone: ${phone}`);
        continue;
      }
      
      // Check if conversation already exists
      let existingConv = convByJid.get(remoteJid) || convByPhone.get(phone);
      
      if (existingConv) {
        // Update remoteJid in metadata if different
        if (existingConv.metadata?.remoteJid !== remoteJid) {
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
      console.log(`\n➕ Creating conversation for: ${phone}`);
      
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
          // Ignore profile picture errors
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
        stats.errors.push(`Conversation error for ${phone}: ${convError.message}`);
        continue;
      }

      stats.conversationsCreated++;
      console.log(`  ✅ Conversation created: ${newConv.id}`);

      convByJid.set(remoteJid, newConv);
      convByPhone.set(phone, newConv);
    }

    console.log(`\n📊 Step 3: ${stats.conversationsCreated} conversations created`);

    // ============================================
    // STEP 4: Sync messages for ALL conversations with valid phones
    // ============================================
    console.log('\n📍 STEP 4: Syncing messages...');

    for (const [jid, conv] of convByJid.entries()) {
      if (jid.includes('@g.us') || jid.includes('@lid')) continue;
      
      try {
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

        if (!messagesResponse.ok) continue;

        const apiData = await messagesResponse.json();
        
        let messageList: any[] = [];
        if (Array.isArray(apiData)) {
          messageList = apiData;
        } else if (apiData.messages?.records) {
          messageList = apiData.messages.records;
        } else if (apiData.messages && Array.isArray(apiData.messages)) {
          messageList = apiData.messages;
        }

        if (messageList.length === 0) continue;

        const { data: existingMessages } = await supabase
          .from('messages')
          .select('metadata')
          .eq('conversation_id', conv.id);

        const existingIds = new Set<string>();
        for (const msg of existingMessages || []) {
          if (msg.metadata?.external_id) existingIds.add(msg.metadata.external_id);
          if (msg.metadata?.message_id) existingIds.add(msg.metadata.message_id);
        }

        const newMessages = [];
        let latestTimestamp = 0;

        for (const apiMsg of messageList) {
          const key = apiMsg.key || {};
          const messageId = key.id || apiMsg.id || apiMsg.messageId;
          
          if (!messageId || existingIds.has(messageId)) continue;

          const content = extractContent(apiMsg);
          if (!content) continue;

          const ts = Number(apiMsg.messageTimestamp || 0);
          let timestamp: string;
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
          const { error } = await supabase.from('messages').insert(newMessages);

          if (!error) {
            stats.messagesImported += newMessages.length;

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
        stats.errors.push(`Sync error for ${jid}: ${err.message}`);
      }
    }

    console.log(`📊 Step 4: ${stats.messagesImported} messages imported`);

    // ============================================
    // STEP 5: Update all timestamps from latest message
    // ============================================
    console.log('\n📍 STEP 5: Updating timestamps...');

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

    // Final summary
    console.log('\n🎉 SYNC COMPLETE');
    console.log('================');
    console.log(`Cleaned duplicates: ${stats.cleanedDuplicates}`);
    console.log(`API Chats: ${stats.apiChatsFound}`);
    console.log(`Conversations Created: ${stats.conversationsCreated}`);
    console.log(`Contacts Created: ${stats.contactsCreated}`);
    console.log(`Messages Imported: ${stats.messagesImported}`);
    console.log(`Errors: ${stats.errors.length}`);

    return new Response(JSON.stringify({ success: true, stats }), {
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
