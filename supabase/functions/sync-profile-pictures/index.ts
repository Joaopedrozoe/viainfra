import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Instâncias autorizadas para buscar fotos
const AUTHORIZED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'JUNIORCORRETOR'];
const BUCKET_NAME = 'profile-pictures';

// LIMIT: Maximum contacts per run to avoid memory issues
const MAX_CONTACTS_PER_RUN = 5;

// Helper to download image and upload to storage
async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  contactId: string
): Promise<string | null> {
  try {
    console.log(`📥 Downloading image for contact ${contactId}...`);
    
    // Download the image with short timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.log(`❌ Failed to download: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    
    // Limit image size to 500KB
    if (arrayBuffer.byteLength > 500000) {
      console.log(`❌ Image too large (${arrayBuffer.byteLength} bytes)`);
      return null;
    }
    
    const blob = new Uint8Array(arrayBuffer);
    
    if (blob.length < 100) {
      console.log(`❌ Image too small`);
      return null;
    }
    
    // Determine file extension
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    
    const fileName = `${contactId}.${extension}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, {
        contentType,
        upsert: true,
      });
    
    if (uploadError) {
      console.error(`❌ Upload error:`, uploadError.message);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    
    console.log(`✅ Uploaded: ${fileName}`);
    return urlData.publicUrl;
    
  } catch (error) {
    console.error(`❌ Error:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 Starting profile picture sync (optimized)...');

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
      // No body provided
    }

    const { contactId, forceUpdate = false } = body;

    // Get any authorized WhatsApp instance that is connected
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, company_id')
      .in('instance_name', AUTHORIZED_INSTANCES)
      .eq('connection_state', 'open')
      .limit(1);

    if (!instances?.length) {
      console.log(`⚠️ No authorized instance connected`);
      return new Response(JSON.stringify({ 
        error: 'No authorized instance connected',
        checked: AUTHORIZED_INSTANCES
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instance = instances[0];
    console.log(`📱 Using instance: ${instance.instance_name}`);

    // Build query - VERY LIMITED to avoid memory issues
    let contactsQuery = supabase
      .from('contacts')
      .select('id, name, phone, avatar_url')
      .not('phone', 'is', null)
      .neq('phone', '');

    if (contactId) {
      contactsQuery = contactsQuery.eq('id', contactId);
    } else {
      // Only get contacts without avatar or with expired WhatsApp URLs
      if (!forceUpdate) {
        contactsQuery = contactsQuery.or('avatar_url.is.null,avatar_url.eq.,avatar_url.like.%pps.whatsapp.net%');
      }
      // STRICT LIMIT
      contactsQuery = contactsQuery.limit(MAX_CONTACTS_PER_RUN);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Processing ${contacts?.length || 0} contacts (max: ${MAX_CONTACTS_PER_RUN})`);

    const results = {
      total: contacts?.length || 0,
      updated: 0,
      failed: 0,
      skipped: 0,
    };

    // Process contacts ONE BY ONE with cleanup
    for (const contact of contacts || []) {
      try {
        const phone = contact.phone?.replace(/\D/g, '');
        
        if (!phone || phone.length < 10) {
          results.skipped++;
          continue;
        }

        // Skip if already has stored URL
        if (contact.avatar_url?.includes('supabase') && !forceUpdate) {
          results.skipped++;
          continue;
        }

        // Format phone
        let formattedPhone = phone;
        if (!phone.startsWith('55') && phone.length <= 11) {
          formattedPhone = `55${phone}`;
        }

        console.log(`📷 ${contact.name} (${formattedPhone})...`);

        // Fetch profile picture URL
        const response = await fetch(
          `${evolutionUrl}/chat/fetchProfilePictureUrl/${instance.instance_name}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({ number: formattedPhone }),
          }
        );

        if (!response.ok) {
          console.log(`⚠️ API error: ${response.status}`);
          results.failed++;
          continue;
        }

        const data = await response.json();
        const pictureUrl = data.profilePictureUrl || data.pictureUrl || data.url;

        if (!pictureUrl) {
          console.log(`📷 No picture available`);
          results.skipped++;
          continue;
        }

        // Download and upload
        const storedUrl = await downloadAndUploadImage(supabase, pictureUrl, contact.id);
        
        if (!storedUrl) {
          results.failed++;
          continue;
        }

        // Update contact
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ 
            avatar_url: storedUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);

        if (updateError) {
          results.failed++;
        } else {
          console.log(`✅ Updated ${contact.name}`);
          results.updated++;
        }

        // Delay between contacts
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Error:`, error);
        results.failed++;
      }
    }

    console.log(`✅ Done: ${results.updated} updated, ${results.failed} failed, ${results.skipped} skipped`);

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
