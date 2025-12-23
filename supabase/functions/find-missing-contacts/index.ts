import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Find contacts that exist in WhatsApp but are missing in the CRM
 * Search by name to identify missing conversations
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 FIND MISSING CONTACTS - Buscando contatos faltantes');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const { 
      instanceName = 'VIAINFRAOFICIAL',
      searchNames = ['Yago', 'Flávia Financeiro'],
      companyId = 'da17735c-5a76-4797-b338-f6e63a7b3f8b',
      createMissing = false
    } = await req.json().catch(() => ({}));

    console.log(`🔍 Buscando: ${searchNames.join(', ')}`);

    // Fetch ALL chats from Evolution API
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error(`Evolution API error: ${chatsResponse.status}`);
    }

    const allChats = await chatsResponse.json();
    console.log(`📊 Total de chats na Evolution API: ${allChats.length}`);

    // Get existing conversations from DB
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id, contacts(id, name, phone)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    const existingJids = new Set<string>();
    for (const conv of existingConvs || []) {
      const jid = conv.metadata?.remoteJid;
      if (jid) existingJids.add(jid);
    }

    // Search for the specified names in Evolution API
    const found: any[] = [];
    const missing: any[] = [];

    for (const chat of allChats) {
      const remoteJid = chat.id || chat.remoteJid || chat.jid;
      const chatName = (chat.name || chat.pushName || chat.notify || '').toLowerCase();
      
      for (const searchName of searchNames) {
        if (chatName.includes(searchName.toLowerCase())) {
          const existsInCRM = existingJids.has(remoteJid);
          
          const info = {
            name: chat.name || chat.pushName || chat.notify,
            remoteJid,
            phone: remoteJid?.split('@')[0] || null,
            lastMsgTimestamp: chat.lastMsgTimestamp,
            existsInCRM,
            searchTerm: searchName
          };
          
          if (existsInCRM) {
            found.push(info);
          } else {
            missing.push(info);
          }
          
          console.log(`${existsInCRM ? '✅' : '❌'} ${info.name} (${remoteJid})`);
        }
      }
    }

    // If createMissing is true, create the missing conversations
    const created: any[] = [];
    
    if (createMissing && missing.length > 0) {
      console.log('\n📝 Criando conversas faltantes...');
      
      for (const m of missing) {
        const isLid = m.remoteJid?.includes('@lid');
        const isGroup = m.remoteJid?.includes('@g.us');
        const phone = (!isLid && !isGroup) ? m.remoteJid?.split('@')[0] : null;
        
        // Create contact
        const { data: newContact, error: contactErr } = await supabase
          .from('contacts')
          .insert({
            name: m.name,
            phone: phone,
            company_id: companyId,
            metadata: {
              remoteJid: m.remoteJid,
              isLid,
              isGroup,
              foundMissing: true,
              createdAt: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (contactErr) {
          console.log(`  ⚠️ Erro criando contato ${m.name}: ${contactErr.message}`);
          continue;
        }

        // Create conversation
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            contact_id: newContact.id,
            company_id: companyId,
            channel: 'whatsapp',
            status: 'open',
            bot_active: false,
            metadata: {
              remoteJid: m.remoteJid,
              instanceName,
              isLid,
              isGroup,
              foundMissing: true,
              createdAt: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (convErr) {
          console.log(`  ⚠️ Erro criando conversa ${m.name}: ${convErr.message}`);
          continue;
        }

        // Import recent messages
        const msgResp = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            where: { key: { remoteJid: m.remoteJid } },
            limit: 50
          })
        });

        let messagesImported = 0;
        if (msgResp.ok) {
          const msgData = await msgResp.json();
          const messages = Array.isArray(msgData) ? msgData : (msgData.messages || []);
          
          for (const msg of messages) {
            const key = msg.key || {};
            const content = extractContent(msg);
            if (!content) continue;

            const ts = Number(msg.messageTimestamp || 0);
            const timestamp = ts > 0 
              ? new Date(ts > 1e12 ? ts : ts * 1000).toISOString()
              : new Date().toISOString();

            await supabase.from('messages').insert({
              conversation_id: newConv.id,
              sender_type: key.fromMe ? 'agent' : 'user',
              content,
              created_at: timestamp,
              metadata: {
                external_id: key.id,
                remoteJid: m.remoteJid,
                fromMe: key.fromMe || false
              }
            });
            messagesImported++;
          }

          // Update conversation timestamp
          if (messagesImported > 0) {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('created_at')
              .eq('conversation_id', newConv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastMsg) {
              await supabase
                .from('conversations')
                .update({ updated_at: lastMsg.created_at })
                .eq('id', newConv.id);
            }
          }
        }

        created.push({
          name: m.name,
          remoteJid: m.remoteJid,
          phone,
          conversationId: newConv.id,
          messagesImported
        });
        
        console.log(`  ✅ Criado: ${m.name} (${messagesImported} msgs)`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalChatsInEvolution: allChats.length,
      searchNames,
      found,
      missing,
      created
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
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
  if (message.audioMessage) return '🎵 Áudio';
  if (message.stickerMessage) return '📷 Figurinha';
  if (message.documentMessage) return `📄 ${message.documentMessage.fileName || 'Documento'}`;
  if (message.contactMessage) return `👤 ${message.contactMessage.displayName || 'Contato'}`;
  if (message.locationMessage) return '📍 Localização';
  
  return '';
}
