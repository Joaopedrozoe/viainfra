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
      dryRun = false,
      fixNames = true,
      resolveLids = true,
      mergeDuplicates = true,
      batchSize = 100
    } = body;

    console.log(`[fix-contact-quality] Starting - dryRun: ${dryRun}`);

    // Get company ID
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', INSTANCE_NAME)
      .single();

    const companyId = instance?.company_id;
    if (!companyId) {
      throw new Error('Company not found for instance');
    }

    const results = {
      namesFixed: [] as any[],
      lidsResolved: [] as any[],
      duplicatesMerged: [] as any[],
      errors: [] as any[]
    };

    // Step 1: Fix contacts with numeric names or @lid names
    if (fixNames) {
      console.log('[fix-contact-quality] Fixing contact names...');
      
      // Get contacts with bad names
      const { data: badNameContacts } = await supabase
        .from('contacts')
        .select('id, name, phone, metadata')
        .eq('company_id', companyId)
        .limit(batchSize);

      // Filter to contacts with numeric names, @lid names, or remoteJid as names
      const contactsNeedingNameFix = (badNameContacts || []).filter(c => {
        if (!c.name) return true;
        if (/^\d+$/.test(c.name)) return true; // Pure numbers
        if (c.name.includes('@lid')) return true;
        if (c.name.includes('@s.whatsapp.net')) return true;
        if (c.name.includes('@g.us')) return true;
        if (c.name === 'Sem Nome') return true;
        return false;
      });

      console.log(`[fix-contact-quality] Found ${contactsNeedingNameFix.length} contacts needing name fix`);

      // Fetch contacts from Evolution API for name resolution
      let apiContacts: any[] = [];
      try {
        const contactsUrl = `${EVOLUTION_API_URL}/chat/findContacts/${INSTANCE_NAME}`;
        const response = await fetch(contactsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
          },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const result = await response.json();
          apiContacts = Array.isArray(result) ? result : (result?.contacts || []);
        }
      } catch (e) {
        console.log('[fix-contact-quality] Failed to fetch API contacts:', e);
      }

      // Build lookup maps
      const apiByPhone = new Map<string, any>();
      const apiByJid = new Map<string, any>();
      
      for (const c of apiContacts) {
        const jid = c.id || c.jid || c.remoteJid;
        if (jid) apiByJid.set(jid, c);
        
        const phone = extractPhone(jid);
        if (phone) apiByPhone.set(phone, c);
      }

      for (const contact of contactsNeedingNameFix) {
        const remoteJid = contact.metadata?.remoteJid;
        const cleanPhone = contact.phone?.replace(/\D/g, '');
        
        // Try to find better name from API
        let apiContact = remoteJid ? apiByJid.get(remoteJid) : null;
        if (!apiContact && cleanPhone) {
          apiContact = apiByPhone.get(cleanPhone);
        }

        const newName = apiContact?.pushName || apiContact?.name || apiContact?.verifiedName || apiContact?.notify;
        
        if (newName && newName !== contact.name && !/^\d+$/.test(newName)) {
          if (!dryRun) {
            await supabase
              .from('contacts')
              .update({
                name: newName,
                metadata: {
                  ...contact.metadata,
                  previousName: contact.name,
                  nameFixedAt: new Date().toISOString()
                }
              })
              .eq('id', contact.id);
          }
          
          results.namesFixed.push({
            contactId: contact.id,
            oldName: contact.name,
            newName: newName
          });
        }
      }

      console.log(`[fix-contact-quality] Fixed ${results.namesFixed.length} names`);
    }

    // Step 2: Resolve @lid contacts without phone
    if (resolveLids) {
      console.log('[fix-contact-quality] Resolving @lid contacts...');
      
      // Get contacts with @lid in metadata but no phone
      const { data: lidContacts } = await supabase
        .from('contacts')
        .select('id, name, phone, metadata')
        .eq('company_id', companyId)
        .is('phone', null)
        .limit(batchSize);

      const lidsToResolve = (lidContacts || []).filter(c => 
        c.metadata?.remoteJid?.includes('@lid')
      );

      console.log(`[fix-contact-quality] Found ${lidsToResolve.length} @lid contacts to resolve`);

      // Check lid_phone_mapping table
      for (const contact of lidsToResolve) {
        const lid = contact.metadata?.remoteJid;
        
        // Check mapping table
        const { data: mapping } = await supabase
          .from('lid_phone_mapping')
          .select('phone')
          .eq('lid', lid)
          .single();

        if (mapping?.phone) {
          const normalizedPhone = normalizePhone(mapping.phone);
          
          // Check if another contact already has this phone
          const { data: existingWithPhone } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('phone', normalizedPhone)
            .eq('company_id', companyId)
            .neq('id', contact.id)
            .single();

          if (existingWithPhone) {
            // Need to merge contacts
            results.lidsResolved.push({
              contactId: contact.id,
              lid,
              phone: normalizedPhone,
              action: 'needs_merge',
              mergeWithId: existingWithPhone.id
            });
          } else {
            // Can update phone directly
            if (!dryRun) {
              await supabase
                .from('contacts')
                .update({
                  phone: normalizedPhone,
                  metadata: {
                    ...contact.metadata,
                    phoneResolvedAt: new Date().toISOString(),
                    phoneResolvedFrom: 'lid_phone_mapping'
                  }
                })
                .eq('id', contact.id);
            }
            
            results.lidsResolved.push({
              contactId: contact.id,
              lid,
              phone: normalizedPhone,
              action: 'phone_set'
            });
          }
        }
      }

      console.log(`[fix-contact-quality] Resolved ${results.lidsResolved.length} @lid contacts`);
    }

    // Step 3: Merge duplicate contacts
    if (mergeDuplicates) {
      console.log('[fix-contact-quality] Finding duplicate contacts...');
      
      // Find contacts with same phone number
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('id, name, phone, metadata, created_at')
        .eq('company_id', companyId)
        .not('phone', 'is', null)
        .order('created_at', { ascending: true });

      const phoneGroups = new Map<string, any[]>();
      for (const contact of allContacts || []) {
        const cleanPhone = contact.phone?.replace(/\D/g, '');
        if (cleanPhone) {
          if (!phoneGroups.has(cleanPhone)) {
            phoneGroups.set(cleanPhone, []);
          }
          phoneGroups.get(cleanPhone)!.push(contact);
        }
      }

      // Find groups with duplicates
      for (const [phone, contacts] of phoneGroups) {
        if (contacts.length > 1) {
          // Keep the oldest contact (first created) as primary
          const primary = contacts[0];
          const duplicates = contacts.slice(1);

          for (const dup of duplicates) {
            if (!dryRun) {
              // Move conversations from duplicate to primary
              await supabase
                .from('conversations')
                .update({ contact_id: primary.id })
                .eq('contact_id', dup.id);

              // Delete the duplicate contact
              await supabase
                .from('contacts')
                .delete()
                .eq('id', dup.id);
            }

            results.duplicatesMerged.push({
              primaryId: primary.id,
              primaryName: primary.name,
              duplicateId: dup.id,
              duplicateName: dup.name,
              phone
            });
          }
        }
      }

      console.log(`[fix-contact-quality] Merged ${results.duplicatesMerged.length} duplicates`);
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      summary: {
        namesFixed: results.namesFixed.length,
        lidsResolved: results.lidsResolved.length,
        duplicatesMerged: results.duplicatesMerged.length,
        errors: results.errors.length
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[fix-contact-quality] Error:', error);
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
  if (jid.includes('@g.us')) return null;
  
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
  
  if (normalized.length === 10 || normalized.length === 11) {
    normalized = '55' + normalized;
  }
  
  return normalized;
}
