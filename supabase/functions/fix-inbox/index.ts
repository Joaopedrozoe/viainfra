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

  try {
    const body = await req.json();
    const { 
      instanceName, 
      deleteWrongConversations = [], 
      forceUpdateJids = [],
      importLidToConversation = null // { lidJid: "xxx@lid", targetConversationId: "uuid" }
    } = body;
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'instanceName required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    const results: any = { deleted: [], synced: [], errors: [], debug: [] };

    // Step 1: Delete wrong conversations
    for (const convId of deleteWrongConversations) {
      try {
        console.log(`🗑️ Deleting conversation: ${convId}`);
        await supabase.from('messages').delete().eq('conversation_id', convId);
        await supabase.from('conversations').delete().eq('id', convId);
        results.deleted.push(convId);
      } catch (e) {
        results.errors.push({ convId, error: String(e) });
      }
    }

    // Step 2: Get company_id
    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord?.company_id) {
      return new Response(JSON.stringify({ error: 'Instance not found', results }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;

    // Step 3a: Import LID messages to existing conversation
    if (importLidToConversation) {
      const { lidJid, targetConversationId } = importLidToConversation;
      console.log(`\n📥 Importing messages from ${lidJid} to conversation ${targetConversationId}`);
      
      try {
        // Buscar mensagens do LID na API
        let messages: any[] = [];
        let currentPage = 1;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore && currentPage <= 10) {
          const resp = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
            method: 'POST',
            headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              where: { key: { remoteJid: lidJid } },
              limit: limit,
              page: currentPage
            })
          });
          
          if (!resp.ok) break;
          
          const data = await resp.json();
          let pageMessages: any[] = [];
          
          if (Array.isArray(data)) {
            pageMessages = data;
          } else if (data?.messages?.records && Array.isArray(data.messages.records)) {
            pageMessages = data.messages.records;
            hasMore = currentPage < (data.messages.pages || 1);
          } else if (Array.isArray(data?.messages)) {
            pageMessages = data.messages;
          }
          
          if (pageMessages.length === 0) {
            hasMore = false;
          } else {
            messages = [...messages, ...pageMessages];
            currentPage++;
          }
        }
        
        console.log(`   📨 ${messages.length} messages from LID`);
        
        // Pegar mensagens existentes no target
        const { data: existingMsgs } = await supabase
          .from('messages')
          .select('metadata, content, created_at')
          .eq('conversation_id', targetConversationId);
        
        const existingIds = new Set((existingMsgs || []).map((m: any) => m.metadata?.messageId).filter(Boolean));
        const existingContentTime = new Set((existingMsgs || []).map((m: any) => `${m.content}|${m.created_at}`));
        
        // Importar mensagens novas
        let imported = 0;
        let latestTimestamp = 0;
        
        for (const msg of messages) {
          const messageId = msg.key?.id;
          if (messageId && existingIds.has(messageId)) continue;
          
          const content = extractContent(msg);
          if (!content) continue;
          
          const timestamp = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now();
          const contentTimeKey = `${content}|${new Date(timestamp).toISOString()}`;
          
          // Skip se conteúdo + timestamp já existe
          if (existingContentTime.has(contentTimeKey)) continue;
          
          if (timestamp > latestTimestamp) latestTimestamp = timestamp;
          
          const senderType = msg.key?.fromMe ? 'agent' : 'user';
          
          const { error } = await supabase.from('messages').insert({
            conversation_id: targetConversationId,
            sender_type: senderType,
            content,
            created_at: new Date(timestamp).toISOString(),
            metadata: { messageId, remoteJid: lidJid, importedFromLid: true }
          });
          
          if (!error) imported++;
        }
        
        if (imported > 0 && latestTimestamp > 0) {
          await supabase.from('conversations').update({
            updated_at: new Date(latestTimestamp).toISOString()
          }).eq('id', targetConversationId);
        }
        
        results.synced.push({ lidJid, targetConversationId, imported });
        console.log(`   ✅ Imported ${imported} messages from LID`);
        
      } catch (e) {
        console.error(`   ❌ LID import error: ${e}`);
        results.errors.push({ lidJid, error: String(e) });
      }
    }

    // Step 3b: Force sync specific JIDs
    for (const jid of forceUpdateJids) {
      try {
        console.log(`\n🔄 Syncing: ${jid}`);
        
        // Buscar todas as mensagens com paginação
        let messages: any[] = [];
        let currentPage = 1;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore && currentPage <= 10) { // Max 10 páginas = 1000 mensagens
          const resp = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
            method: 'POST',
            headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              where: { key: { remoteJid: jid } },
              limit: limit,
              page: currentPage
            })
          });
          
          if (!resp.ok) {
            console.log(`   Page ${currentPage} failed: ${resp.status}`);
            break;
          }
          
          const data = await resp.json();
          
          let pageMessages: any[] = [];
          
          if (Array.isArray(data)) {
            pageMessages = data;
          } else if (data?.messages) {
            if (Array.isArray(data.messages)) {
              pageMessages = data.messages;
            } else if (data.messages?.records && Array.isArray(data.messages.records)) {
              pageMessages = data.messages.records;
              // Verificar se há mais páginas
              const totalPages = data.messages.pages || 1;
              hasMore = currentPage < totalPages;
            }
          } else if (data?.records && Array.isArray(data.records)) {
            pageMessages = data.records;
          }
          
          if (pageMessages.length === 0) {
            hasMore = false;
          } else {
            messages = [...messages, ...pageMessages];
            console.log(`   Page ${currentPage}: ${pageMessages.length} messages (total: ${messages.length})`);
            currentPage++;
          }
        }
        
        console.log(`   📨 Total: ${messages.length} messages from API`);

        // Format 2: Alternative if paged fetch failed
        if (messages.length === 0) {
          console.log(`   Trying alternative format...`);
          const phoneMatch = jid.match(/^(\d+)@/);
          if (phoneMatch) {
            const resp2 = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
              method: 'POST',
              headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                where: { remoteJid: jid },
                page: 1,
                offset: 100
              })
            });
            
            if (resp2.ok) {
              const data2 = await resp2.json();
              if (Array.isArray(data2)) {
                messages = data2;
              } else if (data2?.messages?.records) {
                messages = data2.messages.records;
              } else if (Array.isArray(data2?.messages)) {
                messages = data2.messages;
              }
              console.log(`   Alt format: ${messages.length} messages`);
            }
          }
        }

        if (messages.length === 0) {
          results.errors.push({ jid, error: 'No messages from API' });
          continue;
        }

        // Find existing conversation by JID
        let conv = null;
        
        // Try by metadata
        const { data: convByMeta } = await supabase
          .from('conversations')
          .select('id, contact_id')
          .eq('company_id', companyId)
          .contains('metadata', { remoteJid: jid })
          .maybeSingle();
        
        conv = convByMeta;

        // Try by phone if not found
        if (!conv) {
          const phoneMatch = jid.match(/^(\d+)@/);
          if (phoneMatch) {
            const phone = phoneMatch[1];
            
            const { data: allConvs } = await supabase
              .from('conversations')
              .select('id, contact_id, contacts!conversations_contact_id_fkey(phone)')
              .eq('company_id', companyId)
              .eq('channel', 'whatsapp');
            
            conv = allConvs?.find((c: any) => {
              const cPhone = c.contacts?.phone;
              if (!cPhone) return false;
              return cPhone === phone || cPhone === phone.slice(2) || '55' + cPhone === phone;
            });
          }
        }

        if (!conv) {
          results.errors.push({ jid, error: 'Conversation not found in DB' });
          continue;
        }

        // Get existing message IDs
        const { data: existingMsgs } = await supabase
          .from('messages')
          .select('metadata')
          .eq('conversation_id', conv.id);

        const existingIds = new Set(
          (existingMsgs || [])
            .map((m: any) => m.metadata?.messageId)
            .filter(Boolean)
        );

        // Import new messages
        let imported = 0;
        let latestTimestamp = 0;

        for (const msg of messages) {
          try {
            const messageId = msg.key?.id;
            if (!messageId || existingIds.has(messageId)) continue;

            const content = extractContent(msg);
            if (!content) continue;

            const timestamp = msg.messageTimestamp 
              ? Number(msg.messageTimestamp) * 1000 
              : Date.now();
            
            if (timestamp > latestTimestamp) latestTimestamp = timestamp;

            const senderType = msg.key?.fromMe ? 'agent' : 'user';

            const { error } = await supabase.from('messages').insert({
              conversation_id: conv.id,
              sender_type: senderType,
              content,
              created_at: new Date(timestamp).toISOString(),
              metadata: { messageId, remoteJid: jid }
            });

            if (!error) imported++;
          } catch (e) {
            // Skip individual message errors
          }
        }

        // Update conversation timestamp
        if (imported > 0 && latestTimestamp > 0) {
          await supabase.from('conversations').update({
            updated_at: new Date(latestTimestamp).toISOString()
          }).eq('id', conv.id);
        }

        results.synced.push({ jid, imported });
        console.log(`   ✅ Imported ${imported} new messages`);

      } catch (e) {
        console.error(`   ❌ Error: ${e}`);
        results.errors.push({ jid, error: String(e) });
      }
    }

    // Step 4: Global sync from chats list
    console.log(`\n📥 Global sync for ${instanceName}...`);
    
    try {
      const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 })
      });

      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        const chats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || []);
        
        console.log(`   📊 ${chats.length} chats found`);

        for (const chat of chats) {
          const jid = chat.remoteJid || chat.id || chat.jid;
          if (!jid || jid.includes('@lid') || jid.includes('@broadcast')) continue;

          // Skip if already synced
          if (results.synced.some((s: any) => s.jid === jid)) continue;

          // Find conversation
          const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', companyId)
            .contains('metadata', { remoteJid: jid })
            .maybeSingle();

          if (!conv) continue;

          // Get messages
          let messages: any[] = [];
          const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
            method: 'POST',
            headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              where: { key: { remoteJid: jid } },
              limit: 50
            })
          });

          if (messagesResponse.ok) {
            const data = await messagesResponse.json();
            if (Array.isArray(data)) {
              messages = data;
            } else if (data?.messages && Array.isArray(data.messages)) {
              messages = data.messages;
            }
          }

          if (messages.length === 0) continue;

          // Get existing message IDs
          const { data: existingMsgs } = await supabase
            .from('messages')
            .select('metadata')
            .eq('conversation_id', conv.id);

          const existingIds = new Set(
            (existingMsgs || [])
              .map((m: any) => m.metadata?.messageId)
              .filter(Boolean)
          );

          // Import new messages
          let imported = 0;
          let latestTimestamp = 0;

          for (const msg of messages) {
            try {
              const messageId = msg.key?.id;
              if (!messageId || existingIds.has(messageId)) continue;

              const content = extractContent(msg);
              if (!content) continue;

              const timestamp = msg.messageTimestamp 
                ? Number(msg.messageTimestamp) * 1000 
                : Date.now();
              
              if (timestamp > latestTimestamp) latestTimestamp = timestamp;

              const senderType = msg.key?.fromMe ? 'agent' : 'user';

              const { error } = await supabase.from('messages').insert({
                conversation_id: conv.id,
                sender_type: senderType,
                content,
                created_at: new Date(timestamp).toISOString(),
                metadata: { messageId, remoteJid: jid }
              });

              if (!error) imported++;
            } catch (e) {
              // Skip individual message errors
            }
          }

          if (imported > 0) {
            results.synced.push({ jid, imported });
            
            if (latestTimestamp > 0) {
              await supabase.from('conversations').update({
                updated_at: new Date(latestTimestamp).toISOString()
              }).eq('id', conv.id);
            }
          }
        }
      }
    } catch (e) {
      console.error(`Global sync error: ${e}`);
      results.errors.push({ global: String(e) });
    }

    console.log(`\n✅ Done!`);
    console.log(`   Deleted: ${results.deleted.length}`);
    console.log(`   Synced: ${results.synced.length}`);
    console.log(`   Errors: ${results.errors.length}`);

    return new Response(JSON.stringify(results), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

function extractContent(msg: any): string {
  const message = msg.message;
  if (!message) return '';

  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return `[Imagem] ${message.imageMessage.caption}`;
  if (message.imageMessage) return '[Imagem]';
  if (message.videoMessage?.caption) return `[Vídeo] ${message.videoMessage.caption}`;
  if (message.videoMessage) return '[Vídeo]';
  if (message.audioMessage) return '[Áudio de voz]';
  if (message.documentMessage) return `[Documento] ${message.documentMessage.fileName || 'arquivo'}`;
  if (message.stickerMessage) return '[Sticker]';
  if (message.contactMessage) return `[Contato] ${message.contactMessage.displayName || ''}`;
  if (message.locationMessage) return '[Localização]';
  if (message.reactionMessage) return '';

  return '';
}
