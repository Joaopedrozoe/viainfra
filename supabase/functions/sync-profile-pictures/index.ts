import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Instância autorizada para buscar fotos
const AUTHORIZED_INSTANCE = 'TESTE2';

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

    // Get the authorized WhatsApp instance (TESTE2)
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, company_id, phone_number, connection_state')
      .eq('instance_name', AUTHORIZED_INSTANCE)
      .eq('connection_state', 'open')
      .limit(1);

    if (instanceError || !instances?.length) {
      console.log(`⚠️ Authorized instance ${AUTHORIZED_INSTANCE} not connected`);
      return new Response(JSON.stringify({ 
        error: `Instance ${AUTHORIZED_INSTANCE} not connected`,
        details: instanceError 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instance = instances[0];
    console.log(`📱 Using instance: ${instance.instance_name}`);

    // Get contacts to sync - PRIORITY: contacts with active conversations
    let contactsQuery;
    
    if (contactId) {
      // Sync specific contact
      contactsQuery = supabase
        .from('contacts')
        .select('id, name, phone, avatar_url, company_id')
        .eq('id', contactId)
        .not('phone', 'is', null)
        .neq('phone', '');
    } else {
      // PRIORITY: Get contacts from active conversations first
      const { data: activeConversations } = await supabase
        .from('conversations')
        .select('contact_id')
        .eq('channel', 'whatsapp')
        .in('status', ['open', 'pending'])
        .not('contact_id', 'is', null);
      
      const activeContactIds = activeConversations?.map(c => c.contact_id).filter(Boolean) || [];
      
      console.log(`📋 Found ${activeContactIds.length} contacts with active conversations`);
      
      if (activeContactIds.length > 0) {
        // Sync contacts with active conversations
        contactsQuery = supabase
          .from('contacts')
          .select('id, name, phone, avatar_url, company_id')
          .in('id', activeContactIds)
          .not('phone', 'is', null)
          .neq('phone', '');
        
        // Only sync contacts without avatar unless forceUpdate
        if (!forceUpdate) {
          contactsQuery = contactsQuery.or('avatar_url.is.null,avatar_url.eq.');
        }
      } else {
        // Fallback to original logic if no active conversations
        contactsQuery = supabase
          .from('contacts')
          .select('id, name, phone, avatar_url, company_id')
          .not('phone', 'is', null)
          .neq('phone', '');
        
        if (companyId) {
          contactsQuery = contactsQuery.eq('company_id', companyId);
        } else if (instance.company_id) {
          contactsQuery = contactsQuery.eq('company_id', instance.company_id);
        }
        
        if (!forceUpdate) {
          contactsQuery = contactsQuery.or('avatar_url.is.null,avatar_url.eq.');
        }
        
        contactsQuery = contactsQuery.limit(50);
      }
    }

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

        // Fetch profile picture from Evolution API using authorized instance
        const apiUrl = `${evolutionUrl}/chat/fetchProfilePictureUrl/${AUTHORIZED_INSTANCE}`;
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
