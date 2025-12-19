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

  console.log('🔄 REALTIME SYNC V4 - SYNC ONLY, NO BOT RESPONSES');

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
      lidMappings: 0,
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
    console.log('\n📱 Fetching chats from Evolution API...');
    
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

    // Process top 50 recent chats
    const recentChats = allChats.slice(0, 50);
    console.log(`📋 Processing top ${recentChats.length} recent chats\n`);

    // =============================================
    // STEP 2: Build maps of existing data
    // =============================================
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId);

    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('*, contacts(*)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    // Contact maps
    const contactByPhone = new Map<string, any>();
    const contactByName = new Map<string, any>();
    const contactById = new Map<string, any>();
    
    for (const c of existingContacts || []) {
      contactById.set(c.id, c);
      if (c.phone) contactByPhone.set(c.phone, c);
      if (c.name) contactByName.set(c.name.toLowerCase().trim(), c);
    }

    // Conversation maps - multiple lookup paths
    const convByJid = new Map<string, any>();
    const convByPhone = new Map<string, any>();
    const convByLidJid = new Map<string, any>();
    const convByContactId = new Map<string, any>();
    const convByContactName = new Map<string, any>();
    
    for (const conv of existingConvs || []) {
      if (conv.metadata?.remoteJid) {
        convByJid.set(conv.metadata.remoteJid, conv);
        const phone = conv.metadata.remoteJid.split('@')[0];
        if (phone && /^\d+$/.test(phone)) {
          convByPhone.set(phone, conv);
        }
      }
      if (conv.metadata?.lidJid) {
        convByLidJid.set(conv.metadata.lidJid, conv);
      }
      if (conv.contact_id) {
        convByContactId.set(conv.contact_id, conv);
      }
      if (conv.contacts?.name) {
        convByContactName.set(conv.contacts.name.toLowerCase().trim(), conv);
      }
    }

    console.log(`📊 Existing conversations: ${existingConvs?.length || 0}`);
    console.log(`📊 Existing contacts: ${existingContacts?.length || 0}`);

    // =============================================
    // STEP 3: Process each chat - SYNC ONLY, NO BOT
    // =============================================
    for (const chat of recentChats) {
      const remoteJid = chat.id || chat.remoteJid || chat.jid;
      if (!remoteJid) continue;

      // Skip groups
      if (remoteJid.includes('@g.us')) continue;

      const isLid = remoteJid.includes('@lid') || remoteJid.startsWith('cmj');
      const phone = isLid ? null : remoteJid.split('@')[0];
      const contactName = chat.name || chat.pushName || chat.notify || phone || remoteJid;
      const cleanName = contactName.toLowerCase().trim();

      console.log(`📞 ${contactName} | JID: ${remoteJid.substring(0, 30)}... | isLid: ${isLid}`);

      // Find existing conversation by multiple methods
      let conversation = convByJid.get(remoteJid) || convByLidJid.get(remoteJid);
      
      if (!conversation && phone) {
        conversation = convByPhone.get(phone);
      }
      
      // For @lid, try to find by contact name
      if (!conversation && isLid && contactName) {
        conversation = convByContactName.get(cleanName);
        if (conversation) {
          console.log(`  ✅ Found by name: ${contactName}`);
          // Update metadata to include this lidJid
          const { error: updateErr } = await supabase
            .from('conversations')
            .update({
              metadata: { 
                ...conversation.metadata, 
                lidJid: remoteJid,
                lastSyncAt: new Date().toISOString()
              }
            })
            .eq('id', conversation.id);
          
          if (!updateErr) {
            convByLidJid.set(remoteJid, conversation);
            stats.lidMappings++;
          }
        }
      }

      // If still no conversation, create one (only for non-@lid with valid phone)
      // CRITICAL: bot_active = FALSE to prevent automatic responses
      if (!conversation && !isLid && phone && /^\d{10,15}$/.test(phone)) {
        console.log(`  ➕ Creating conversation for ${contactName} (${phone}) - BOT DISABLED`);
        
        let contact = contactByPhone.get(phone) || contactByName.get(cleanName);
        
        if (!contact) {
          // Create contact
          const { data: newContact, error: contactErr } = await supabase
            .from('contacts')
            .insert({
              name: contactName,
              phone: phone,
              company_id: companyId,
              metadata: { remoteJid, syncCreated: true }
            })
            .select()
            .single();
          
          if (newContact) {
            contact = newContact;
            stats.contactsCreated++;
            contactByPhone.set(phone, contact);
            contactByName.set(cleanName, contact);
            console.log(`  ✅ Contact created: ${contactName}`);
          } else if (contactErr) {
            console.log(`  ❌ Contact error: ${contactErr.message}`);
            stats.errors.push(`Contact error: ${contactErr.message}`);
            continue;
          }
        }

        if (contact) {
          // CRITICAL: bot_active = FALSE for sync-created conversations
          const { data: newConv, error: convErr } = await supabase
            .from('conversations')
            .insert({
              contact_id: contact.id,
              company_id: companyId,
              channel: 'whatsapp',
              status: 'open',
              bot_active: false, // NEVER enable bot for sync
              metadata: { 
                remoteJid,
                instanceName: INSTANCE_NAME,
                syncCreated: true,
                syncTimestamp: new Date().toISOString()
              }
            })
            .select('*, contacts(*)')
            .single();

          if (newConv) {
            conversation = newConv;
            stats.conversationsCreated++;
            convByJid.set(remoteJid, conversation);
            convByPhone.set(phone, conversation);
            convByContactId.set(contact.id, conversation);
            console.log(`  ✅ Conversation created (bot disabled)`);
          } else if (convErr) {
            console.log(`  ❌ Conversation error: ${convErr.message}`);
            stats.errors.push(`Conversation error: ${convErr.message}`);
          }
        }
      }

      // =============================================
      // STEP 4: Sync messages for this conversation
      // =============================================
      if (conversation) {
        const msgCount = await syncMessages(
          supabase, evolutionApiUrl, evolutionApiKey, 
          conversation.id, remoteJid, stats
        );
        if (msgCount > 0) {
          console.log(`  📥 Imported ${msgCount} messages`);
        }
      } else if (isLid) {
        console.log(`  ⚠️ No conversation found for @lid contact: ${contactName}`);
      }
    }

    // =============================================
    // STEP 5: Update all conversation timestamps
    // =============================================
    console.log('\n⏰ Updating timestamps...');
    
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

    console.log('\n✅ SYNC COMPLETE - NO BOT MESSAGES SENT');
    console.log(`Chats from API: ${stats.chatsFromApi}`);
    console.log(`Messages imported: ${stats.messagesImported}`);
    console.log(`Conversations created: ${stats.conversationsCreated}`);
    console.log(`LID mappings: ${stats.lidMappings}`);
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

async function syncMessages(
  supabase: any,
  evolutionApiUrl: string,
  evolutionApiKey: string,
  conversationId: string,
  remoteJid: string,
  stats: any
): Promise<number> {
  try {
    const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({
        where: { key: { remoteJid } },
        limit: 50
      })
    });

    if (!messagesResponse.ok) {
      return 0;
    }

    const apiData = await messagesResponse.json();
    let messageList: any[] = [];
    
    if (Array.isArray(apiData)) {
      messageList = apiData;
    } else if (apiData.messages?.records) {
      messageList = apiData.messages.records;
    } else if (apiData.messages) {
      messageList = apiData.messages;
    } else if (apiData.records) {
      messageList = apiData.records;
    }

    if (messageList.length === 0) return 0;

    // Get existing message IDs
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingIds = new Set<string>();
    for (const msg of existingMessages || []) {
      if (msg.metadata?.external_id) existingIds.add(msg.metadata.external_id);
      if (msg.metadata?.message_id) existingIds.add(msg.metadata.message_id);
      if (msg.metadata?.messageId) existingIds.add(msg.metadata.messageId);
    }

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
          messageId: messageId,
          remoteJid,
          fromMe: key.fromMe || false,
          instanceName: INSTANCE_NAME,
          syncImported: true // Mark as sync imported
        }
      });

      existingIds.add(messageId);
    }

    if (newMessages.length > 0) {
      const { error } = await supabase.from('messages').insert(newMessages);
      if (!error) {
        stats.messagesImported += newMessages.length;
        return newMessages.length;
      }
    }

    return 0;
  } catch (err: any) {
    stats.errors.push(`Sync error: ${err.message}`);
    return 0;
  }
}

function extractContent(msg: any): string {
  const message = msg.message || msg;
  
  if (typeof message === 'string') return message;
  
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  
  if (message.imageMessage) {
    return message.imageMessage.caption || '[Imagem]';
  }
  
  if (message.videoMessage) {
    return message.videoMessage.caption || '[Vídeo]';
  }
  
  if (message.audioMessage) {
    const seconds = message.audioMessage.seconds || 0;
    if (seconds > 0) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `[Áudio ${mins}:${secs.toString().padStart(2, '0')}]`;
    }
    return '[Áudio]';
  }
  
  if (message.documentMessage) {
    return message.documentMessage.fileName 
      ? `[Documento: ${message.documentMessage.fileName}]` 
      : '[Documento]';
  }
  
  if (message.stickerMessage) return '[Figurinha]';
  if (message.contactMessage || message.contactsArrayMessage) return '[Contato]';
  if (message.locationMessage || message.liveLocationMessage) return '[Localização]';
  if (message.reactionMessage) return '';
  if (message.protocolMessage) return '';
  if (message.pollCreationMessage) return '[Enquete]';
  
  const text = msg.body || msg.text || msg.caption;
  if (text) return text;
  
  return '';
}
