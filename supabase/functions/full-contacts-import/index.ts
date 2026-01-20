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
      batchSize = 100,
      offset = 0,
      syncPhotos = false,
      importHistory = false
    } = body;

    console.log(`[full-contacts-import] Starting - batchSize: ${batchSize}, offset: ${offset}`);

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

    // Step 1: Fetch all contacts from Evolution API
    console.log('[full-contacts-import] Fetching contacts from Evolution API...');
    
    let apiContacts: any[] = [];
    
    try {
      const contactsUrl = `${EVOLUTION_API_URL}/chat/findContacts/${INSTANCE_NAME}`;
      const contactsResponse = await fetch(contactsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({})
      });

      if (contactsResponse.ok) {
        const result = await contactsResponse.json();
        apiContacts = Array.isArray(result) ? result : (result?.contacts || []);
      }
    } catch (e) {
      console.log('[full-contacts-import] findContacts failed:', e);
    }

    console.log(`[full-contacts-import] Got ${apiContacts.length} contacts from findContacts`);

    // Step 2: Also fetch all chats to get contacts from conversations
    let apiChats: any[] = [];
    
    try {
      const chatsUrl = `${EVOLUTION_API_URL}/chat/findChats/${INSTANCE_NAME}`;
      const chatsResponse = await fetch(chatsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({})
      });

      if (chatsResponse.ok) {
        const result = await chatsResponse.json();
        apiChats = Array.isArray(result) ? result : (result?.chats || []);
      }
    } catch (e) {
      console.log('[full-contacts-import] findChats failed:', e);
    }

    console.log(`[full-contacts-import] Got ${apiChats.length} chats from findChats`);

    // Step 3: Get existing contacts in database (by phone)
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, phone, name, metadata')
      .eq('company_id', companyId);

    const existingPhones = new Map(
      (existingContacts || [])
        .filter(c => c.phone)
        .map(c => [c.phone.replace(/\D/g, ''), c])
    );

    const existingRemoteJids = new Map(
      (existingContacts || [])
        .filter(c => c.metadata?.remoteJid)
        .map(c => [c.metadata.remoteJid, c])
    );

    console.log(`[full-contacts-import] Existing contacts: ${existingContacts?.length || 0}`);

    // Step 4: Process contacts from API
    const allContacts = new Map<string, any>();
    
    // Add contacts from findContacts
    for (const contact of apiContacts) {
      const jid = contact.id || contact.jid || contact.remoteJid;
      if (!jid) continue;
      
      // Skip system/broadcast/status
      if (jid.includes('@broadcast') || jid.includes('status@') || jid.includes('@newsletter')) continue;
      
      const phone = extractPhone(jid);
      const isGroup = jid.includes('@g.us');
      
      allContacts.set(jid, {
        jid,
        phone: isGroup ? null : phone,
        name: contact.pushName || contact.name || contact.verifiedName || contact.notify || (phone || jid.split('@')[0]),
        profilePictureUrl: contact.profilePictureUrl || contact.imgUrl,
        isGroup,
        source: 'findContacts'
      });
    }

    // Add contacts from chats (may have more recent data)
    for (const chat of apiChats) {
      const jid = chat.id || chat.jid || chat.remoteJid;
      if (!jid) continue;
      
      // Skip system/broadcast/status
      if (jid.includes('@broadcast') || jid.includes('status@') || jid.includes('@newsletter')) continue;
      
      const phone = extractPhone(jid);
      const isGroup = jid.includes('@g.us');
      
      const existing = allContacts.get(jid);
      const chatName = chat.name || chat.pushName || chat.subject;
      
      if (existing) {
        // Update with chat data if it has better info
        if (chatName && (existing.name === phone || existing.name === jid.split('@')[0])) {
          existing.name = chatName;
        }
        if (chat.profilePictureUrl && !existing.profilePictureUrl) {
          existing.profilePictureUrl = chat.profilePictureUrl;
        }
      } else {
        allContacts.set(jid, {
          jid,
          phone: isGroup ? null : phone,
          name: chatName || (phone || jid.split('@')[0]),
          profilePictureUrl: chat.profilePictureUrl,
          isGroup,
          source: 'findChats'
        });
      }
    }

    console.log(`[full-contacts-import] Total unique contacts/chats: ${allContacts.size}`);

    // Step 5: Process batch
    const contactsArray = Array.from(allContacts.values());
    const batch = contactsArray.slice(offset, offset + batchSize);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const contact of batch) {
      try {
        const cleanPhone = contact.phone?.replace(/\D/g, '');
        
        // Check if contact already exists
        let existingContact = cleanPhone ? existingPhones.get(cleanPhone) : null;
        if (!existingContact) {
          existingContact = existingRemoteJids.get(contact.jid);
        }

        if (existingContact) {
          // Contact exists - check if we should update
          const needsNameUpdate = !existingContact.name || 
            existingContact.name === cleanPhone || 
            existingContact.name.includes('@') ||
            /^\d+$/.test(existingContact.name);

          if (needsNameUpdate && contact.name && contact.name !== cleanPhone) {
            await supabase
              .from('contacts')
              .update({
                name: contact.name,
                metadata: {
                  ...existingContact.metadata,
                  remoteJid: contact.jid,
                  pushName: contact.name,
                  updatedByImport: new Date().toISOString()
                }
              })
              .eq('id', existingContact.id);
            
            updated++;
            results.push({ jid: contact.jid, action: 'updated', name: contact.name });
          } else {
            skipped++;
          }
        } else {
          // Create new contact
          // For groups, allow creation without phone
          // For individuals without phone (@lid), also allow creation
          const normalizedPhone = cleanPhone ? normalizePhone(cleanPhone) : null;
          
          const contactData: any = {
            company_id: companyId,
            name: contact.name || 'Sem Nome',
            phone: normalizedPhone,
            metadata: {
              remoteJid: contact.jid,
              pushName: contact.name,
              isGroup: contact.isGroup,
              profilePictureUrl: contact.profilePictureUrl,
              importedAt: new Date().toISOString(),
              source: contact.source
            }
          };

          const { data: newContact, error: insertError } = await supabase
            .from('contacts')
            .insert(contactData)
            .select()
            .single();

          if (!insertError && newContact) {
            created++;
            results.push({ 
              jid: contact.jid, 
              action: 'created', 
              name: contact.name,
              contactId: newContact.id 
            });

            // If syncPhotos is enabled, fetch and upload profile picture
            if (syncPhotos && contact.profilePictureUrl) {
              try {
                await syncProfilePicture(supabase, newContact.id, contact.profilePictureUrl);
              } catch (e) {
                console.log(`[full-contacts-import] Photo sync failed for ${contact.name}:`, e);
              }
            }
          } else if (insertError) {
            results.push({ 
              jid: contact.jid, 
              action: 'error', 
              error: insertError.message 
            });
          }
        }
      } catch (e: any) {
        results.push({ 
          jid: contact.jid, 
          action: 'error', 
          error: e.message 
        });
      }
    }

    console.log(`[full-contacts-import] Batch complete - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);

    const hasMore = offset + batchSize < contactsArray.length;

    return new Response(JSON.stringify({
      success: true,
      totalInApi: allContacts.size,
      batchProcessed: batch.length,
      created,
      updated,
      skipped,
      offset,
      nextOffset: hasMore ? offset + batchSize : null,
      hasMore,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[full-contacts-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractPhone(jid: string): string | null {
  if (!jid) return null;
  if (jid.includes('@g.us')) return null; // Group
  
  const parts = jid.split('@');
  if (parts[0]) {
    const cleaned = parts[0].replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return cleaned;
    }
  }
  return null;
}

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  
  // Add Brazil code if missing
  if (normalized.length === 10 || normalized.length === 11) {
    normalized = '55' + normalized;
  }
  
  return normalized;
}

async function syncProfilePicture(supabase: any, contactId: string, pictureUrl: string) {
  try {
    const response = await fetch(pictureUrl);
    if (!response.ok) return;
    
    const blob = await response.blob();
    const fileName = `contacts/${contactId}/avatar.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      await supabase
        .from('contacts')
        .update({ avatar_url: publicUrl })
        .eq('id', contactId);
    }
  } catch (e) {
    console.log('[syncProfilePicture] Error:', e);
  }
}
