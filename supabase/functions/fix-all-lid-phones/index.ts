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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));
    
    const instanceName = 'VIAINFRAOFICIAL';
    const companyId = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

    console.log(`[fix-all-lid] Starting LID resolution, dryRun: ${dryRun}`);

    // 1. Get all LID contacts without phone
    const { data: lidContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, phone, metadata')
      .is('phone', null)
      .eq('company_id', companyId)
      .not('metadata->remoteJid', 'is', null);

    if (contactsError) {
      throw new Error(`Error fetching contacts: ${contactsError.message}`);
    }

    const lidContactsToFix = lidContacts?.filter(c => 
      c.metadata?.remoteJid?.includes('@lid')
    ) || [];

    console.log(`[fix-all-lid] Found ${lidContactsToFix.length} LID contacts without phone`);

    // 2. Fetch all chats from Evolution API
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const chatsData = await chatsResponse.json();
    const allChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || chatsData?.data || []);
    console.log(`[fix-all-lid] Fetched ${allChats.length} chats from Evolution`);

    // 3. Also fetch contacts
    const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const evolutionContacts = await contactsResponse.json();
    const allEvolutionContacts = Array.isArray(evolutionContacts) ? evolutionContacts : (evolutionContacts?.contacts || evolutionContacts?.data || []);
    console.log(`[fix-all-lid] Fetched ${allEvolutionContacts.length} contacts from Evolution`);

    // 4. Create a map of names to phone numbers
    const nameToPhoneMap = new Map<string, { phone: string, remoteJid: string }>();
    
    // From chats
    for (const chat of allChats) {
      const name = (chat.name || chat.pushName || '').toLowerCase().trim();
      const remoteJid = chat.remoteJid || chat.id;
      
      if (name && remoteJid?.includes('@s.whatsapp.net')) {
        const phone = remoteJid.replace('@s.whatsapp.net', '');
        if (/^\d{10,15}$/.test(phone)) {
          nameToPhoneMap.set(name, { phone, remoteJid });
        }
      }
    }

    // From contacts
    for (const contact of allEvolutionContacts) {
      const name = (contact.pushName || contact.name || '').toLowerCase().trim();
      const remoteJid = contact.id || contact.remoteJid;
      
      if (name && remoteJid?.includes('@s.whatsapp.net')) {
        const phone = remoteJid.replace('@s.whatsapp.net', '');
        if (/^\d{10,15}$/.test(phone)) {
          nameToPhoneMap.set(name, { phone, remoteJid });
        }
      }
    }

    console.log(`[fix-all-lid] Built name->phone map with ${nameToPhoneMap.size} entries`);

    // 5. Match LID contacts with phone numbers
    const results: any[] = [];
    const updates: any[] = [];

    for (const contact of lidContactsToFix) {
      const contactName = (contact.name || '').toLowerCase().trim();
      
      // Try exact match first
      let match = nameToPhoneMap.get(contactName);
      
      // Try partial match
      if (!match) {
        for (const [mapName, data] of nameToPhoneMap.entries()) {
          if (contactName.includes(mapName) || mapName.includes(contactName)) {
            match = data;
            break;
          }
          
          // Try matching first word
          const firstWord = contactName.split(' ')[0];
          if (firstWord.length > 3 && mapName.includes(firstWord)) {
            match = data;
            break;
          }
        }
      }

      const result: any = {
        contactId: contact.id,
        contactName: contact.name,
        lidId: contact.metadata?.lidId,
        currentRemoteJid: contact.metadata?.remoteJid,
        foundPhone: match?.phone || null,
        foundRemoteJid: match?.remoteJid || null,
        status: match ? 'FOUND' : 'NOT_FOUND'
      };

      if (match && !dryRun) {
        // Check if phone already exists for another contact
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id, name')
          .eq('phone', match.phone)
          .eq('company_id', companyId)
          .neq('id', contact.id)
          .maybeSingle();

        if (existingContact) {
          result.status = 'PHONE_EXISTS';
          result.existingContactId = existingContact.id;
          result.existingContactName = existingContact.name;
          
          // Just update conversation metadata instead
          const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .eq('contact_id', contact.id);
          
          if (conversations && conversations.length > 0) {
            for (const conv of conversations) {
              await supabase
                .from('conversations')
                .update({
                  metadata: {
                    ...contact.metadata,
                    remoteJid: match.remoteJid,
                    resolvedPhone: match.phone
                  }
                })
                .eq('id', conv.id);
            }
            result.conversationsUpdated = conversations.length;
          }
        } else {
          // Update contact with phone
          const { error: updateError } = await supabase
            .from('contacts')
            .update({ 
              phone: match.phone,
              metadata: {
                ...contact.metadata,
                resolvedFromLid: true,
                resolvedAt: new Date().toISOString()
              }
            })
            .eq('id', contact.id);

          if (updateError) {
            result.status = 'UPDATE_ERROR';
            result.error = updateError.message;
          } else {
            result.status = 'UPDATED';
            
            // Also update conversation metadata
            const { data: conversations } = await supabase
              .from('conversations')
              .select('id, metadata')
              .eq('contact_id', contact.id);
            
            if (conversations && conversations.length > 0) {
              for (const conv of conversations) {
                await supabase
                  .from('conversations')
                  .update({
                    metadata: {
                      ...(conv.metadata as object || {}),
                      remoteJid: match.remoteJid
                    }
                  })
                  .eq('id', conv.id);
              }
              result.conversationsUpdated = conversations.length;
            }

            // Add to lid_phone_mapping
            await supabase
              .from('lid_phone_mapping')
              .upsert({
                lid: contact.metadata?.lidId,
                phone: match.phone,
                contact_id: contact.id,
                instance_name: instanceName,
                company_id: companyId
              }, { onConflict: 'lid' });
          }
        }
      }

      results.push(result);
    }

    // 6. Fix conversations without remoteJid
    const { data: conversationsWithoutRemoteJid } = await supabase
      .from('conversations')
      .select(`
        id,
        metadata,
        contact_id,
        contacts!inner(name, phone, metadata)
      `)
      .eq('channel', 'whatsapp')
      .eq('company_id', companyId)
      .or('metadata->remoteJid.is.null,metadata->remoteJid.eq.');

    const conversationFixes: any[] = [];
    
    if (conversationsWithoutRemoteJid) {
      for (const conv of conversationsWithoutRemoteJid) {
        const contact = conv.contacts as any;
        let remoteJid: string | null = null;

        if (contact?.phone && /^\d{10,15}$/.test(contact.phone)) {
          remoteJid = `${contact.phone}@s.whatsapp.net`;
        } else if (contact?.metadata?.remoteJid) {
          remoteJid = contact.metadata.remoteJid;
        }

        const fix = {
          conversationId: conv.id,
          contactName: contact?.name,
          contactPhone: contact?.phone,
          newRemoteJid: remoteJid,
          status: remoteJid ? 'FIXABLE' : 'NO_PHONE'
        };

        if (remoteJid && !dryRun) {
          const { error } = await supabase
            .from('conversations')
            .update({
              metadata: {
                ...(conv.metadata as object || {}),
                remoteJid
              }
            })
            .eq('id', conv.id);

          fix.status = error ? 'ERROR' : 'FIXED';
          if (error) fix.error = error.message;
        }

        conversationFixes.push(fix);
      }
    }

    // 7. Validate all conversation links
    const { data: allConversations } = await supabase
      .from('conversations')
      .select(`
        id,
        metadata,
        contact_id,
        contacts(id, name, phone)
      `)
      .eq('channel', 'whatsapp')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(100);

    const linkValidation = {
      total: allConversations?.length || 0,
      withContact: 0,
      withPhone: 0,
      withRemoteJid: 0,
      issues: [] as any[]
    };

    for (const conv of allConversations || []) {
      const contact = conv.contacts as any;
      const remoteJid = (conv.metadata as any)?.remoteJid;

      if (contact) linkValidation.withContact++;
      if (contact?.phone) linkValidation.withPhone++;
      if (remoteJid) linkValidation.withRemoteJid++;

      // Check for issues
      if (!contact) {
        linkValidation.issues.push({
          conversationId: conv.id,
          issue: 'NO_CONTACT'
        });
      } else if (!contact.phone && !remoteJid?.includes('@s.whatsapp.net')) {
        linkValidation.issues.push({
          conversationId: conv.id,
          contactName: contact.name,
          issue: 'NO_VALID_PHONE_OR_REMOTEJID'
        });
      }
    }

    return new Response(JSON.stringify({
      dryRun,
      summary: {
        lidContactsFound: lidContactsToFix.length,
        phonesResolved: results.filter(r => r.status === 'UPDATED' || r.status === 'FOUND').length,
        phonesNotFound: results.filter(r => r.status === 'NOT_FOUND').length,
        phoneConflicts: results.filter(r => r.status === 'PHONE_EXISTS').length,
        conversationsFixed: conversationFixes.filter(f => f.status === 'FIXED').length
      },
      linkValidation,
      lidResolutions: results,
      conversationFixes: conversationFixes.length > 0 ? conversationFixes : undefined
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[fix-all-lid] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
