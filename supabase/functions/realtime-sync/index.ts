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

  console.log('🔄 REALTIME SYNC - Starting aggressive sync...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const stats = {
      chatsFromApi: 0,
      messagesImported: 0,
      conversationsCreated: 0,
      conversationsUpdated: 0,
      contactsCreated: 0,
      errors: [] as string[]
    };

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
    console.log(`📌 Company: ${companyId}`);

    // =============================================
    // STEP 1: Fetch ALL chats from Evolution API
    // =============================================
    console.log('\n📱 Fetching all chats from Evolution API...');
    
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error(`API error: ${chatsResponse.status}`);
    }

    const allChats = await chatsResponse.json();
    stats.chatsFromApi = allChats.length;
    console.log(`📊 Found ${allChats.length} chats from API`);

    // Sort chats by last message timestamp (most recent first)
    allChats.sort((a: any, b: any) => {
      const tsA = a.lastMsgTimestamp || a.timestamp || 0;
      const tsB = b.lastMsgTimestamp || b.timestamp || 0;
      return tsB - tsA;
    });

    // Process top 30 most recent chats
    const recentChats = allChats.slice(0, 30);
    console.log(`📋 Processing top ${recentChats.length} recent chats`);

    // Build existing conversations map
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id, contacts(id, name, phone)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    const convByJid = new Map<string, any>();
    const convByPhone = new Map<string, any>();
    
    for (const conv of existingConvs || []) {
      if (conv.metadata?.remoteJid) {
        convByJid.set(conv.metadata.remoteJid, conv);
        const phone = conv.metadata.remoteJid.split('@')[0];
        if (phone && /^\d+$/.test(phone)) {
          convByPhone.set(phone, conv);
        }
      }
      if (conv.contacts?.phone) {
        convByPhone.set(conv.contacts.phone, conv);
      }
    }

    console.log(`📊 Existing conversations: ${convByJid.size}`);

    // =============================================
    // STEP 2: Process each chat
    // =============================================
    for (const chat of recentChats) {
      const remoteJid = chat.id || chat.remoteJid || chat.jid;
      if (!remoteJid) continue;

      // Skip groups for now (they're handled differently)
      if (remoteJid.includes('@g.us')) {
        // Groups - just sync messages if conversation exists
        const existingGroup = convByJid.get(remoteJid);
        if (existingGroup) {
          await syncMessagesForConversation(supabase, evolutionApiUrl, evolutionApiKey, existingGroup.id, remoteJid, stats);
        }
        continue;
      }

      // Extract phone from remoteJid
      const phone = remoteJid.split('@')[0];
      const contactName = chat.name || chat.pushName || chat.notify || phone;
      const isLid = remoteJid.includes('@lid');

      console.log(`\n📞 Processing: ${contactName} (${remoteJid})`);

      // Find existing conversation
      let conversation = convByJid.get(remoteJid) || convByPhone.get(phone);

      if (!conversation && !isLid) {
        // Create new contact and conversation for valid phone numbers
        if (phone && /^\d{10,15}$/.test(phone)) {
          console.log(`  ➕ Creating new contact/conversation for ${contactName}`);
          
          // Check if contact exists
          let contact = null;
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('*')
            .eq('company_id', companyId)
            .eq('phone', phone)
            .maybeSingle();

          if (existingContact) {
            contact = existingContact;
            // Update name if it's better
            if (contactName && contactName !== phone && (!contact.name || contact.name === phone)) {
              await supabase
                .from('contacts')
                .update({ name: contactName, updated_at: new Date().toISOString() })
                .eq('id', contact.id);
            }
          } else {
            // Try to fetch profile picture
            let avatarUrl = null;
            try {
              const ppResponse = await fetch(`${evolutionApiUrl}/chat/fetchProfilePictureUrl/${INSTANCE_NAME}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify({ number: phone })
              });
              if (ppResponse.ok) {
                const ppData = await ppResponse.json();
                avatarUrl = ppData.profilePictureUrl || ppData.pictureUrl || null;
              }
            } catch (e) { /* ignore */ }

            const { data: newContact } = await supabase
              .from('contacts')
              .insert({
                name: contactName,
                phone: phone,
                avatar_url: avatarUrl,
                company_id: companyId,
                metadata: { remoteJid }
              })
              .select()
              .single();

            if (newContact) {
              contact = newContact;
              stats.contactsCreated++;
            }
          }

          if (contact) {
            // Create conversation
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                contact_id: contact.id,
                company_id: companyId,
                channel: 'whatsapp',
                status: 'open',
                bot_active: true,
                metadata: { remoteJid, instanceName: INSTANCE_NAME }
              })
              .select()
              .single();

            if (newConv) {
              conversation = newConv;
              stats.conversationsCreated++;
              convByJid.set(remoteJid, conversation);
              convByPhone.set(phone, conversation);
            }
          }
        }
      }

      // Sync messages for this conversation
      if (conversation) {
        await syncMessagesForConversation(supabase, evolutionApiUrl, evolutionApiKey, conversation.id, remoteJid, stats);
      }
    }

    // =============================================
    // STEP 3: Update all conversation timestamps
    // =============================================
    console.log('\n⏰ Updating conversation timestamps...');
    
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
        stats.conversationsUpdated++;
      }
    }

    console.log('\n✅ SYNC COMPLETE');
    console.log(`Chats from API: ${stats.chatsFromApi}`);
    console.log(`Messages imported: ${stats.messagesImported}`);
    console.log(`Conversations created: ${stats.conversationsCreated}`);
    console.log(`Contacts created: ${stats.contactsCreated}`);
    console.log(`Errors: ${stats.errors.length}`);

    return new Response(JSON.stringify({ success: true, stats }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function syncMessagesForConversation(
  supabase: any,
  evolutionApiUrl: string,
  evolutionApiKey: string,
  conversationId: string,
  remoteJid: string,
  stats: any
) {
  try {
    // Fetch messages from API
    const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({
        where: { key: { remoteJid } },
        limit: 100
      })
    });

    if (!messagesResponse.ok) return;

    const apiData = await messagesResponse.json();
    let messageList: any[] = [];
    
    if (Array.isArray(apiData)) {
      messageList = apiData;
    } else if (apiData.messages?.records) {
      messageList = apiData.messages.records;
    } else if (apiData.messages) {
      messageList = apiData.messages;
    }

    if (messageList.length === 0) return;

    // Get existing message IDs
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingIds = new Set<string>();
    for (const msg of existingMessages || []) {
      if (msg.metadata?.external_id) existingIds.add(msg.metadata.external_id);
      if (msg.metadata?.message_id) existingIds.add(msg.metadata.message_id);
    }

    // Process new messages
    const newMessages = [];
    
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
      } else {
        timestamp = new Date().toISOString();
      }

      newMessages.push({
        conversation_id: conversationId,
        sender_type: key.fromMe ? 'agent' : 'user',
        content,
        created_at: timestamp,
        metadata: {
          external_id: messageId,
          message_id: messageId,
          remoteJid,
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
        console.log(`  📥 Imported ${newMessages.length} messages for ${remoteJid}`);
      }
    }

  } catch (err: any) {
    stats.errors.push(`Sync error for ${remoteJid}: ${err.message}`);
  }
}

function extractContent(msg: any): string {
  const message = msg.message || msg;
  
  if (typeof message === 'string') return message;
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption || '[Imagem]';
  if (message.imageMessage) return '[Imagem]';
  if (message.videoMessage?.caption) return message.videoMessage.caption || '[Vídeo]';
  if (message.videoMessage) return '[Vídeo]';
  if (message.audioMessage) {
    const seconds = message.audioMessage.seconds || 0;
    if (seconds > 0) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `[Áudio ${mins}:${secs.toString().padStart(2, '0')}]`;
    }
    return '[Áudio]';
  }
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
