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

        // Process ALL chats to ensure parity with WhatsApp Web
        // Previously limited to 150, now processing all for complete sync
        const recentChats = allChats;
        console.log(`📋 Processing ALL ${recentChats.length} chats for complete WhatsApp parity`);

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
        const convByContactPhone = new Map<string, any>();
        
        for (const conv of existingConvs || []) {
          const jid = conv.metadata?.remoteJid;
          if (jid) {
            convByJid.set(jid, conv);
            const phone = jid.split('@')[0];
            if (phone && /^\d+$/.test(phone)) {
              convByPhone.set(phone, conv);
            }
          }
          // Also map by contact phone for fallback lookup
          if (conv.contacts?.phone) {
            convByContactPhone.set(conv.contacts.phone, conv);
          }
        }

        console.log(`📊 Existing: ${existingConvs?.length || 0} convs, ${existingContacts?.length || 0} contacts`);

        // Process each chat
        for (const chat of recentChats) {
          const remoteJid = chat.id || chat.remoteJid || chat.jid;
          if (!remoteJid) continue;
          if (remoteJid === 'status@broadcast') continue;

          // CRITICAL: Validate JID format with STRICT regex patterns
          // Only accept real WhatsApp JID formats, reject ALL message IDs
          const VALID_JID_PATTERNS = [
            /^\d{10,15}@s\.whatsapp\.net$/,  // Contato individual padrão
            /^\d+-\d+@g\.us$/,               // Grupo (formato: id-timestamp@g.us)
            /^\d+@g\.us$/,                   // Grupo alternativo
            /^[a-zA-Z0-9]+@lid$/,            // LID (contato sem número visível)
            /^\d{10,15}@c\.us$/              // Formato antigo
          ];
          
          const isValidJid = VALID_JID_PATTERNS.some(pattern => pattern.test(remoteJid));
          
          // Additional check: reject if remoteJid looks like a message ID
          const looksLikeMessageId = /^(cmj|wamid|BAE|msg|3EB)[a-zA-Z0-9]{10,}$/i.test(remoteJid) ||
                                     /^[a-fA-F0-9]{20,}$/.test(remoteJid);
          
          if (!isValidJid || looksLikeMessageId) {
            console.log(`⚠️ Ignorando JID inválido: ${remoteJid.substring(0, 30)}...`);
            continue;
          }

          const isGroup = remoteJid.includes('@g.us');
          const isLid = remoteJid.includes('@lid');
          const phone = (isLid || isGroup) ? null : remoteJid.split('@')[0];
          
          // Additional validation: reject message IDs used as contact names
          const rawContactName = chat.name || chat.pushName || chat.notify || phone || remoteJid;
          
          // Skip if name looks like a message ID (cmja..., wamid..., long hex strings)
          if (/^(cmja|wamid|msg|BAE)[a-zA-Z0-9]{10,}$/i.test(rawContactName) ||
              /^[a-fA-F0-9]{20,}$/.test(rawContactName)) {
            console.log(`⚠️ Ignorando nome inválido (parece ID de mensagem): ${rawContactName.substring(0, 30)}...`);
            continue;
          }
          
          const contactName = rawContactName;
          const cleanName = contactName.toLowerCase().trim();

          // Find or create conversation
          let conversation = convByJid.get(remoteJid);
          
          if (!conversation && phone) {
            conversation = convByPhone.get(phone) || convByContactPhone.get(phone);
          }

          // If conversation found but missing remoteJid in metadata, update it
          if (conversation && !conversation.metadata?.remoteJid) {
            await supabase
              .from('conversations')
              .update({ 
                metadata: { 
                  ...conversation.metadata, 
                  remoteJid, 
                  instanceName,
                  fixedBySync: true 
                } 
              })
              .eq('id', conversation.id);
            conversation.metadata = { ...conversation.metadata, remoteJid };
          }
          if (!conversation) {
            const validPhone = phone && /^\d{10,15}$/.test(phone);
            
            // Create for: valid phone numbers, groups, OR @lid contacts (new!)
            if (validPhone || isGroup || isLid) {
              console.log(`➕ Creating: ${contactName} (${isLid ? 'LID' : isGroup ? 'GROUP' : 'PHONE'})`);
              
              let contact = contactByPhone.get(phone || '') || contactByName.get(cleanName);
              
              if (!contact) {
                const { data: newContact, error: contactErr } = await supabase
                  .from('contacts')
                  .insert({
                    name: contactName,
                    phone: phone || null,
                    company_id: companyId,
                    metadata: { 
                      remoteJid, 
                      isGroup, 
                      isLid,
                      syncCreated: true,
                      createdAt: new Date().toISOString()
                    }
                  })
                  .select()
                  .single();
                
                if (newContact) {
                  contact = newContact;
                  stats.contactsCreated++;
                  if (phone) contactByPhone.set(phone, contact);
                  contactByName.set(cleanName, contact);
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
                      isLid,
                      syncCreated: true,
                      createdAt: new Date().toISOString()
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
        // ONLY update if the latest message timestamp is DIFFERENT from current updated_at
        console.log('⏰ Updating conversation timestamps...');
        
        const { data: allConvs } = await supabase
          .from('conversations')
          .select('id, updated_at')
          .eq('company_id', companyId)
          .eq('channel', 'whatsapp');

        let updatedCount = 0;
        for (const conv of allConvs || []) {
          // Buscar última mensagem que NÃO seja uma reação
          // Reações começam com "Reagiu com" - não devem afetar ordenação
          const { data: latestMsg } = await supabase
            .from('messages')
            .select('created_at, content')
            .eq('conversation_id', conv.id)
            .not('content', 'like', 'Reagiu com %')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestMsg) {
            // Only update if timestamps don't match (prevents constant updates)
            const msgTime = new Date(latestMsg.created_at).getTime();
            const convTime = new Date(conv.updated_at).getTime();
            
            // Update only if message is newer than current updated_at
            if (msgTime > convTime || Math.abs(msgTime - convTime) > 1000) {
              const { error: updateErr } = await supabase
                .from('conversations')
                .update({ updated_at: latestMsg.created_at })
                .eq('id', conv.id);
                
              if (!updateErr) updatedCount++;
            }
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
    // Try multiple endpoints to ensure we get messages
    let messageList: any[] = [];
    
    // Method 1: findMessages with remoteJid filter
    try {
      const resp1 = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
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
      
      if (resp1.ok) {
        const data = await resp1.json();
        if (Array.isArray(data)) messageList = data;
        else if (data.messages?.records) messageList = data.messages.records;
        else if (data.messages) messageList = data.messages;
        else if (data.records) messageList = data.records;
      }
    } catch (e) {
      // Silently continue to next method
    }
    
    // Method 2: Try alternate endpoint format if first failed
    if (messageList.length === 0) {
      try {
        const resp2 = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            remoteJid,
            limit: 100
          })
        });
        
        if (resp2.ok) {
          const data = await resp2.json();
          if (Array.isArray(data)) messageList = data;
          else if (data.messages) messageList = Array.isArray(data.messages) ? data.messages : [];
        }
      } catch (e) {
        // Continue
      }
    }

    if (messageList.length === 0) return 0;

    // Get existing messages - check by BOTH external_id AND content+timestamp combo
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id, content, created_at, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(200);

    // Build multiple sets for deduplication
    const existingExternalIds = new Set<string>();
    const existingContentTimestamps = new Set<string>();
    
    for (const msg of existingMessages || []) {
      // Check all possible external ID fields
      const extId = msg.metadata?.external_id || msg.metadata?.message_id || msg.metadata?.messageId;
      if (extId) existingExternalIds.add(extId);
      
      // Also check by content + approximate timestamp (within 5 seconds)
      const ts = new Date(msg.created_at).getTime();
      const contentKey = `${msg.content?.substring(0, 50)}|${Math.floor(ts / 5000)}`;
      existingContentTimestamps.add(contentKey);
    }

    const newMessages = [];
    
    for (const apiMsg of messageList) {
      const key = apiMsg.key || {};
      const messageId = key.id || apiMsg.id || apiMsg.messageId;
      
      // Skip if we have this external ID
      if (messageId && existingExternalIds.has(messageId)) continue;

      const content = extractContent(apiMsg);
      if (!content) continue;

      // Parse timestamp
      const ts = Number(apiMsg.messageTimestamp || 0);
      let timestamp: string;
      let timestampMs: number;
      
      if (ts > 0) {
        timestampMs = ts > 1e12 ? ts : ts * 1000;
        timestamp = new Date(timestampMs).toISOString();
      } else {
        timestampMs = Date.now();
        timestamp = new Date().toISOString();
      }

      // Skip if we have this content+timestamp combo (duplicate check)
      const contentKey = `${content.substring(0, 50)}|${Math.floor(timestampMs / 5000)}`;
      if (existingContentTimestamps.has(contentKey)) continue;

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
          syncImported: true,
          syncVersion: 'v7'
        }
      });

      // Add to sets to prevent duplicates in same batch
      if (messageId) existingExternalIds.add(messageId);
      existingContentTimestamps.add(contentKey);
    }

    if (newMessages.length > 0) {
      console.log(`  📥 Importing ${newMessages.length} new messages for ${remoteJid.split('@')[0]}`);
      
      // Insert in smaller batches
      const batchSize = 25;
      let inserted = 0;
      
      for (let i = 0; i < newMessages.length; i += batchSize) {
        const batch = newMessages.slice(i, i + batchSize);
        const { error } = await supabase.from('messages').insert(batch);
        if (!error) {
          inserted += batch.length;
        } else {
          console.error(`  ❌ Insert error: ${error.message}`);
        }
      }
      
      stats.messagesImported += inserted;
      return inserted;
    }

    return 0;
  } catch (err: any) {
    console.error(`  ❌ Sync error for ${remoteJid}: ${err.message}`);
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
