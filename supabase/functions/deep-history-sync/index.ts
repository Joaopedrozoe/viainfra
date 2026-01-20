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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://evolution.viainfra.tec.br';
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
    const INSTANCE_NAME = 'VIAINFRAOFICIAL';
    
    const body = await req.json().catch(() => ({}));
    const { 
      limit = 50,           // Conversations to process per call
      messageLimit = 500,   // Messages per conversation
      offset = 0,
      conversationId = null // Process specific conversation
    } = body;

    console.log(`[deep-history-sync] Starting - limit: ${limit}, messageLimit: ${messageLimit}, offset: ${offset}`);

    // Get company ID for VIAINFRA
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', INSTANCE_NAME)
      .single();

    const companyId = instance?.company_id;
    if (!companyId) {
      throw new Error('Company not found for instance');
    }

    // Get conversations to process (ordered by most recent first)
    let conversationsQuery = supabase
      .from('conversations')
      .select(`
        id,
        contact_id,
        metadata,
        updated_at,
        contacts!inner(id, name, phone, metadata)
      `)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp')
      .order('updated_at', { ascending: false });

    if (conversationId) {
      conversationsQuery = conversationsQuery.eq('id', conversationId);
    } else {
      conversationsQuery = conversationsQuery.range(offset, offset + limit - 1);
    }

    const { data: conversations, error: convError } = await conversationsQuery;

    if (convError) {
      throw convError;
    }

    console.log(`[deep-history-sync] Processing ${conversations?.length || 0} conversations`);

    const results: any[] = [];
    let totalMessagesImported = 0;

    for (const conv of conversations || []) {
      const contact = conv.contacts;
      
      // Determine remoteJid from metadata or phone
      let remoteJid = conv.metadata?.remoteJid;
      
      if (!remoteJid && contact?.phone) {
        const cleanPhone = contact.phone.replace(/\D/g, '');
        remoteJid = `${cleanPhone}@s.whatsapp.net`;
      }
      
      if (!remoteJid && contact?.metadata?.remoteJid) {
        remoteJid = contact.metadata.remoteJid;
      }

      if (!remoteJid) {
        results.push({
          conversationId: conv.id,
          contactName: contact?.name,
          status: 'skipped',
          reason: 'No remoteJid available'
        });
        continue;
      }

      console.log(`[deep-history-sync] Syncing: ${contact?.name} (${remoteJid})`);

      // Get existing message IDs to avoid duplicates
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('metadata')
        .eq('conversation_id', conv.id);

      const existingIds = new Set(
        (existingMessages || [])
          .map(m => m.metadata?.messageId || m.metadata?.id?.id)
          .filter(Boolean)
      );

      // Fetch messages from Evolution API - try multiple endpoints
      let apiMessages: any[] = [];
      
      // Try fetchMessages first (better for history)
      try {
        const fetchUrl = `${EVOLUTION_API_URL}/chat/fetchMessages/${INSTANCE_NAME}`;
        const fetchResponse = await fetch(fetchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
          },
          body: JSON.stringify({
            where: { key: { remoteJid } },
            limit: messageLimit
          })
        });
        
        if (fetchResponse.ok) {
          const result = await fetchResponse.json();
          if (Array.isArray(result)) {
            apiMessages = result;
          } else if (result?.messages) {
            apiMessages = result.messages;
          }
        }
      } catch (e) {
        console.log(`[deep-history-sync] fetchMessages failed for ${remoteJid}:`, e);
      }

      // If fetchMessages didn't work, try findMessages
      if (apiMessages.length === 0) {
        try {
          const findUrl = `${EVOLUTION_API_URL}/chat/findMessages/${INSTANCE_NAME}`;
          const findResponse = await fetch(findUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY
            },
            body: JSON.stringify({
              where: { key: { remoteJid } },
              limit: messageLimit
            })
          });
          
          if (findResponse.ok) {
            const result = await findResponse.json();
            if (Array.isArray(result)) {
              apiMessages = result;
            } else if (result?.messages) {
              apiMessages = result.messages;
            }
          }
        } catch (e) {
          console.log(`[deep-history-sync] findMessages failed for ${remoteJid}:`, e);
        }
      }

      // Ensure apiMessages is an array
      if (!Array.isArray(apiMessages)) {
        apiMessages = [];
      }

      console.log(`[deep-history-sync] ${contact?.name}: Got ${apiMessages.length} messages from API`);

      // Filter to only new messages
      const newMessages = apiMessages.filter(msg => {
        const msgId = msg.key?.id || msg.id?.id || msg.messageId;
        return msgId && !existingIds.has(msgId);
      });

      console.log(`[deep-history-sync] ${contact?.name}: ${newMessages.length} new messages to import`);

      // Process and insert new messages
      let importedCount = 0;
      let latestTimestamp: Date | null = null;

      for (const msg of newMessages) {
        try {
          const content = extractContent(msg);
          if (!content) continue;

          const msgId = msg.key?.id || msg.id?.id || msg.messageId;
          const timestamp = msg.messageTimestamp 
            ? new Date(Number(msg.messageTimestamp) * 1000)
            : new Date();
          
          const fromMe = msg.key?.fromMe || msg.fromMe || false;
          const senderType = fromMe ? 'user' : 'contact';

          // Update latest timestamp
          if (!latestTimestamp || timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
          }

          const messageData = {
            conversation_id: conv.id,
            content,
            sender_type: senderType,
            created_at: timestamp.toISOString(),
            metadata: {
              messageId: msgId,
              fromMe,
              remoteJid,
              pushName: msg.pushName,
              messageType: msg.messageType || getMessageType(msg),
              importedAt: new Date().toISOString(),
              source: 'deep-history-sync'
            }
          };

          const { error: insertError } = await supabase
            .from('messages')
            .insert(messageData);

          if (!insertError) {
            importedCount++;
            totalMessagesImported++;
          }
        } catch (e) {
          console.log(`[deep-history-sync] Error inserting message:`, e);
        }
      }

      // Update conversation updated_at if we found newer messages
      if (latestTimestamp && importedCount > 0) {
        const currentUpdatedAt = new Date(conv.updated_at);
        if (latestTimestamp > currentUpdatedAt) {
          await supabase
            .from('conversations')
            .update({ 
              updated_at: latestTimestamp.toISOString(),
              metadata: {
                ...conv.metadata,
                remoteJid,
                lastSyncedAt: new Date().toISOString()
              }
            })
            .eq('id', conv.id);
        }
      }

      results.push({
        conversationId: conv.id,
        contactName: contact?.name,
        remoteJid,
        existingMessages: existingIds.size,
        apiMessages: apiMessages.length,
        newMessages: newMessages.length,
        imported: importedCount,
        latestTimestamp: latestTimestamp?.toISOString()
      });
    }

    console.log(`[deep-history-sync] Complete - Total imported: ${totalMessagesImported}`);

    return new Response(JSON.stringify({
      success: true,
      processed: conversations?.length || 0,
      totalImported: totalMessagesImported,
      offset,
      nextOffset: offset + limit,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[deep-history-sync] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractContent(msg: any): string {
  if (msg.message?.conversation) return msg.message.conversation;
  if (msg.message?.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  if (msg.message?.imageMessage?.caption) return `[Imagem] ${msg.message.imageMessage.caption}`;
  if (msg.message?.imageMessage) return '[Imagem]';
  if (msg.message?.videoMessage?.caption) return `[Vídeo] ${msg.message.videoMessage.caption}`;
  if (msg.message?.videoMessage) return '[Vídeo]';
  if (msg.message?.audioMessage) return '[Áudio]';
  if (msg.message?.documentMessage?.fileName) return `[Documento] ${msg.message.documentMessage.fileName}`;
  if (msg.message?.documentMessage) return '[Documento]';
  if (msg.message?.stickerMessage) return '[Figurinha]';
  if (msg.message?.contactMessage) return '[Contato]';
  if (msg.message?.locationMessage) return '[Localização]';
  if (msg.message?.buttonsResponseMessage?.selectedButtonId) return msg.message.buttonsResponseMessage.selectedDisplayText || '[Resposta de botão]';
  if (msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId) return msg.message.listResponseMessage.title || '[Resposta de lista]';
  if (msg.message?.reactionMessage) return `[Reação: ${msg.message.reactionMessage.text}]`;
  if (msg.content) return msg.content;
  if (msg.body) return msg.body;
  return '';
}

function getMessageType(msg: any): string {
  if (msg.message?.conversation || msg.message?.extendedTextMessage) return 'text';
  if (msg.message?.imageMessage) return 'image';
  if (msg.message?.videoMessage) return 'video';
  if (msg.message?.audioMessage) return 'audio';
  if (msg.message?.documentMessage) return 'document';
  if (msg.message?.stickerMessage) return 'sticker';
  if (msg.message?.contactMessage) return 'contact';
  if (msg.message?.locationMessage) return 'location';
  return 'unknown';
}
