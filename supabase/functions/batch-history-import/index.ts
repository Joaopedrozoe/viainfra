import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Batch sizes optimized to avoid timeout (60s limit)
const BATCH_CONFIG = {
  conversations: 30,    // Process 30 conversations per call
  contacts: 100,        // Import 100 contacts per call
  messagesPerConv: 50,  // Fetch 50 messages per conversation
  historyBatch: 20,     // Process 20 contact histories per call
};

interface ImportJob {
  id: string;
  company_id: string;
  instance_name: string;
  phase: string;
  total_items: number;
  processed_items: number;
  status: string;
  last_cursor: string | null;
  metadata: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { instanceName, action = 'start' } = body;
    // action: 'start' | 'continue' | 'status'

    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: 'instanceName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get company_id from instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', instanceName)
      .single();

    if (!instance) {
      return new Response(
        JSON.stringify({ error: 'Instance not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyId = instance.company_id;

    // Check for existing job or create new one
    let job: ImportJob;
    
    if (action === 'status') {
      const { data: existingJob } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('instance_name', instanceName)
        .eq('company_id', companyId)
        .in('status', ['running', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({
          hasActiveJob: !!existingJob,
          job: existingJob || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'start') {
      // Check for existing running job
      const { data: runningJob } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('instance_name', instanceName)
        .eq('status', 'running')
        .single();

      if (runningJob) {
        job = runningJob as ImportJob;
        console.log(`📌 Resuming existing job: ${job.id} at phase ${job.phase}`);
      } else {
        // Create new job
        const { data: newJob, error: createError } = await supabase
          .from('import_jobs')
          .insert({
            company_id: companyId,
            instance_name: instanceName,
            phase: 'messages',
            status: 'running',
            total_items: 0,
            processed_items: 0,
            metadata: {},
          })
          .select()
          .single();

        if (createError) throw createError;
        job = newJob as ImportJob;
        console.log(`🆕 Created new import job: ${job.id}`);
      }
    } else if (action === 'continue') {
      const { data: existingJob } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('instance_name', instanceName)
        .in('status', ['running', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!existingJob) {
        return new Response(
          JSON.stringify({ error: 'No active import job found. Start a new one.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      job = existingJob as ImportJob;
      
      // Resume if paused
      if (job.status === 'paused') {
        await supabase
          .from('import_jobs')
          .update({ status: 'running' })
          .eq('id', job.id);
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process based on current phase
    let result: any = {};
    let nextPhase = job.phase;
    let phaseComplete = false;

    console.log(`\n🔄 Processing phase: ${job.phase}`);
    console.log(`   Processed: ${job.processed_items}/${job.total_items}`);
    console.log(`   Cursor: ${job.last_cursor || 'none'}`);

    switch (job.phase) {
      case 'messages':
        result = await processMessagesPhase(
          supabase, evolutionUrl, evolutionKey, instanceName, companyId, job
        );
        if (result.phaseComplete) {
          nextPhase = 'contacts';
          phaseComplete = true;
        }
        break;

      case 'contacts':
        result = await processContactsPhase(
          supabase, evolutionUrl, evolutionKey, instanceName, companyId, job
        );
        if (result.phaseComplete) {
          nextPhase = 'history';
          phaseComplete = true;
        }
        break;

      case 'history':
        result = await processHistoryPhase(
          supabase, evolutionUrl, evolutionKey, instanceName, companyId, job
        );
        if (result.phaseComplete) {
          nextPhase = 'avatars';
          phaseComplete = true;
        }
        break;

      case 'avatars':
        result = await processAvatarsPhase(
          supabase, evolutionUrl, evolutionKey, instanceName, companyId, job
        );
        if (result.phaseComplete) {
          nextPhase = 'completed';
          phaseComplete = true;
        }
        break;

      case 'completed':
        return new Response(
          JSON.stringify({
            success: true,
            completed: true,
            message: 'Import already completed',
            job,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update job state
    const isFullyComplete = nextPhase === 'completed';
    
    await supabase
      .from('import_jobs')
      .update({
        phase: nextPhase,
        status: isFullyComplete ? 'completed' : (phaseComplete ? 'running' : 'paused'),
        total_items: result.totalItems ?? job.total_items,
        processed_items: phaseComplete ? 0 : (result.processedItems ?? job.processed_items),
        last_cursor: phaseComplete ? null : (result.cursor ?? job.last_cursor),
        metadata: {
          ...job.metadata,
          [`${job.phase}_result`]: result.summary,
          lastUpdate: new Date().toISOString(),
        },
      })
      .eq('id', job.id);

    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Batch completed in ${elapsed}ms`);
    console.log(`   Phase: ${job.phase} -> ${nextPhase}`);
    console.log(`   Items this batch: ${result.itemsProcessed || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        completed: isFullyComplete,
        phase: job.phase,
        nextPhase,
        phaseComplete,
        itemsProcessed: result.itemsProcessed || 0,
        totalItems: result.totalItems ?? job.total_items,
        processedItems: result.processedItems ?? job.processed_items,
        summary: result.summary,
        elapsedMs: elapsed,
        needsContinue: !isFullyComplete,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============ PHASE: MESSAGES ============
async function processMessagesPhase(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  companyId: string,
  job: ImportJob
) {
  const cursor = job.last_cursor ? parseInt(job.last_cursor) : 0;
  
  // Get conversations ordered by most recent
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, contact_id, metadata, updated_at')
    .eq('company_id', companyId)
    .eq('channel', 'whatsapp')
    .order('updated_at', { ascending: false })
    .range(cursor, cursor + BATCH_CONFIG.conversations - 1);

  if (error) throw error;

  if (!conversations || conversations.length === 0) {
    console.log('📭 No more conversations to process');
    return {
      phaseComplete: true,
      totalItems: job.total_items,
      processedItems: job.processed_items,
      summary: { messagesImported: 0 },
    };
  }

  // Get total count on first run
  let totalItems = job.total_items;
  if (cursor === 0) {
    const { count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');
    totalItems = count || 0;
  }

  let messagesImported = 0;

  for (const conv of conversations) {
    const remoteJid = conv.metadata?.remoteJid;
    if (!remoteJid) continue;

    try {
      // Fetch messages from Evolution API
      const messages = await fetchMessagesFromEvolution(
        evolutionUrl, evolutionKey, instanceName, remoteJid, BATCH_CONFIG.messagesPerConv
      );

      if (messages.length > 0) {
        // Get existing message IDs to avoid duplicates
        const messageIds = messages.map((m: any) => m.key?.id).filter(Boolean);
        const { data: existing } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conv.id)
          .in('id', messageIds);

        const existingIds = new Set((existing || []).map((e: any) => e.id));
        
        // Filter new messages
        const newMessages = messages
          .filter((m: any) => m.key?.id && !existingIds.has(m.key.id))
          .map((m: any) => ({
            id: m.key.id,
            conversation_id: conv.id,
            sender_type: m.key.fromMe ? 'agent' : 'user',
            content: extractContent(m.message) || '[Mídia]',
            created_at: new Date(m.messageTimestamp * 1000).toISOString(),
            metadata: {
              messageId: m.key.id,
              remoteJid: m.key.remoteJid,
              pushName: m.pushName,
              messageType: getMessageType(m.message),
              attachment: extractAttachment(m.message),
            },
          }));

        if (newMessages.length > 0) {
          const { error: insertError } = await supabase
            .from('messages')
            .upsert(newMessages, { onConflict: 'id', ignoreDuplicates: true });

          if (!insertError) {
            messagesImported += newMessages.length;
          }
        }
      }
    } catch (e) {
      console.error(`Error fetching messages for ${remoteJid}:`, e);
    }
  }

  const newProcessed = cursor + conversations.length;
  const isComplete = conversations.length < BATCH_CONFIG.conversations;

  console.log(`📨 Messages phase: ${messagesImported} imported, ${newProcessed}/${totalItems} conversations`);

  return {
    phaseComplete: isComplete,
    totalItems,
    processedItems: newProcessed,
    cursor: isComplete ? null : String(newProcessed),
    itemsProcessed: messagesImported,
    summary: { messagesImported, conversationsProcessed: conversations.length },
  };
}

// ============ PHASE: CONTACTS ============
async function processContactsPhase(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  companyId: string,
  job: ImportJob
) {
  // Fetch all contacts from Evolution on first run
  if (job.processed_items === 0) {
    console.log('📥 Fetching all contacts from Evolution API...');
  }

  const allContacts = await fetchAllContactsFromEvolution(evolutionUrl, evolutionKey, instanceName);
  const totalItems = allContacts.length;
  
  console.log(`📇 Total contacts from Evolution: ${totalItems}`);

  const cursor = job.last_cursor ? parseInt(job.last_cursor) : 0;
  const batch = allContacts.slice(cursor, cursor + BATCH_CONFIG.contacts);

  if (batch.length === 0) {
    return {
      phaseComplete: true,
      totalItems,
      processedItems: totalItems,
      summary: { contactsProcessed: 0 },
    };
  }

  // Get existing contacts by phone
  const phones = batch.map((c: any) => normalizePhone(c.id?.replace(/@.*/, '') || '')).filter(Boolean);
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('id, phone')
    .eq('company_id', companyId)
    .in('phone', phones);

  const existingPhones = new Set((existingContacts || []).map((c: any) => c.phone));

  let contactsCreated = 0;
  let contactsUpdated = 0;

  for (const contact of batch) {
    const phone = normalizePhone(contact.id?.replace(/@.*/, '') || '');
    if (!phone || phone.length < 10) continue;

    const name = contact.pushName || contact.name || phone;
    const remoteJid = contact.id;

    if (existingPhones.has(phone)) {
      // Update existing contact
      await supabase
        .from('contacts')
        .update({
          name: name !== phone ? name : undefined,
          metadata: { remoteJid, pushName: contact.pushName },
          updated_at: new Date().toISOString(),
        })
        .eq('company_id', companyId)
        .eq('phone', phone);
      contactsUpdated++;
    } else {
      // Create new contact
      const { error } = await supabase
        .from('contacts')
        .insert({
          company_id: companyId,
          name,
          phone,
          metadata: { remoteJid, pushName: contact.pushName, source: 'evolution_import' },
        });
      
      if (!error) {
        contactsCreated++;
        existingPhones.add(phone);
      }
    }
  }

  const newProcessed = cursor + batch.length;
  const isComplete = batch.length < BATCH_CONFIG.contacts || newProcessed >= totalItems;

  console.log(`📇 Contacts phase: ${contactsCreated} created, ${contactsUpdated} updated`);

  return {
    phaseComplete: isComplete,
    totalItems,
    processedItems: newProcessed,
    cursor: isComplete ? null : String(newProcessed),
    itemsProcessed: contactsCreated + contactsUpdated,
    summary: { contactsCreated, contactsUpdated },
  };
}

// ============ PHASE: HISTORY ============
async function processHistoryPhase(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  companyId: string,
  job: ImportJob
) {
  // Get contacts without active conversations
  const cursor = job.last_cursor ? parseInt(job.last_cursor) : 0;

  // First, get contacts with remoteJid that don't have conversations
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, name, phone, metadata')
    .eq('company_id', companyId)
    .not('metadata->remoteJid', 'is', null)
    .order('created_at', { ascending: false })
    .range(cursor, cursor + BATCH_CONFIG.historyBatch - 1);

  if (error) throw error;

  if (!contacts || contacts.length === 0) {
    return {
      phaseComplete: true,
      summary: { historiesImported: 0 },
    };
  }

  // Get total count on first run
  let totalItems = job.total_items;
  if (cursor === 0) {
    const { count } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('metadata->remoteJid', 'is', null);
    totalItems = count || 0;
  }

  // Check which contacts already have conversations
  const contactIds = contacts.map((c: any) => c.id);
  const { data: existingConvs } = await supabase
    .from('conversations')
    .select('contact_id')
    .eq('company_id', companyId)
    .in('contact_id', contactIds);

  const hasConversation = new Set((existingConvs || []).map((c: any) => c.contact_id));

  let historiesImported = 0;
  let conversationsCreated = 0;

  for (const contact of contacts) {
    if (hasConversation.has(contact.id)) continue;

    const remoteJid = contact.metadata?.remoteJid;
    if (!remoteJid) continue;

    try {
      // Fetch messages for this contact
      const messages = await fetchMessagesFromEvolution(
        evolutionUrl, evolutionKey, instanceName, remoteJid, BATCH_CONFIG.messagesPerConv
      );

      if (messages.length > 0) {
        // Create archived conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            company_id: companyId,
            contact_id: contact.id,
            channel: 'whatsapp',
            status: 'closed',
            archived: true,
            metadata: { remoteJid, source: 'history_import' },
          })
          .select()
          .single();

        if (convError) {
          console.error(`Error creating conversation for ${contact.name}:`, convError);
          continue;
        }

        conversationsCreated++;

        // Import messages
        const messagesToInsert = messages.map((m: any) => ({
          id: m.key?.id || crypto.randomUUID(),
          conversation_id: newConv.id,
          sender_type: m.key?.fromMe ? 'agent' : 'user',
          content: extractContent(m.message) || '[Mídia]',
          created_at: new Date(m.messageTimestamp * 1000).toISOString(),
          metadata: {
            messageId: m.key?.id,
            remoteJid: m.key?.remoteJid,
            pushName: m.pushName,
          },
        }));

        const { error: msgError } = await supabase
          .from('messages')
          .upsert(messagesToInsert, { onConflict: 'id', ignoreDuplicates: true });

        if (!msgError) {
          historiesImported += messagesToInsert.length;
        }

        // Update conversation timestamp
        const latestMsg = messages.reduce((a: any, b: any) => 
          (a.messageTimestamp || 0) > (b.messageTimestamp || 0) ? a : b
        );
        if (latestMsg?.messageTimestamp) {
          await supabase
            .from('conversations')
            .update({ updated_at: new Date(latestMsg.messageTimestamp * 1000).toISOString() })
            .eq('id', newConv.id);
        }
      }
    } catch (e) {
      console.error(`Error processing history for ${contact.name}:`, e);
    }
  }

  const newProcessed = cursor + contacts.length;
  const isComplete = contacts.length < BATCH_CONFIG.historyBatch;

  console.log(`📜 History phase: ${historiesImported} messages, ${conversationsCreated} convs created`);

  return {
    phaseComplete: isComplete,
    totalItems,
    processedItems: newProcessed,
    cursor: isComplete ? null : String(newProcessed),
    itemsProcessed: historiesImported,
    summary: { historiesImported, conversationsCreated },
  };
}

// ============ PHASE: AVATARS ============
async function processAvatarsPhase(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  companyId: string,
  job: ImportJob
) {
  // Get contacts without avatar
  const cursor = job.last_cursor ? parseInt(job.last_cursor) : 0;
  const batchSize = 50;

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, phone, metadata')
    .eq('company_id', companyId)
    .or('avatar_url.is.null,avatar_url.eq.')
    .not('phone', 'is', null)
    .order('updated_at', { ascending: false })
    .range(cursor, cursor + batchSize - 1);

  if (error) throw error;

  if (!contacts || contacts.length === 0) {
    return {
      phaseComplete: true,
      summary: { avatarsUpdated: 0 },
    };
  }

  // Get total count on first run
  let totalItems = job.total_items;
  if (cursor === 0) {
    const { count } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .or('avatar_url.is.null,avatar_url.eq.')
      .not('phone', 'is', null);
    totalItems = count || 0;
  }

  let avatarsUpdated = 0;

  for (const contact of contacts) {
    const remoteJid = contact.metadata?.remoteJid || `${contact.phone}@s.whatsapp.net`;
    
    try {
      const response = await fetch(`${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({ number: remoteJid }),
      });

      if (response.ok) {
        const data = await response.json();
        const pictureUrl = data.profilePictureUrl || data.picture || data.url;
        
        if (pictureUrl) {
          await supabase
            .from('contacts')
            .update({ avatar_url: pictureUrl })
            .eq('id', contact.id);
          avatarsUpdated++;
        }
      }
    } catch (e) {
      // Ignore individual avatar failures
    }
  }

  const newProcessed = cursor + contacts.length;
  const isComplete = contacts.length < batchSize;

  console.log(`🖼️ Avatars phase: ${avatarsUpdated} updated`);

  return {
    phaseComplete: isComplete,
    totalItems,
    processedItems: newProcessed,
    cursor: isComplete ? null : String(newProcessed),
    itemsProcessed: avatarsUpdated,
    summary: { avatarsUpdated },
  };
}

// ============ HELPER FUNCTIONS ============

async function fetchMessagesFromEvolution(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  remoteJid: string,
  limit: number
): Promise<any[]> {
  const endpoints = [
    { url: `${evolutionUrl}/chat/findMessages/${instanceName}`, body: { where: { key: { remoteJid } }, limit } },
    { url: `${evolutionUrl}/message/findMessages/${instanceName}`, body: { where: { key: { remoteJid } }, limit } },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
        body: JSON.stringify(endpoint.body),
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || data || [];
        if (Array.isArray(messages) && messages.length > 0) {
          return messages;
        }
      }
    } catch (e) {
      console.error(`Endpoint failed: ${endpoint.url}`);
    }
  }

  return [];
}

async function fetchAllContactsFromEvolution(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string
): Promise<any[]> {
  const allContacts: any[] = [];
  const seen = new Set<string>();

  // Try findContacts
  try {
    const response = await fetch(`${evolutionUrl}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const contacts = await response.json();
      for (const c of (Array.isArray(contacts) ? contacts : [])) {
        if (c.id && !seen.has(c.id)) {
          seen.add(c.id);
          allContacts.push(c);
        }
      }
    }
  } catch (e) {
    console.error('findContacts failed:', e);
  }

  // Try findChats
  try {
    const response = await fetch(`${evolutionUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const chats = await response.json();
      for (const c of (Array.isArray(chats) ? chats : [])) {
        const id = c.id || c.remoteJid;
        if (id && !seen.has(id)) {
          seen.add(id);
          allContacts.push({ ...c, id });
        }
      }
    }
  } catch (e) {
    console.error('findChats failed:', e);
  }

  return allContacts;
}

function extractContent(message: any): string {
  if (!message) return '';
  
  return message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.documentMessage?.fileName ||
    message.audioMessage?.caption ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.listResponseMessage?.title ||
    message.templateButtonReplyMessage?.selectedDisplayText ||
    '';
}

function getMessageType(message: any): string {
  if (!message) return 'unknown';
  if (message.conversation || message.extendedTextMessage) return 'text';
  if (message.imageMessage) return 'image';
  if (message.videoMessage) return 'video';
  if (message.audioMessage) return 'audio';
  if (message.documentMessage) return 'document';
  if (message.stickerMessage) return 'sticker';
  if (message.contactMessage) return 'contact';
  if (message.locationMessage) return 'location';
  return 'unknown';
}

function extractAttachment(message: any): any {
  if (!message) return null;
  
  const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
  for (const type of mediaTypes) {
    if (message[type]) {
      return {
        type: type.replace('Message', ''),
        mimetype: message[type].mimetype,
        fileName: message[type].fileName,
        caption: message[type].caption,
      };
    }
  }
  return null;
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10 && cleaned.length <= 13) {
    return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  }
  return cleaned;
}
