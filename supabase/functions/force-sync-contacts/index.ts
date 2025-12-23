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

  console.log('🔄 FORCE SYNC SPECIFIC CONTACTS');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    const instanceName = 'VIAINFRAOFICIAL';

    // Parse request body for optional specific phones
    let targetPhones: string[] = [];
    try {
      const body = await req.json();
      if (body.phones && Array.isArray(body.phones)) {
        targetPhones = body.phones;
      }
    } catch {
      // Default phones if none provided
      targetPhones = [
        '5511971947986', // Flavia Financeiro
        '551120854990',  // Yago Msam
        '5511992511175', // Eliomar
      ];
    }

    console.log(`📋 Target phones: ${targetPhones.join(', ')}`);

    const results: any[] = [];

    for (const phone of targetPhones) {
      console.log(`\n🔍 Processing: ${phone}`);
      
      const remoteJid = `${phone}@s.whatsapp.net`;
      
      // Find conversation for this phone - use contact phone lookup
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('phone', phone)
        .limit(1);

      const contact = contacts?.[0];
      
      if (!contact) {
        console.log(`⚠️ No contact found for ${phone}`);
        results.push({ phone, status: 'no_contact', messages: 0 });
        continue;
      }

      console.log(`  📇 Found contact: ${contact.name} (${contact.id})`);

      const { data: convs } = await supabase
        .from('conversations')
        .select('*, contacts(*)')
        .eq('channel', 'whatsapp')
        .eq('contact_id', contact.id)
        .limit(1);

      const conversation = convs?.[0];
      
      if (!conversation) {
        console.log(`⚠️ No conversation found for contact ${contact.name}`);
        results.push({ phone, status: 'no_conversation', messages: 0 });
        continue;
      }

      console.log(`✅ Found conversation: ${conversation.id} (${conversation.contacts?.name})`);

      // Fetch messages from Evolution API
      let apiMessages: any[] = [];
      
      // Try multiple methods
      const methods = [
        {
          name: 'findMessages with where',
          body: { where: { key: { remoteJid } }, limit: 200 }
        },
        {
          name: 'findMessages with remoteJid',
          body: { remoteJid, limit: 200 }
        }
      ];

      for (const method of methods) {
        if (apiMessages.length > 0) break;
        
        console.log(`  📥 Trying: ${method.name}`);
        
        try {
          const resp = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey
            },
            body: JSON.stringify(method.body)
          });

          if (resp.ok) {
            const data = await resp.json();
            console.log(`  📊 Raw response type: ${typeof data}, isArray: ${Array.isArray(data)}`);
            
            if (Array.isArray(data)) {
              apiMessages = data;
            } else if (data.messages?.records) {
              apiMessages = data.messages.records;
            } else if (data.messages) {
              apiMessages = Array.isArray(data.messages) ? data.messages : [];
            } else if (data.records) {
              apiMessages = data.records;
            }
            
            console.log(`  ✅ Got ${apiMessages.length} messages from API`);
          } else {
            const errText = await resp.text();
            console.log(`  ❌ API error: ${resp.status} - ${errText.substring(0, 200)}`);
          }
        } catch (err: any) {
          console.log(`  ❌ Fetch error: ${err.message}`);
        }
      }

      if (apiMessages.length === 0) {
        console.log(`⚠️ No messages from API for ${phone}`);
        results.push({ phone, status: 'no_api_messages', messages: 0 });
        continue;
      }

      // Get existing messages
      const { data: existingMsgs } = await supabase
        .from('messages')
        .select('id, content, created_at, metadata')
        .eq('conversation_id', conversation.id);

      console.log(`  📊 Existing messages in DB: ${existingMsgs?.length || 0}`);

      // Build dedup sets
      const existingIds = new Set<string>();
      const existingContentTs = new Set<string>();
      
      for (const msg of existingMsgs || []) {
        const extId = msg.metadata?.external_id || msg.metadata?.messageId;
        if (extId) existingIds.add(extId);
        
        const ts = new Date(msg.created_at).getTime();
        const key = `${msg.content?.substring(0, 30)}|${Math.floor(ts / 10000)}`;
        existingContentTs.add(key);
      }

      // Process API messages
      const newMessages: any[] = [];
      
      for (const apiMsg of apiMessages) {
        const key = apiMsg.key || {};
        const messageId = key.id || apiMsg.id || apiMsg.messageId;
        
        if (messageId && existingIds.has(messageId)) continue;

        const content = extractContent(apiMsg);
        if (!content) continue;

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

        // Looser dedup - only check exact content+timestamp match
        const contentKey = `${content.substring(0, 30)}|${Math.floor(timestampMs / 10000)}`;
        if (existingContentTs.has(contentKey)) continue;

        newMessages.push({
          conversation_id: conversation.id,
          sender_type: key.fromMe ? 'agent' : 'user',
          content,
          created_at: timestamp,
          metadata: {
            external_id: messageId,
            messageId,
            remoteJid,
            fromMe: key.fromMe || false,
            instanceName,
            forceSynced: true
          }
        });

        existingIds.add(messageId);
        existingContentTs.add(contentKey);
      }

      console.log(`  📝 New messages to import: ${newMessages.length}`);

      if (newMessages.length > 0) {
        // Sort by timestamp
        newMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Insert in batches with upsert
        let inserted = 0;
        const batchSize = 20;
        
        for (let i = 0; i < newMessages.length; i += batchSize) {
          const batch = newMessages.slice(i, i + batchSize);
          
          // Try inserting each message individually to handle duplicates
          for (const msg of batch) {
            // Generate unique external_id if it already exists
            const { error } = await supabase.from('messages').insert({
              ...msg,
              metadata: {
                ...msg.metadata,
                messageId: `${msg.metadata.messageId}_${conversation.id.substring(0, 8)}`,
                external_id: `${msg.metadata.external_id}_${conversation.id.substring(0, 8)}`,
                originalMessageId: msg.metadata.messageId
              }
            });
            
            if (!error) {
              inserted++;
            } else if (error.code !== '23505') { // Not a duplicate key error
              console.log(`  ⚠️ Insert error: ${error.message}`);
            }
          }
        }

        // Update conversation timestamp
        const latestMsg = newMessages[newMessages.length - 1];
        await supabase
          .from('conversations')
          .update({ updated_at: latestMsg.created_at })
          .eq('id', conversation.id);

        console.log(`  ✅ Inserted ${inserted} messages`);
        results.push({ 
          phone, 
          name: conversation.contacts?.name,
          status: 'synced', 
          messages: inserted,
          apiTotal: apiMessages.length,
          existingTotal: existingMsgs?.length || 0
        });
      } else {
        results.push({ 
          phone, 
          name: conversation.contacts?.name,
          status: 'already_synced', 
          messages: 0,
          apiTotal: apiMessages.length,
          existingTotal: existingMsgs?.length || 0
        });
      }
    }

    console.log('\n✅ FORCE SYNC COMPLETE');
    console.log(JSON.stringify(results, null, 2));

    return new Response(JSON.stringify({ success: true, results }), {
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
  
  if (message.imageMessage) return message.imageMessage.caption || '[Imagem]';
  if (message.videoMessage) return message.videoMessage.caption || '[Vídeo]';
  if (message.audioMessage) return '[Áudio]';
  if (message.documentMessage) {
    const fileName = message.documentMessage.fileName || 'documento';
    return `[Documento: ${fileName}]`;
  }
  if (message.stickerMessage) return '[Figurinha]';
  if (message.contactMessage) return '[Contato]';
  if (message.locationMessage) return '[Localização]';
  if (message.reactionMessage) return message.reactionMessage.text || '👍';
  
  // Try text field directly
  if (msg.text) return msg.text;
  if (msg.body) return msg.body;
  if (msg.content && typeof msg.content === 'string') return msg.content;
  
  return '';
}
