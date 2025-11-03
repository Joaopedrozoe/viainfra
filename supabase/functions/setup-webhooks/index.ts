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

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response('Evolution API configuration missing', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
    
    console.log('Starting webhook configuration for all instances');
    console.log('Webhook URL:', webhookUrl);

    // Get all instances from database
    const { data: instances, error: dbError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'open');

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Database error', details: dbError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${instances?.length || 0} instances to configure`);

    const results = [];

    for (const instance of instances || []) {
      console.log(`\n=== Configuring webhook for ${instance.instance_name} ===`);
      
      try {
        const webhookPayload = {
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
          }
        };

        console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));

        const response = await fetch(`${evolutionApiUrl}/webhook/set/${instance.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify(webhookPayload),
        });

        const responseText = await response.text();
        console.log(`Response status: ${response.status}`);
        console.log('Response body:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { raw: responseText };
        }

        if (response.ok) {
          console.log(`✅ Webhook configured successfully for ${instance.instance_name}`);
          
          // Update database
          await supabase
            .from('whatsapp_instances')
            .update({ 
              webhook_url: webhookUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);

          results.push({
            instance: instance.instance_name,
            success: true,
            data
          });
        } else {
          console.error(`❌ Failed to configure webhook for ${instance.instance_name}`);
          results.push({
            instance: instance.instance_name,
            success: false,
            error: data,
            status: response.status
          });
        }
      } catch (error) {
        console.error(`Error configuring ${instance.instance_name}:`, error);
        results.push({
          instance: instance.instance_name,
          success: false,
          error: error.message
        });
      }
    }

    console.log('\n=== Configuration Summary ===');
    console.log(`Total instances: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);

    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    }, null, 2), {
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
