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

  const startTime = Date.now();
  console.log('🔄 REALTIME SYNC V6 - FULL ROBUST SYNC');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const stats = {
      instances: 0,
      chatsFromApi: 0,
      messagesImported: 0,
      conversationsCreated: 0,
      conversationsUpdated: 0,
      contactsCreated: 0,
      errors: [] as string[]
    };

    // Get ALL connected instances (include 'open' status)
    const { data: instances, error: instError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .or('connection_state.eq.open,connection_state.eq.connected,status.eq.open');

    if (instError) {
      console.error('❌ Error fetching instances:', instError);
      throw instError;
    }

    if (!instances || instances.length === 0) {
      console.log('⚠️ No connected instances found');
      return new Response(JSON.stringify({ success: true, stats, message: 'No connected instances' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📱 Found ${instances.length} connected instances: ${instances.map(i => i.instance_name).join(', ')}`);
    stats.instances = instances.length;

    // Process EACH instance
    for (const instance of instances) {
      const instanceName = instance.instance_name;
      const companyId = instance.company_id;
      
      if (!companyId) {
        console.log(`⚠️ Instance ${instanceName} has no company_id, skipping`);
        continue;
      }
      
      console.log(`\n📱 Processing instance: ${instanceName} (Company: ${companyId})`);

      try {
        // Fetch ALL chats from Evolution API
        console.log('📥 Fetching chats from Evolution API...');
        
        const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({})
        });

        if (!chatsResponse.ok) {
          const errorText = await chatsResponse.text();
          console.error(`❌ API error for ${instanceName}: ${chatsResponse.status} - ${errorText}`);
          stats.errors.push(`API error ${instanceName}: ${chatsResponse.status}`);
          continue;
        }

        const allChats = await chatsResponse.json();
        console.log(`📊 Found ${allChats.length} chats for ${instanceName}`);
        stats.chatsFromApi += allChats.length;

        // Sort by most recent activity
        allChats.sort((a: any, b: any) => {
          const tsA = a.lastMsgTimestamp || a.timestamp || 0;
          const tsB = b.lastMsgTimestamp || b.timestamp || 0;
          return tsB - tsA;
        });

        // Process top 150 chats (more comprehensive)
        const recentChats = allChats.slice(0, 150);
        console.log(`📋 Processing ${recentChats.length} recent chats`);

        // Get existing data for this company
        const { data: existingContacts } = await supabase
          .from('contacts')
          .select('*')
          .eq('company_id', companyId);

        const { data: existingConvs } = await supabase
          .from('conversations')
          .select('*, contacts(*)')
          .eq('company_id', companyId)
          .eq('channel', 'whatsapp');

        // Build lookup maps
        const contactByPhone = new Map<string, any>();
        const contactByName = new Map<string, any>();
        
        for (const c of existingContacts || []) {
          if (c.phone) contactByPhone.set(c.phone, c);
          if (c.name) contactByName.set(c.name.toLowerCase().trim(), c);
        }

        const convByJid = new Map<string, any>();
        const convByPhone = new Map<string, any>();
        
        for (const conv of existingConvs || []) {
          const jid = conv.metadata?.remoteJid;
          if (jid) {
            convByJid.set(jid, conv);
            const phone = jid.split('@')[0];
            if (phone && /^\d+$/.test(phone)) {
              convByPhone.set(phone, conv);
            }
          }
        }

        console.log(`📊 Existing: ${existingConvs?.length || 0} convs, ${existingContacts?.length || 0} contacts`);

        // Process each chat
        for (const chat of recentChats) {
          const remoteJid = chat.id || chat.remoteJid || chat.jid;
          if (!remoteJid) continue;
          if (remoteJid === 'status@broadcast') continue;

          const isGroup = remoteJid.includes('@g.us');
          const isLid = remoteJid.includes('@lid');
          const phone = (isLid || isGroup) ? null : remoteJid.split('@')[0];
          const contactName = chat.name || chat.pushName || chat.notify || phone || remoteJid;
          const cleanName = contactName.toLowerCase().trim();

          // Find or create conversation
          let conversation = convByJid.get(remoteJid);
          
          if (!conversation && phone) {
            conversation = convByPhone.get(phone);
          }

          // Create new if not found
          if (!conversation && (phone || isGroup)) {
            const validPhone = phone && /^\d{10,15}$/.test(phone);
            
            if (validPhone || isGroup) {
              console.log(`➕ Creating: ${contactName}`);
              
              let contact = contactByPhone.get(phone || '') || contactByName.get(cleanName);
              
              if (!contact) {
                const { data: newContact, error: contactErr } = await supabase
                  .from('contacts')
                  .insert({
                    name: contactName,
                    phone: phone || null,
                    company_id: companyId,
                    metadata: { remoteJid, isGroup, syncCreated: true }
                  })
                  .select()
                  .single();
                
                if (newContact) {
                  contact = newContact;
                  stats.contactsCreated++;
                  if (phone) contactByPhone.set(phone, contact);
                } else if (contactErr) {
                  console.log(`⚠️ Contact error: ${contactErr.message}`);
                  continue;
                }
              }

              if (contact) {
                const { data: newConv, error: convErr } = await supabase
                  .from('conversations')
                  .insert({
                    contact_id: contact.id,
                    company_id: companyId,
                    channel: 'whatsapp',
                    status: 'open',
                    bot_active: false,
                    metadata: { 
                      remoteJid,
                      instanceName,
                      isGroup,
                      syncCreated: true
                    }
                  })
                  .select('*, contacts(*)')
                  .single();

                if (newConv) {
                  conversation = newConv;
                  stats.conversationsCreated++;
                  convByJid.set(remoteJid, conversation);
                  if (phone) convByPhone.set(phone, conversation);
                }
              }
            }
          }

          // Sync messages for this conversation
          if (conversation) {
            const msgCount = await syncMessages(
              supabase, evolutionApiUrl, evolutionApiKey, 
              conversation.id, remoteJid, instanceName, stats
            );
            
            if (msgCount > 0) {
              console.log(`📨 ${contactName}: ${msgCount} new messages`);
            }
          }
        }

        // CRITICAL: Update conversation timestamps based on latest message
        console.log('⏰ Updating conversation timestamps...');
        
        const { data: allConvs } = await supabase
          .from('conversations')
          .select('id')
          .eq('company_id', companyId)
          .eq('channel', 'whatsapp');

        let updatedCount = 0;
        for (const conv of allConvs || []) {
          const { data: latestMsg } = await supabase
            .from('messages')
            .select('created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestMsg) {
            const { error: updateErr } = await supabase
              .from('conversations')
              .update({ updated_at: latestMsg.created_at })
              .eq('id', conv.id);
              
            if (!updateErr) updatedCount++;
          }
        }
        
        stats.conversationsUpdated += updatedCount;
        console.log(`✅ Updated ${updatedCount} conversation timestamps for ${instanceName}`);

        // Update instance last_sync
        await supabase
          .from('whatsapp_instances')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', instance.id);

      } catch (instanceErr: any) {
        console.error(`❌ Error processing ${instanceName}:`, instanceErr);
        stats.errors.push(`${instanceName}: ${instanceErr.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ SYNC COMPLETE in ${duration}ms`);
    console.log(`📊 Stats: ${stats.instances} instances, ${stats.chatsFromApi} chats, ${stats.messagesImported} messages, ${stats.conversationsCreated} new convs`);

    return new Response(JSON.stringify({ success: true, stats, duration }), {
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

async function syncMessages(
  supabase: any,
  evolutionApiUrl: string,
  evolutionApiKey: string,
  conversationId: string,
  remoteJid: string,
  instanceName: string,
  stats: any
): Promise<number> {
  try {
    // Fetch last 100 messages for comprehensive sync
    const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
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

    if (!messagesResponse.ok) return 0;

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

    // Get existing message IDs for this conversation
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

      // Parse timestamp correctly
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
          instanceName,
          syncImported: true
        }
      });

      existingIds.add(messageId);
    }

    if (newMessages.length > 0) {
      // Insert in batches to avoid issues
      const batchSize = 50;
      let inserted = 0;
      
      for (let i = 0; i < newMessages.length; i += batchSize) {
        const batch = newMessages.slice(i, i + batchSize);
        const { error } = await supabase.from('messages').insert(batch);
        if (!error) {
          inserted += batch.length;
        } else {
          console.error('❌ Batch insert error:', error.message);
        }
      }
      
      stats.messagesImported += inserted;
      return inserted;
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
