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

  console.log('🔄 Starting profile picture sync...');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionKey) {
      return new Response(JSON.stringify({ error: 'EVOLUTION_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body for optional filters
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, sync all
    }

    const { contactId, companyId, forceUpdate = false } = body;

    // Get connected WhatsApp instance - check for 'open' status (Evolution API uses 'open' not 'connected')
    let instanceQuery = supabase
      .from('whatsapp_instances')
      .select('instance_name, company_id, phone_number')
      .in('status', ['open', 'connected'])
      .eq('phone_number', '5511940027215') // Only use authorized instance
      .limit(1);

    if (companyId) {
      instanceQuery = instanceQuery.eq('company_id', companyId);
    }

    const { data: instances, error: instanceError } = await instanceQuery;

    if (instanceError || !instances?.length) {
      return new Response(JSON.stringify({ 
        error: 'No connected WhatsApp instance found',
        details: instanceError 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instance = instances[0];
    console.log(`📱 Using instance: ${instance.instance_name}`);

    // Get contacts to sync
    let contactsQuery = supabase
      .from('contacts')
      .select('id, name, phone, avatar_url, company_id')
      .not('phone', 'is', null)
      .neq('phone', '');

    if (contactId) {
      contactsQuery = contactsQuery.eq('id', contactId);
    } else if (companyId) {
      contactsQuery = contactsQuery.eq('company_id', companyId);
    } else if (instance.company_id) {
      contactsQuery = contactsQuery.eq('company_id', instance.company_id);
    }

    // Only sync contacts without avatar unless forceUpdate
    if (!forceUpdate) {
      contactsQuery = contactsQuery.or('avatar_url.is.null,avatar_url.eq.');
    }

    // Limit to avoid timeout
    contactsQuery = contactsQuery.limit(50);

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch contacts', details: contactsError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${contacts?.length || 0} contacts to sync`);

    const results = {
      total: contacts?.length || 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    // Process contacts
    for (const contact of contacts || []) {
      try {
        const phone = contact.phone?.replace(/\D/g, '');
        
        if (!phone || phone.length < 10) {
          console.log(`⏭️ Skipping ${contact.name}: invalid phone`);
          results.skipped++;
          continue;
        }

        console.log(`📷 Fetching picture for ${contact.name} (${phone})...`);

        // Format phone for WhatsApp (ensure country code)
        let formattedPhone = phone;
        if (!phone.startsWith('55') && phone.length <= 11) {
          formattedPhone = `55${phone}`;
        }

        // Fetch profile picture from Evolution API
        const apiUrl = `${evolutionUrl}/chat/fetchProfilePictureUrl/${instance.instance_name}`;
        console.log(`🔗 Calling: ${apiUrl} with number: ${formattedPhone}`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({ number: formattedPhone }),
        });

        const responseText = await response.text();
        console.log(`📡 Response for ${contact.name}: ${response.status} - ${responseText.substring(0, 200)}`);

        if (!response.ok) {
          console.log(`⚠️ Failed for ${contact.name}: ${response.status}`);
          results.failed++;
          results.details.push({ id: contact.id, name: contact.name, status: 'failed', reason: `HTTP ${response.status}` });
          continue;
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.log(`⚠️ Invalid JSON for ${contact.name}`);
          results.failed++;
          continue;
        }
        
        const pictureUrl = data.profilePictureUrl || data.pictureUrl || data.url || data.picture;

        if (!pictureUrl) {
          console.log(`📷 No picture for ${contact.name} - Response: ${JSON.stringify(data)}`);
          results.skipped++;
          results.details.push({ id: contact.id, name: contact.name, status: 'skipped', reason: 'No picture available' });
          continue;
        }

        // Update contact with avatar URL
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ 
            avatar_url: pictureUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);

        if (updateError) {
          console.error(`❌ Error updating ${contact.name}:`, updateError);
          results.failed++;
          results.details.push({ id: contact.id, name: contact.name, status: 'failed', reason: updateError.message });
        } else {
          console.log(`✅ Updated ${contact.name}`);
          results.updated++;
          results.details.push({ id: contact.id, name: contact.name, status: 'updated', avatar_url: pictureUrl });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Error processing ${contact.name}:`, error);
        results.failed++;
        results.details.push({ id: contact.id, name: contact.name, status: 'failed', reason: String(error) });
      }
    }

    console.log(`✅ Sync complete: ${results.updated} updated, ${results.failed} failed, ${results.skipped} skipped`);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
