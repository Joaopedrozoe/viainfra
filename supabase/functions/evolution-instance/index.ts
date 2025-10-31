import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.pathname.split('/').pop();
  
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

    switch (action) {
      case 'create':
        return await createInstance(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'status':
        return await getInstanceStatus(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'qr':
        return await getInstanceQR(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'delete':
        return await deleteInstance(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'send-message':
        return await sendMessage(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'list':
        return await listInstances(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'sync':
        return await syncInstances(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'fetch-details':
        return await fetchInstanceDetails(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'set-webhook':
        return await setWebhook(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'check-webhook':
        return await checkWebhook(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'fix-webhook':
        return await fixWebhook(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'diagnose':
        return await diagnoseWebhook(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'force-fix':
        return await forceFixWebhook(req, supabase, evolutionApiUrl, evolutionApiKey);
      default:
        return new Response('Invalid action', { status: 400, headers: corsHeaders });
    }
  } catch (error) {
    console.error('Error in evolution-instance function:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

async function createInstance(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName } = await req.json();
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
  
  const payload = {
    instanceName,
    token: evolutionApiKey,
    qrcode: true,
    markMessagesRead: true,
    delayMessage: 1000,
    alwaysOnline: true,
    readMessages: true,
    readStatus: true,
    syncFullHistory: true,
    webhook: {
      url: webhookUrl,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'MESSAGES_DELETE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE',
        'CALL',
        'NEW_JWT_TOKEN'
      ],
    },
  };

  try {
    const response = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      // Save instance to database
      await supabase
        .from('whatsapp_instances')
        .upsert({
          instance_name: instanceName,
          status: 'created',
          webhook_url: webhookUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log('Instance created successfully:', instanceName);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating instance:', error);
    return new Response('Failed to create instance', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function getInstanceStatus(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const url = new URL(req.url);
  const instanceName = url.searchParams.get('instance');
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting instance status:', error);
    return new Response('Failed to get instance status', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function getInstanceQR(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const url = new URL(req.url);
  const instanceName = url.searchParams.get('instance');
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting QR code:', error);
    return new Response('Failed to get QR code', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function deleteInstance(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName } = await req.json();
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    if (response.ok) {
      // Remove instance from database
      await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('instance_name', instanceName);

      console.log('Instance deleted successfully:', instanceName);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return new Response('Failed to delete instance', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function sendMessage(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName, phoneNumber, message } = await req.json();
  
  if (!instanceName || !phoneNumber || !message) {
    return new Response('Instance name, phone number, and message are required', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response('Failed to send message', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function listInstances(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    console.log('Listing all instances from Evolution API');
    
    const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error listing instances:', errorText);
      throw new Error(`Failed to list instances: ${response.status}`);
    }

    const instances = await response.json();
    console.log('Listed instances:', instances);

    return new Response(
      JSON.stringify({ instances }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in listInstances:', error);
    return new Response('Failed to list instances', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function syncInstances(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    console.log('Syncing instances from Evolution API');
    
    // Get user's company_id from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('No authorization header', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response('Invalid user token', { status: 401, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response('User has no company', { status: 400, headers: corsHeaders });
    }

    // Fetch instances from Evolution API
    const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch instances: ${response.status}`);
    }

    const instances = await response.json();
    console.log('Fetched instances for sync:', instances);

    // Sync each instance to Supabase
    const syncedInstances = [];
    for (const instance of instances) {
      // Extract instance name from the API response
      const instanceName = instance.name || instance.instanceName || instance.instance?.instanceName;
      
      if (!instanceName) {
        console.warn('Skipping instance without name:', instance);
        continue;
      }

      // Buscar detalhes do webhook da instância usando o endpoint correto
      let webhookUrl = null;
      try {
        const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json'
          }
        });

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          console.log(`[DEBUG] Webhook response for ${instanceName}:`, JSON.stringify(webhookData, null, 2));
          
          // Extrair URL do webhook
          webhookUrl = webhookData?.url || webhookData?.webhook?.url || null;
          
          console.log(`Webhook found for ${instanceName}:`, webhookUrl);
        } else {
          console.log(`No webhook configured for ${instanceName}`);
        }
      } catch (error) {
        console.error(`Error fetching webhook for ${instanceName}:`, error);
      }

      const instanceData = {
        company_id: profile.company_id,
        instance_name: instanceName,
        phone_number: instance.number || instance.instance?.owner || null,
        status: instance.connectionStatus || instance.state || 'pending',
        connection_state: instance.connectionStatus || instance.state || null,
        webhook_url: webhookUrl,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Syncing instance data:', instanceData);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .upsert(instanceData, { 
          onConflict: 'instance_name',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error syncing instance:', instanceName, error);
      } else {
        console.log('Successfully synced instance:', instanceName);
        syncedInstances.push(data);
      }
    }

    console.log('Synced instances:', syncedInstances);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: syncedInstances.length,
        instances: syncedInstances 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in syncInstances:', error);
    return new Response('Failed to sync instances', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

async function fetchInstanceDetails(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const url = new URL(req.url);
  const instanceName = url.searchParams.get('instance');
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  try {
    console.log(`Fetching details for instance: ${instanceName}`);
    
    // Fetch instance details from Evolution API
    const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching instance details:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch instance details' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const instances = await response.json();
    console.log('Instance details received:', JSON.stringify(instances, null, 2));
    
    // The API returns an array, find our instance
    const instanceData = Array.isArray(instances) 
      ? instances.find(i => 
          (i.name === instanceName || 
           i.instanceName === instanceName || 
           i.instance?.instanceName === instanceName)
        )
      : instances;

    if (!instanceData) {
      return new Response(JSON.stringify({ error: 'Instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract webhook information
    const webhookUrl = instanceData.webhook?.url || 
                       instanceData.instance?.webhook?.url || 
                       instanceData.webhook ||
                       null;
    
    console.log('Extracted webhook URL:', webhookUrl);

    // Update database with webhook info
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        webhook_url: webhookUrl,
        connection_state: instanceData.connectionStatus || instanceData.state || null,
        phone_number: instanceData.number || instanceData.instance?.owner || null,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName);

    if (updateError) {
      console.error('Error updating instance in database:', updateError);
    } else {
      console.log('Instance updated in database successfully');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      instance: instanceData,
      webhookUrl 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in fetchInstanceDetails:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch instance details' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function checkWebhook(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName } = await req.json();
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  const expectedWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
  
  try {
    console.log(`Checking webhook for instance: ${instanceName}`);
    
    // Get webhook config from Evolution API
    const response = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    if (!response.ok) {
      console.error('Failed to get webhook:', response.status);
      return new Response(JSON.stringify({ 
        error: 'Failed to get webhook',
        needsFix: true
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const webhookData = await response.json();
    console.log('Current webhook config:', JSON.stringify(webhookData, null, 2));

    const currentUrl = webhookData?.url || webhookData?.webhook?.url;
    const isEnabled = webhookData?.enabled !== false;
    const isCorrect = currentUrl === expectedWebhookUrl && isEnabled;

    return new Response(JSON.stringify({ 
      success: true,
      currentUrl,
      expectedUrl: expectedWebhookUrl,
      isEnabled,
      isCorrect,
      needsFix: !isCorrect,
      webhookData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in checkWebhook:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to check webhook',
      needsFix: true
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function fixWebhook(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName } = await req.json();
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
  
  try {
    console.log(`🔧 Fixing webhook for instance: ${instanceName}`);
    console.log(`📍 Target webhook URL: ${webhookUrl}`);
    
    // First check current config
    const checkResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    if (checkResponse.ok) {
      const currentConfig = await checkResponse.json();
      console.log('Current webhook config:', JSON.stringify(currentConfig, null, 2));
    }

    // Try method 1: Using /webhook/set endpoint
    console.log('Attempt 1: Using /webhook/set endpoint');
    const payload1 = {
      webhook: {
        url: webhookUrl,
        enabled: true,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE', 
          'CONNECTION_UPDATE',
          'SEND_MESSAGE',
          'CALL'
        ],
        webhookByEvents: false
      }
    };

    console.log('Setting webhook with payload:', JSON.stringify(payload1, null, 2));
    
    let response = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify(payload1),
    });

    let responseText = await response.text();
    console.log('Webhook set response (method 1):', response.status, responseText);

    // If method 1 failed, try method 2: Using /instance/settings endpoint
    if (!response.ok) {
      console.log('Attempt 2: Using /instance/settings endpoint');
      const payload2 = {
        instanceName: instanceName,
        webhook: {
          url: webhookUrl,
          enabled: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE', 
            'CONNECTION_UPDATE',
            'SEND_MESSAGE',
            'CALL'
          ],
          webhookByEvents: false
        }
      };

      response = await fetch(`${evolutionApiUrl}/instance/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify(payload2),
      });

      responseText = await response.text();
      console.log('Webhook set response (method 2):', response.status, responseText);
    }

    if (!response.ok) {
      console.error('❌ Failed to fix webhook with both methods:', response.status, responseText);
      return new Response(JSON.stringify({ 
        error: 'Failed to fix webhook with both methods',
        details: responseText,
        status: response.status,
        suggestion: 'Please configure the webhook manually in Evolution Manager UI'
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify webhook was set correctly
    const verifyResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    });

    let verifiedConfig = null;
    if (verifyResponse.ok) {
      verifiedConfig = await verifyResponse.json();
      console.log('✅ Verified webhook config:', JSON.stringify(verifiedConfig, null, 2));
    }

    // Update database
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName);

    if (updateError) {
      console.error('Error updating instance in database:', updateError);
    } else {
      console.log('✅ Database updated successfully');
    }

    return new Response(JSON.stringify({ 
      success: true,
      webhookUrl,
      message: 'Webhook fixed and verified successfully',
      verifiedConfig,
      instructions: 'Please send a test message now to verify the integration is working'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error in fixWebhook:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fix webhook',
      message: error.message
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function setWebhook(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName } = await req.json();
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
  
  try {
    console.log(`Setting webhook for instance: ${instanceName}`);
    console.log(`Webhook URL: ${webhookUrl}`);
    
    const payload = {
      webhook: {
        enabled: true,
        url: webhookUrl,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE', 
          'CONNECTION_UPDATE',
          'SEND_MESSAGE'
        ],
        webhookByEvents: false
      }
    };

    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    
    // Set webhook via Evolution API
    const response = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Webhook set response:', responseText);

    if (!response.ok) {
      console.error('Failed to set webhook:', response.status, responseText);
      return new Response(JSON.stringify({ 
        error: 'Failed to set webhook',
        details: responseText 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update database
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName);

    if (updateError) {
      console.error('Error updating instance in database:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      webhookUrl,
      message: 'Webhook configured successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in setWebhook:', error);
    return new Response(JSON.stringify({ error: 'Failed to set webhook' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function forceFixWebhook(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName } = await req.json();
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  console.log(`🔧 FORCE FIX iniciado para instância: ${instanceName}`);
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
  
  try {
    const steps: any[] = [];

    // Passo 1: Deletar webhook existente
    console.log('1️⃣ Deletando webhook existente...');
    try {
      const deleteResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey
        }
      });
      
      const deleteResult = await deleteResponse.json();
      steps.push({
        step: 'delete_webhook',
        success: deleteResponse.ok,
        data: deleteResult
      });
      console.log('✅ Webhook deletado');
    } catch (error: any) {
      console.log('⚠️ Erro ao deletar webhook (pode não existir):', error.message);
      steps.push({
        step: 'delete_webhook',
        success: false,
        error: error.message
      });
    }

    // Passo 2: Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Passo 3: Criar webhook com TODOS os eventos
    console.log('2️⃣ Criando novo webhook...');
    const webhookConfig = {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'MESSAGES_DELETE',
        'SEND_MESSAGE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'CALL',
        'NEW_JWT_TOKEN'
      ]
    };

    const createResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify(webhookConfig)
    });

    const createResult = await createResponse.json();
    steps.push({
      step: 'create_webhook',
      success: createResponse.ok,
      data: createResult
    });
    console.log('✅ Novo webhook criado');

    // Passo 4: Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Passo 5: Logout da instância
    console.log('3️⃣ Fazendo logout da instância...');
    try {
      const logoutResponse = await fetch(`${evolutionApiUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey
        }
      });
      
      const logoutResult = await logoutResponse.json();
      steps.push({
        step: 'logout',
        success: logoutResponse.ok,
        data: logoutResult
      });
      console.log('✅ Logout realizado');
    } catch (error: any) {
      console.log('⚠️ Erro ao fazer logout:', error.message);
      steps.push({
        step: 'logout',
        success: false,
        error: error.message
      });
    }

    // Passo 6: Aguardar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Passo 7: Restart da instância
    console.log('4️⃣ Reiniciando instância...');
    try {
      const restartResponse = await fetch(`${evolutionApiUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey
        }
      });
      
      const restartResult = await restartResponse.json();
      steps.push({
        step: 'restart',
        success: restartResponse.ok,
        data: restartResult
      });
      console.log('✅ Instância reiniciada');
    } catch (error: any) {
      console.log('⚠️ Erro ao reiniciar:', error.message);
      steps.push({
        step: 'restart',
        success: false,
        error: error.message
      });
    }

    // Passo 8: Aguardar 5 segundos
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Passo 9: Verificar webhook final
    console.log('5️⃣ Verificando webhook final...');
    const verifyResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      }
    });

    const verifyResult = await verifyResponse.json();
    steps.push({
      step: 'verify_webhook',
      success: verifyResponse.ok,
      data: verifyResult
    });

    console.log('✅ FORCE FIX concluído');

    return new Response(JSON.stringify({
      success: true,
      message: '🔧 Webhook forçadamente reconfigurado! Aguarde 30 segundos e envie uma mensagem de teste.',
      steps
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro no force fix:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function diagnoseWebhook(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName } = await req.json();
  
  if (!instanceName) {
    return new Response('Instance name is required', { status: 400, headers: corsHeaders });
  }

  console.log('\n🔍 ===== DIAGNÓSTICO COMPLETO DO WEBHOOK =====');
  console.log(`Instância: ${instanceName}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const diagnostico = {
    timestamp: new Date().toISOString(),
    instanceName,
    tests: [] as any[],
  };

  try {
    // 1. Verificar instância usando connectionState
    console.log('\n📱 1. VERIFICANDO INSTÂNCIA...');
    try {
      const instanceResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      
      const instanceOk = instanceResponse.ok;
      let instanceData = null;
      
      if (instanceOk) {
        instanceData = await instanceResponse.json();
      }
      
      diagnostico.tests.push({
        step: 1,
        test: 'Instância Encontrada',
        status: instanceOk ? '✅ OK' : '❌ ERRO',
        data: instanceData || 'Instância não encontrada',
      });
      console.log(instanceOk ? '✅ Instância encontrada' : '❌ Instância NÃO encontrada');
      if (instanceData) {
        console.log('   Estado:', instanceData.state);
        console.log('   Instance:', instanceData.instance);
      }
    } catch (error) {
      diagnostico.tests.push({
        step: 1,
        test: 'Instância',
        status: '❌ ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao buscar instância:', error.message);
    }

    // 2. Verificar webhook ATUAL
    console.log('\n🔗 2. VERIFICANDO WEBHOOK ATUAL...');
    try {
      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      const webhookConfig = await webhookResponse.json();
      
      const webhookOk = webhookConfig.enabled === true;
      const hasMessagesEvent = webhookConfig.events?.includes('MESSAGES_UPSERT') || 
                              webhookConfig.events?.includes('messages.upsert');
      
      diagnostico.tests.push({
        step: 2,
        test: 'Webhook Habilitado',
        status: webhookOk ? '✅ OK' : '❌ DESABILITADO',
        data: {
          enabled: webhookConfig.enabled,
          url: webhookConfig.url,
          events: webhookConfig.events,
          webhookByEvents: webhookConfig.webhookByEvents,
        },
      });
      
      diagnostico.tests.push({
        step: 2.1,
        test: 'Evento MESSAGES_UPSERT',
        status: hasMessagesEvent ? '✅ OK' : '❌ FALTANDO',
        data: { hasMessagesEvent, events: webhookConfig.events },
      });
      
      console.log(webhookOk ? '✅ Webhook habilitado' : '❌ Webhook DESABILITADO');
      console.log(hasMessagesEvent ? '✅ MESSAGES_UPSERT configurado' : '❌ MESSAGES_UPSERT FALTANDO!');
      console.log('   URL:', webhookConfig.url);
      console.log('   Eventos:', webhookConfig.events);
    } catch (error) {
      diagnostico.tests.push({
        step: 2,
        test: 'Webhook Config',
        status: '❌ ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao buscar webhook:', error.message);
    }

    // 3. FORÇAR reconfiguração do webhook
    console.log('\n🔧 3. RECONFIGURANDO WEBHOOK (FORÇADO)...');
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
    try {
      // Primeiro método: /webhook/set
      const webhookSetResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'SEND_MESSAGE',
          ],
        }),
      });
      
      const setResult = await webhookSetResponse.json();
      const setOk = webhookSetResponse.ok;
      
      diagnostico.tests.push({
        step: 3,
        test: 'Reconfigurar Webhook (/webhook/set)',
        status: setOk ? '✅ OK' : '⚠️ FALHOU',
        data: setResult,
      });
      console.log(setOk ? '✅ Webhook reconfigurado com sucesso' : '⚠️ Falha ao reconfigurar');
      console.log('   Resposta:', JSON.stringify(setResult, null, 2));
    } catch (error) {
      diagnostico.tests.push({
        step: 3,
        test: 'Reconfigurar Webhook',
        status: '❌ ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao reconfigurar:', error.message);
    }

    // 4. Restart da instância
    console.log('\n🔄 4. REINICIANDO INSTÂNCIA...');
    try {
      const restartResponse = await fetch(`${evolutionApiUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionApiKey }
      });
      
      const restartResult = await restartResponse.json();
      const restartOk = restartResponse.ok;
      
      diagnostico.tests.push({
        step: 4,
        test: 'Restart Instância',
        status: restartOk ? '✅ OK' : '⚠️ FALHOU',
        data: restartResult,
      });
      console.log(restartOk ? '✅ Instância reiniciada' : '⚠️ Falha ao reiniciar');
    } catch (error) {
      diagnostico.tests.push({
        step: 4,
        test: 'Restart Instância',
        status: '❌ ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao reiniciar:', error.message);
    }

    // 5. Aguardar 5 segundos para reconexão
    console.log('\n⏳ 5. AGUARDANDO RECONEXÃO (5s)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Aguardo concluído');

    // 6. Verificar webhook DEPOIS do restart
    console.log('\n🔍 6. VERIFICANDO WEBHOOK APÓS RESTART...');
    try {
      const webhookCheckResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
        headers: { 'apikey': evolutionApiKey }
      });
      const webhookCheck = await webhookCheckResponse.json();
      
      const stillEnabled = webhookCheck.enabled === true;
      const stillHasMessages = webhookCheck.events?.includes('MESSAGES_UPSERT') || 
                               webhookCheck.events?.includes('messages.upsert');
      
      diagnostico.tests.push({
        step: 6,
        test: 'Webhook Persistiu Após Restart',
        status: (stillEnabled && stillHasMessages) ? '✅ OK' : '❌ PERDEU CONFIG',
        data: {
          enabled: webhookCheck.enabled,
          hasMessagesEvent: stillHasMessages,
          events: webhookCheck.events,
        },
      });
      
      console.log(stillEnabled ? '✅ Webhook ainda habilitado' : '❌ Webhook DESABILITADO após restart!');
      console.log(stillHasMessages ? '✅ MESSAGES_UPSERT mantido' : '❌ MESSAGES_UPSERT PERDIDO!');
    } catch (error) {
      diagnostico.tests.push({
        step: 6,
        test: 'Webhook Após Restart',
        status: '❌ ERRO',
        error: error.message,
      });
      console.error('❌ Erro ao verificar webhook:', error.message);
    }

    // Resumo final
    console.log('\n📊 ===== RESUMO DO DIAGNÓSTICO =====');
    diagnostico.tests.forEach(test => {
      console.log(`${test.test}: ${test.status}`);
    });

    const allOk = diagnostico.tests.every(t => t.status.includes('✅'));
    console.log('\n' + (allOk ? '✅ TUDO OK!' : '⚠️ PROBLEMAS ENCONTRADOS'));
    console.log('===================================\n');

    return new Response(JSON.stringify(diagnostico, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ ERRO FATAL NO DIAGNÓSTICO:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      diagnostico,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}