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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { instanceName = 'VIAINFRAOFICIAL', companyId } = await req.json().catch(() => ({}));
    
    console.log(`🔧 Fixing conversations for instance: ${instanceName}`);

    // Get conversations with missing instanceName
    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id, contact_id, metadata, channel')
      .eq('channel', 'whatsapp')
      .is('metadata->instanceName', null);

    if (fetchError) {
      console.error('Error fetching conversations:', fetchError);
      return new Response(JSON.stringify({ error: fetchError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${conversations?.length || 0} conversations without instanceName`);

    const results = {
      updated: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const conv of conversations || []) {
      const newMetadata = {
        ...(conv.metadata || {}),
        instanceName: instanceName
      };

      const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
          metadata: newMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', conv.id);

      if (updateError) {
        console.error(`Error updating conversation ${conv.id}:`, updateError);
        results.errors++;
        results.details.push({ id: conv.id, error: updateError.message });
      } else {
        console.log(`✅ Updated conversation ${conv.id} with instanceName: ${instanceName}`);
        results.updated++;
        results.details.push({ id: conv.id, status: 'updated' });
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Errors: ${results.errors}`);

    return new Response(JSON.stringify({
      success: true,
      instanceName,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
