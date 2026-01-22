import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'JUNIORCORRETOR'];
const BUCKET_NAME = 'profile-pictures';

// Helper to download image and upload to storage
async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  contactId: string
): Promise<string | null> {
  try {
    console.log(`📥 Downloading image for ${contactId}...`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.log(`❌ Failed to download: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength > 500000 || arrayBuffer.byteLength < 100) {
      console.log(`❌ Invalid image size: ${arrayBuffer.byteLength}`);
      return null;
    }
    
    const blob = new Uint8Array(arrayBuffer);
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const fileName = `${contactId}.${extension}`;
    
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, { contentType, upsert: true });
    
    if (uploadError) {
      console.error(`❌ Upload error:`, uploadError.message);
      return null;
    }
    
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return `${urlData.publicUrl}?v=${Date.now()}`;
    
  } catch (error) {
    console.error(`❌ Error:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 SYNC ALL GROUPS - Complete group synchronization');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const { instanceName, syncAvatars = true, syncMessages = true } = await req.json().catch(() => ({}));

    const stats = {
      groupsFromApi: 0,
      existingGroups: 0,
      newGroupsCreated: 0,
      conversationsCreated: 0,
      avatarsUpdated: 0,
      messagesImported: 0,
      errors: [] as string[]
    };

    // Find instance
    let query = supabase
      .from('whatsapp_instances')
      .select('instance_name, company_id')
      .eq('connection_state', 'open');

    if (instanceName) {
      query = query.eq('instance_name', instanceName);
    } else {
      query = query.in('instance_name', ALLOWED_INSTANCES);
    }

    const { data: instances } = await query.limit(1);

    if (!instances?.length) {
      return new Response(JSON.stringify({ 
        error: 'No connected instance found',
        requested: instanceName || ALLOWED_INSTANCES
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const instance = instances[0];
    const companyId = instance.company_id;
    console.log(`📱 Using instance: ${instance.instance_name} (Company: ${companyId})`);

    // STEP 1: Fetch ALL groups from Evolution API
    console.log('\n📥 STEP 1: Fetching all groups from Evolution API...');
    
    const groupsResponse = await fetch(
      `${evolutionUrl}/group/fetchAllGroups/${instance.instance_name}?getParticipants=false`,
      { headers: { 'apikey': evolutionKey } }
    );

    if (!groupsResponse.ok) {
      throw new Error(`Failed to fetch groups: ${groupsResponse.status}`);
    }

    const allGroups = await groupsResponse.json();
    stats.groupsFromApi = Array.isArray(allGroups) ? allGroups.length : 0;
    console.log(`📊 Found ${stats.groupsFromApi} groups from API`);

    // STEP 2: Get existing group contacts
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, name, metadata, avatar_url')
      .eq('company_id', companyId)
      .contains('metadata', { isGroup: true });

    const existingByJid = new Map<string, any>();
    for (const c of existingContacts || []) {
      const jid = c.metadata?.remoteJid;
      if (jid) existingByJid.set(jid, c);
    }
    stats.existingGroups = existingByJid.size;
    console.log(`📊 Existing groups in DB: ${stats.existingGroups}`);

    // STEP 3: Get existing conversations
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, contact_id, metadata')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp')
      .contains('metadata', { isGroup: true });

    const convByContactId = new Map<string, any>();
    const convByJid = new Map<string, any>();
    for (const conv of existingConvs || []) {
      if (conv.contact_id) convByContactId.set(conv.contact_id, conv);
      if (conv.metadata?.remoteJid) convByJid.set(conv.metadata.remoteJid, conv);
    }

    // STEP 4: Process each group
    console.log('\n📋 STEP 4: Processing groups...');
    
    for (const group of (Array.isArray(allGroups) ? allGroups : [])) {
      const remoteJid = group.id || group.jid || group.remoteJid;
      if (!remoteJid || !remoteJid.includes('@g.us')) continue;

      const groupName = group.subject || group.name || 'Grupo sem nome';
      const pictureUrl = group.pictureUrl || group.profilePictureUrl || null;

      console.log(`\n   🔍 Processing: ${groupName} (${remoteJid})`);

      // Check if contact exists
      let contact = existingByJid.get(remoteJid);

      if (!contact) {
        // Create new contact
        console.log(`   📝 Creating new group contact...`);
        
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert({
            name: groupName,
            company_id: companyId,
            metadata: {
              isGroup: true,
              remoteJid,
              subject: groupName,
              creation: group.creation,
              owner: group.owner,
              participants: group.participants?.length || 0
            }
          })
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Error creating contact:`, createError);
          stats.errors.push(`Create contact: ${createError.message}`);
          continue;
        }

        contact = newContact;
        stats.newGroupsCreated++;
        existingByJid.set(remoteJid, contact);
        console.log(`   ✅ Contact created: ${contact.id}`);
      }

      // Check if conversation exists
      let conversation = convByContactId.get(contact.id) || convByJid.get(remoteJid);

      if (!conversation) {
        // Create conversation
        console.log(`   📝 Creating conversation...`);
        
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            company_id: companyId,
            contact_id: contact.id,
            channel: 'whatsapp',
            status: 'open',
            metadata: {
              isGroup: true,
              remoteJid
            }
          })
          .select()
          .single();

        if (convError) {
          if (convError.code !== '23505') { // Not duplicate key
            console.error(`   ❌ Error creating conversation:`, convError);
            stats.errors.push(`Create conv: ${convError.message}`);
          }
        } else {
          conversation = newConv;
          stats.conversationsCreated++;
          convByContactId.set(contact.id, conversation);
          console.log(`   ✅ Conversation created: ${conversation.id}`);
        }
      }

      // Sync avatar if requested and group has picture
      if (syncAvatars && pictureUrl && !contact.avatar_url) {
        console.log(`   🖼️ Syncing avatar...`);
        const newUrl = await downloadAndUploadImage(supabase, pictureUrl, contact.id);
        
        if (newUrl) {
          await supabase
            .from('contacts')
            .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
            .eq('id', contact.id);
          
          stats.avatarsUpdated++;
          console.log(`   ✅ Avatar updated`);
        }
      }

      // Sync messages if requested
      if (syncMessages && conversation) {
        try {
          // Check if conversation already has messages
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id);

          if ((count || 0) < 5) {
            console.log(`   📨 Fetching messages...`);
            
            const messagesResponse = await fetch(
              `${evolutionUrl}/chat/findMessages/${instance.instance_name}`,
              {
                method: 'POST',
                headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ where: { key: { remoteJid } }, limit: 50 })
              }
            );

            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              const messages = messagesData?.messages?.records || messagesData?.records || 
                              (Array.isArray(messagesData) ? messagesData : []);

              for (const msg of messages.slice(0, 50)) {
                const messageId = msg.key?.id || msg.id;
                const content = extractContent(msg);
                const fromMe = msg.key?.fromMe || false;

                if (!content || !messageId) continue;

                const { error: insertError } = await supabase
                  .from('messages')
                  .insert({
                    conversation_id: conversation.id,
                    sender_type: fromMe ? 'agent' : 'user',
                    content,
                    created_at: new Date((msg.messageTimestamp || Date.now()/1000) * 1000).toISOString(),
                    metadata: { messageId, remoteJid, isGroup: true }
                  });

                if (!insertError) {
                  stats.messagesImported++;
                }
              }
              console.log(`   ✅ Messages synced`);
            }
          }
        } catch (msgError) {
          console.error(`   ⚠️ Error syncing messages:`, msgError);
        }
      }
    }

    // STEP 5: Update conversation timestamps
    console.log('\n📋 STEP 5: Updating timestamps...');
    
    const { data: groupConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', companyId)
      .contains('metadata', { isGroup: true });

    for (const conv of groupConvs || []) {
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
      }
    }

    console.log('\n✅ SYNC ALL GROUPS COMPLETE');
    console.log(`   Groups from API: ${stats.groupsFromApi}`);
    console.log(`   Existing groups: ${stats.existingGroups}`);
    console.log(`   New groups created: ${stats.newGroupsCreated}`);
    console.log(`   Conversations created: ${stats.conversationsCreated}`);
    console.log(`   Avatars updated: ${stats.avatarsUpdated}`);
    console.log(`   Messages imported: ${stats.messagesImported}`);

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Extract message content
function extractContent(msg: any): string {
  const message = msg.message || msg;
  
  if (message?.conversation) return message.conversation;
  if (message?.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message?.imageMessage?.caption) return `[Imagem] ${message.imageMessage.caption}`;
  if (message?.imageMessage) return '[Imagem]';
  if (message?.videoMessage?.caption) return `[Vídeo] ${message.videoMessage.caption}`;
  if (message?.videoMessage) return '[Vídeo]';
  if (message?.audioMessage) return '[Áudio]';
  if (message?.documentMessage?.fileName) return `[Documento: ${message.documentMessage.fileName}]`;
  if (message?.documentMessage) return '[Documento]';
  if (message?.stickerMessage) return '[Sticker]';
  if (message?.contactMessage) return '[Contato]';
  if (message?.locationMessage) return '[Localização]';
  
  return '';
}
