import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

/**
 * FULL HISTORY IMPORT - Backup-Style Restoration
 * 
 * Importa histórico completo da instância WhatsApp conectada:
 * 1. Sincroniza histórico de conversas existentes no inbox (mais recentes primeiro)
 * 2. Importa todos os contatos da instância
 * 3. Busca histórico de contatos sem conversa (armazena para uso futuro)
 * 4. Sincroniza fotos de perfil de todos os contatos
 * 
 * NÃO afeta o inbox: não cria conversas vazias, não desordena
 */

const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial'];
const MESSAGE_LIMIT_PER_CHAT = 2000; // Máximo de mensagens por conversa
const BATCH_SIZE = 20; // Processar em lotes

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { instanceName, phase = 'all' } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!ALLOWED_INSTANCES.includes(instanceName) && !ALLOWED_INSTANCES.includes(instanceName.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Instância não autorizada' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API configuration missing' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 FULL HISTORY IMPORT - BACKUP RESTORATION`);
    console.log(`   Instance: ${instanceName}`);
    console.log(`   Phase: ${phase}`);
    console.log(`   Started: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}\n`);

    // Get instance record
    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord?.company_id) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada no banco' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;
    console.log(`📍 Company ID: ${companyId}`);

    // Check connection
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionApiKey }
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({ error: 'Instância não acessível na Evolution API' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const statusData = await statusResponse.json();
    const connectionState = statusData?.instance?.state || statusData?.state;
    
    if (connectionState !== 'open' && connectionState !== 'connected') {
      return new Response(JSON.stringify({ error: `Instância não conectada: ${connectionState}` }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Stats tracking
    const stats = {
      phase1: { conversationsProcessed: 0, messagesImported: 0 },
      phase2: { contactsCreated: 0, contactsUpdated: 0, contactsSkipped: 0 },
      phase3: { contactsWithHistory: 0, messagesImported: 0 },
      phase4: { photosUpdated: 0 }
    };

    // ==========================================
    // PHASE 1: SYNC EXISTING INBOX CONVERSATIONS
    // ==========================================
    if (phase === 'all' || phase === '1') {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📥 PHASE 1: SYNC EXISTING INBOX CONVERSATIONS`);
      console.log(`${'─'.repeat(50)}`);
      
      // Get all existing WhatsApp conversations ordered by most recent first
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select(`
          id, 
          contact_id,
          metadata,
          updated_at,
          contacts!conversations_contact_id_fkey(id, name, phone, metadata)
        `)
        .eq('company_id', companyId)
        .eq('channel', 'whatsapp')
        .order('updated_at', { ascending: false });

      console.log(`   📊 Found ${existingConversations?.length || 0} existing conversations`);

      for (const conv of existingConversations || []) {
        const remoteJid = conv.metadata?.remoteJid || conv.contacts?.metadata?.remoteJid;
        
        if (!remoteJid) {
          console.log(`   ⚠️ Skipping conv ${conv.id} - no remoteJid`);
          continue;
        }

        try {
          // Fetch deep message history
          const messages = await fetchMessagesFromEvolution(
            evolutionApiUrl, 
            evolutionApiKey, 
            instanceName, 
            remoteJid, 
            MESSAGE_LIMIT_PER_CHAT
          );

          if (messages.length > 0) {
            const imported = await importMessages(supabase, conv.id, messages, remoteJid);
            stats.phase1.messagesImported += imported;
            
            if (imported > 0) {
              console.log(`   ✅ ${conv.contacts?.name || remoteJid}: +${imported} msgs (${messages.length} total)`);
            }
          }
          
          stats.phase1.conversationsProcessed++;
          
          // Update conversation metadata to ensure remoteJid and instanceName are present
          if (!conv.metadata?.remoteJid || !conv.metadata?.instanceName) {
            await supabase.from('conversations').update({
              metadata: { ...conv.metadata, remoteJid, instanceName }
            }).eq('id', conv.id);
          }

        } catch (err) {
          console.error(`   ❌ Error processing ${conv.contacts?.name || remoteJid}:`, err);
        }
      }

      console.log(`\n   📊 Phase 1 Complete:`);
      console.log(`      Conversations processed: ${stats.phase1.conversationsProcessed}`);
      console.log(`      Messages imported: ${stats.phase1.messagesImported}`);
    }

    // ==========================================
    // PHASE 2: IMPORT ALL CONTACTS FROM INSTANCE
    // ==========================================
    if (phase === 'all' || phase === '2') {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📥 PHASE 2: IMPORT ALL CONTACTS FROM INSTANCE`);
      console.log(`${'─'.repeat(50)}`);

      // Fetch contacts from Evolution API
      const apiContacts = await fetchAllContacts(evolutionApiUrl, evolutionApiKey, instanceName);
      console.log(`   📊 Found ${apiContacts.size} contacts in Evolution API`);

      // Get existing contacts
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('id, phone, name, metadata')
        .eq('company_id', companyId);

      const existingByPhone = new Map<string, any>();
      const existingByJid = new Map<string, any>();
      
      for (const c of existingContacts || []) {
        if (c.phone) {
          existingByPhone.set(c.phone, c);
          if (c.phone.startsWith('55')) existingByPhone.set(c.phone.slice(2), c);
          else if (c.phone.length >= 10) existingByPhone.set('55' + c.phone, c);
        }
        if (c.metadata?.remoteJid) {
          existingByJid.set(c.metadata.remoteJid, c);
        }
      }

      console.log(`   📊 Existing contacts in DB: ${existingContacts?.length || 0}`);

      // Process contacts
      for (const [jid, contact] of apiContacts) {
        try {
          // Skip groups for now (handled separately)
          if (contact.isGroup) continue;

          const phone = contact.phone;
          
          // Check if exists
          let existing = phone ? existingByPhone.get(phone) : null;
          if (!existing) existing = existingByJid.get(jid);

          if (existing) {
            // Update name if needed
            const needsUpdate = !existing.name || 
              /^\d+$/.test(existing.name) || 
              existing.name === 'Sem Nome';

            if (needsUpdate && contact.name && !/^\d+$/.test(contact.name)) {
              await supabase.from('contacts').update({
                name: contact.name,
                metadata: { ...existing.metadata, remoteJid: jid, pushName: contact.name }
              }).eq('id', existing.id);
              
              stats.phase2.contactsUpdated++;
            } else {
              stats.phase2.contactsSkipped++;
            }
          } else {
            // Create new contact
            const normalizedPhone = phone ? normalizePhone(phone) : null;
            
            const { error } = await supabase.from('contacts').insert({
              company_id: companyId,
              name: contact.name || normalizedPhone || 'Sem Nome',
              phone: normalizedPhone,
              metadata: {
                remoteJid: jid,
                pushName: contact.name,
                profilePictureUrl: contact.profilePictureUrl,
                importedAt: new Date().toISOString()
              }
            });

            if (!error) {
              stats.phase2.contactsCreated++;
            }
          }
        } catch (err) {
          console.error(`   ❌ Error processing contact ${jid}:`, err);
        }
      }

      console.log(`\n   📊 Phase 2 Complete:`);
      console.log(`      Contacts created: ${stats.phase2.contactsCreated}`);
      console.log(`      Contacts updated: ${stats.phase2.contactsUpdated}`);
      console.log(`      Contacts skipped: ${stats.phase2.contactsSkipped}`);
    }

    // ==========================================
    // PHASE 3: IMPORT HISTORY FOR CONTACTS WITHOUT INBOX CONVERSATION
    // ==========================================
    if (phase === 'all' || phase === '3') {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📥 PHASE 3: IMPORT HISTORY FOR CONTACTS WITHOUT CONVERSATION`);
      console.log(`${'─'.repeat(50)}`);

      // Get all contacts that have remoteJid but NO conversation
      const { data: contactsWithoutConversation } = await supabase
        .from('contacts')
        .select('id, name, phone, metadata')
        .eq('company_id', companyId)
        .not('metadata->remoteJid', 'is', null);

      // Get all conversation contact_ids
      const { data: conversations } = await supabase
        .from('conversations')
        .select('contact_id')
        .eq('company_id', companyId)
        .eq('channel', 'whatsapp');

      const contactsWithConversation = new Set((conversations || []).map(c => c.contact_id));

      const contactsToProcess = (contactsWithoutConversation || [])
        .filter(c => !contactsWithConversation.has(c.id));

      console.log(`   📊 Contacts without conversation: ${contactsToProcess.length}`);

      // Process in batches
      for (let i = 0; i < contactsToProcess.length; i += BATCH_SIZE) {
        const batch = contactsToProcess.slice(i, i + BATCH_SIZE);
        console.log(`   📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(contactsToProcess.length/BATCH_SIZE)}`);

        for (const contact of batch) {
          const remoteJid = contact.metadata?.remoteJid;
          if (!remoteJid || remoteJid.includes('@g.us')) continue;

          try {
            // Check if there are messages in Evolution API
            const messages = await fetchMessagesFromEvolution(
              evolutionApiUrl,
              evolutionApiKey,
              instanceName,
              remoteJid,
              MESSAGE_LIMIT_PER_CHAT
            );

            if (messages.length > 0) {
              // Create hidden conversation (archived) to store history
              const { data: newConv } = await supabase.from('conversations').insert({
                company_id: companyId,
                contact_id: contact.id,
                channel: 'whatsapp',
                status: 'resolved', // Not in active inbox
                archived: true, // Archived - won't show in inbox
                metadata: { 
                  remoteJid, 
                  instanceName,
                  historyImport: true,
                  importedAt: new Date().toISOString()
                }
              }).select('id').single();

              if (newConv) {
                const imported = await importMessages(supabase, newConv.id, messages, remoteJid);
                
                if (imported > 0) {
                  stats.phase3.contactsWithHistory++;
                  stats.phase3.messagesImported += imported;
                  console.log(`      ✅ ${contact.name}: +${imported} msgs (archived)`);
                } else {
                  // Remove empty conversation
                  await supabase.from('conversations').delete().eq('id', newConv.id);
                }
              }
            }
          } catch (err) {
            console.error(`   ❌ Error processing ${contact.name}:`, err);
          }
        }

        // Small delay between batches
        await new Promise(r => setTimeout(r, 200));
      }

      console.log(`\n   📊 Phase 3 Complete:`);
      console.log(`      Contacts with history: ${stats.phase3.contactsWithHistory}`);
      console.log(`      Messages imported: ${stats.phase3.messagesImported}`);
    }

    // ==========================================
    // PHASE 4: SYNC PROFILE PICTURES
    // ==========================================
    if (phase === 'all' || phase === '4') {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`📥 PHASE 4: SYNC PROFILE PICTURES`);
      console.log(`${'─'.repeat(50)}`);

      try {
        const syncResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-profile-pictures`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ companyId, forceUpdate: false, batchSize: 100 })
        });

        if (syncResponse.ok) {
          const result = await syncResponse.json();
          stats.phase4.photosUpdated = result.updated || 0;
          console.log(`   ✅ Profile pictures synced: ${stats.phase4.photosUpdated}`);
        }
      } catch (e) {
        console.log(`   ⚠️ Photo sync error: ${e}`);
      }
    }

    // ==========================================
    // FINAL: UPDATE ALL CONVERSATION TIMESTAMPS
    // ==========================================
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📥 FINAL: UPDATING CONVERSATION TIMESTAMPS`);
    console.log(`${'─'.repeat(50)}`);

    const { data: allConversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    let timestampsUpdated = 0;
    for (const conv of allConversations || []) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        await supabase.from('conversations')
          .update({ updated_at: lastMsg.created_at })
          .eq('id', conv.id);
        timestampsUpdated++;
      }
    }
    console.log(`   ✅ Updated timestamps for ${timestampsUpdated} conversations`);

    // Final summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ FULL HISTORY IMPORT COMPLETE`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Phase 1 - Inbox conversations: ${stats.phase1.conversationsProcessed}, msgs: ${stats.phase1.messagesImported}`);
    console.log(`   Phase 2 - Contacts: created=${stats.phase2.contactsCreated}, updated=${stats.phase2.contactsUpdated}`);
    console.log(`   Phase 3 - History for non-inbox: ${stats.phase3.contactsWithHistory} contacts, ${stats.phase3.messagesImported} msgs`);
    console.log(`   Phase 4 - Photos: ${stats.phase4.photosUpdated}`);
    console.log(`${'='.repeat(60)}\n`);

    return new Response(JSON.stringify({
      success: true,
      duration: `${duration}s`,
      stats,
      message: `Import complete: ${stats.phase1.messagesImported + stats.phase3.messagesImported} messages imported`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal error',
      details: String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function fetchAllContacts(
  apiUrl: string, 
  apiKey: string, 
  instanceName: string
): Promise<Map<string, any>> {
  const contacts = new Map<string, any>();

  // Method 1: findContacts
  try {
    const response = await fetch(`${apiUrl}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data?.contacts || []);
      
      for (const c of list) {
        const jid = c.id || c.jid || c.remoteJid;
        if (!jid || jid.includes('@broadcast') || jid.includes('status@')) continue;
        
        const phone = extractPhone(jid);
        contacts.set(jid, {
          jid,
          phone,
          name: c.pushName || c.name || c.verifiedName || c.notify || phone || jid.split('@')[0],
          profilePictureUrl: c.profilePictureUrl || c.imgUrl,
          isGroup: jid.includes('@g.us')
        });
      }
    }
  } catch (e) {
    console.log('   ⚠️ findContacts failed:', e);
  }

  // Method 2: findChats (may have additional contacts)
  try {
    const response = await fetch(`${apiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 1000 })
    });
    
    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data?.chats || []);
      
      for (const c of list) {
        const jid = c.id || c.jid || c.remoteJid;
        if (!jid || jid.includes('@broadcast') || jid.includes('status@')) continue;
        if (contacts.has(jid)) continue;
        
        const phone = extractPhone(jid);
        contacts.set(jid, {
          jid,
          phone,
          name: c.name || c.pushName || c.subject || phone || jid.split('@')[0],
          profilePictureUrl: c.profilePictureUrl,
          isGroup: jid.includes('@g.us')
        });
      }
    }
  } catch (e) {
    console.log('   ⚠️ findChats failed:', e);
  }

  return contacts;
}

async function fetchMessagesFromEvolution(
  apiUrl: string,
  apiKey: string,
  instanceName: string,
  jid: string,
  limit: number
): Promise<any[]> {
  const attempts = [
    { where: { key: { remoteJid: jid } }, limit },
    { where: { remoteJid: jid }, limit },
    { remoteJid: jid, limit }
  ];

  for (const body of attempts) {
    try {
      const response = await fetch(`${apiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) continue;

      const data = await response.json();
      let messages: any[] = [];
      
      if (Array.isArray(data?.messages)) messages = data.messages;
      else if (Array.isArray(data?.messages?.records)) messages = data.messages.records;
      else if (Array.isArray(data?.records)) messages = data.records;
      else if (Array.isArray(data)) messages = data;
      
      if (messages.length > 0) return messages;
    } catch (err) { /* continue */ }
  }
  
  return [];
}

async function importMessages(
  supabase: any,
  conversationId: string,
  messages: any[],
  jid: string
): Promise<number> {
  try {
    // Get existing message IDs for this conversation
    const { data: existingMsgs } = await supabase.from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);
    
    const existingIds = new Set(
      (existingMsgs || []).map((m: any) => m.metadata?.messageId).filter(Boolean)
    );

    // Sort messages chronologically
    const sorted = [...messages].sort((a, b) => {
      return Number(a.messageTimestamp || 0) - Number(b.messageTimestamp || 0);
    });

    const toInsert: any[] = [];

    for (const msg of sorted) {
      const messageId = msg.key?.id || msg.id;
      if (!messageId || existingIds.has(messageId)) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const fromMe = msg.key?.fromMe === true;
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      toInsert.push({
        conversation_id: conversationId,
        sender_type: fromMe ? 'agent' : 'user',
        content,
        created_at: timestamp,
        metadata: { 
          messageId, 
          fromMe, 
          remoteJid: jid,
          syncedAt: new Date().toISOString(),
          ...extractAttachment(msg)
        }
      });

      existingIds.add(messageId);
    }

    // Insert in batches
    if (toInsert.length > 0) {
      for (let i = 0; i < toInsert.length; i += 50) {
        const chunk = toInsert.slice(i, i + 50);
        try {
          const { error } = await supabase.from('messages').insert(chunk);
          if (error && error.code !== '23505') {
            console.error(`   Insert error:`, error);
          }
        } catch (e: any) {
          if (e.code !== '23505') console.error(`   Insert exception:`, e);
        }
      }
    }

    return toInsert.length;
  } catch (err) {
    console.error(`   Import error:`, err);
    return 0;
  }
}

function extractPhone(jid: string): string | null {
  if (!jid) return null;
  if (jid.includes('@g.us')) return null;
  if (jid.includes('@lid')) return null;
  
  const match = jid.match(/^(\d+)@/);
  return match ? match[1] : null;
}

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  
  if (normalized.length === 10 || normalized.length === 11) {
    normalized = '55' + normalized;
  }
  
  return normalized;
}

function extractContent(msg: any): string {
  const m = msg.message || msg;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `📷 ${m.imageMessage.caption}`;
  if (m.imageMessage) return '📷 Imagem';
  if (m.videoMessage?.caption) return `🎬 ${m.videoMessage.caption}`;
  if (m.videoMessage) return '🎬 Vídeo';
  if (m.audioMessage) return '🎵 Áudio';
  if (m.documentMessage?.fileName) return `📄 ${m.documentMessage.fileName}`;
  if (m.documentMessage) return '📄 Documento';
  if (m.stickerMessage) return '🎨 Sticker';
  if (m.locationMessage) return '📍 Localização';
  if (m.contactMessage) return '👤 Contato';
  if (m.reactionMessage) return `${m.reactionMessage.text || '👍'}`;
  if (m.pollCreationMessage) return `📊 ${m.pollCreationMessage.name || 'Enquete'}`;
  return '';
}

function extractAttachment(msg: any): any {
  const m = msg.message || msg;
  if (m.imageMessage) return { attachment: { type: 'image', mimetype: m.imageMessage.mimetype, hasMedia: true } };
  if (m.videoMessage) return { attachment: { type: 'video', mimetype: m.videoMessage.mimetype, hasMedia: true } };
  if (m.audioMessage) return { attachment: { type: 'audio', mimetype: m.audioMessage.mimetype, ptt: m.audioMessage.ptt, hasMedia: true } };
  if (m.documentMessage) return { attachment: { type: 'document', mimetype: m.documentMessage.mimetype, fileName: m.documentMessage.fileName, hasMedia: true } };
  return {};
}
