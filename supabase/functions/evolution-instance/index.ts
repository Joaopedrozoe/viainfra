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
      case 'configure-webhook':
        return await configureWebhook(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'toggle-bot':
        return await toggleBot(req, supabase, evolutionApiUrl, evolutionApiKey);
      case 'fetch-chats':
        return await fetchChats(req, supabase, evolutionApiUrl, evolutionApiKey);
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
  const { instanceName, channel = 'baileys' } = await req.json();
  
  if (!instanceName) {
    return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  // Get user's company_id from auth token
  const authHeader = req.headers.get('Authorization');
  let companyId = null;
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      companyId = profile?.company_id;
    }
  }

  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
  
  // Payload compatível com Evolution API v2
  const payload = {
    instanceName,
    token: evolutionApiKey,
    qrcode: true,
    integration: channel === 'baileys' ? 'WHATSAPP-BAILEYS' : 'WHATSAPP-BUSINESS',
    reject_call: false,
    msg_call: '',
    groups_ignore: false,
    always_online: true,
    read_messages: true,
    read_status: true,
    sync_full_history: false,
    webhook: {
      url: webhookUrl,
      by_events: false,
      base64: true,
      headers: {},
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE', 
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED'
      ],
    },
  };

  console.log('Creating instance with payload:', JSON.stringify(payload, null, 2));

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
    console.log('Evolution API create response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      // Save instance to database with company_id
      const instanceData: any = {
        instance_name: instanceName,
        status: 'pending',
        connection_state: 'pending',
        webhook_url: webhookUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (companyId) {
        instanceData.company_id = companyId;
      }

      await supabase
        .from('whatsapp_instances')
        .upsert(instanceData, { onConflict: 'instance_name' });

      console.log('Instance created successfully:', instanceName);

      // Se a criação não retornou QR, buscar imediatamente
      if (!data.qrcode?.base64 && !data.qrcode?.code) {
        console.log('QR not in create response, fetching via connect endpoint...');
        try {
          const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
            headers: {
              'apikey': evolutionApiKey,
            },
          });
          
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            console.log('QR connect response:', JSON.stringify(qrData, null, 2));
            // Merge QR data into response
            data.qrcode = qrData.qrcode || qrData;
          }
        } catch (qrError) {
          console.error('Error fetching QR after create:', qrError);
        }
      }
    } else {
      console.error('Evolution API error:', data);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating instance:', error);
    return new Response(JSON.stringify({ error: 'Failed to create instance' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;

    // Sync each instance to Supabase and configure webhook
    const syncedInstances = [];
    for (const instance of instances) {
      const instanceName = instance.name || instance.instanceName || instance.instance?.instanceName;
      
      if (!instanceName) {
        console.warn('Skipping instance without name:', instance);
        continue;
      }

      // Configure webhook for this instance
      try {
        console.log(`Configuring webhook for instance: ${instanceName}`);
        const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
          }),
        });

        if (webhookResponse.ok) {
          console.log(`Webhook configured successfully for ${instanceName}`);
        } else {
          console.error(`Failed to configure webhook for ${instanceName}:`, await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error(`Error configuring webhook for ${instanceName}:`, webhookError);
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

async function configureWebhook(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response('Instance name is required', { status: 400, headers: corsHeaders });
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
    
    console.log(`Configuring webhook for instance: ${instanceName}`);
    
    const response = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Update webhook_url in database
      await supabase
        .from('whatsapp_instances')
        .update({ 
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      console.log(`Webhook configured successfully for ${instanceName}`);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error configuring webhook:', error);
    return new Response('Failed to configure webhook', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

// Toggle bot on/off for an instance
async function toggleBot(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName, enabled } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Toggling bot for instance ${instanceName}: ${enabled ? 'ON' : 'OFF'}`);

    // Update the instance metadata in database to track bot status
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName)
      .select()
      .single();

    if (error) {
      console.error('Error updating instance:', error);
      throw error;
    }

    // Store bot enabled status in localStorage key format for the webhook to check
    // The webhook will check this to decide whether to process bot responses
    const botStatusKey = `bot_enabled_${instanceName}`;
    
    console.log(`Bot ${enabled ? 'enabled' : 'disabled'} for instance ${instanceName}`);

    return new Response(JSON.stringify({ 
      success: true, 
      instanceName,
      botEnabled: enabled,
      message: enabled ? 'Bot ativado com sucesso' : 'Bot desativado com sucesso'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error toggling bot:', error);
    return new Response(JSON.stringify({ error: 'Failed to toggle bot' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// Fetch and import chats from WhatsApp
async function fetchChats(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Fetching chats for instance: ${instanceName}`);

    // Get user's company_id from auth token
    const authHeader = req.headers.get('Authorization');
    let companyId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();
        
        companyId = profile?.company_id;
      }
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'User company not found' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch chats from Evolution API
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      const errorText = await chatsResponse.text();
      console.error('Error fetching chats from Evolution:', errorText);
      throw new Error(`Failed to fetch chats: ${chatsResponse.status}`);
    }

    const chats = await chatsResponse.json();
    console.log(`Fetched ${chats.length || 0} chats from Evolution API`);

    let importedCount = 0;
    let skippedCount = 0;

    // Process each chat
    for (const chat of chats || []) {
      try {
        // Skip group chats
        if (chat.id?.includes('@g.us') || chat.isGroup) {
          skippedCount++;
          continue;
        }

        // Extract phone number from remoteJid
        const remoteJid = chat.id || chat.remoteJid;
        if (!remoteJid) continue;

        const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
        const contactName = chat.name || chat.pushName || phoneNumber;

        // Check if contact exists
        let { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('company_id', companyId)
          .eq('phone', phoneNumber)
          .single();

        let contactId;
        if (!existingContact) {
          // Create contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              company_id: companyId,
              name: contactName,
              phone: phoneNumber,
              metadata: { remoteJid, source: 'whatsapp_import' }
            })
            .select()
            .single();

          if (contactError) {
            console.error('Error creating contact:', contactError);
            continue;
          }
          contactId = newContact.id;
        } else {
          contactId = existingContact.id;
        }

        // Check if conversation exists
        let { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('company_id', companyId)
          .eq('contact_id', contactId)
          .eq('channel', 'whatsapp')
          .single();

        if (!existingConversation) {
          // Create conversation
          const { error: convError } = await supabase
            .from('conversations')
            .insert({
              company_id: companyId,
              contact_id: contactId,
              channel: 'whatsapp',
              status: 'open',
              metadata: { 
                instanceName, 
                remoteJid,
                importedAt: new Date().toISOString()
              }
            });

          if (convError) {
            console.error('Error creating conversation:', convError);
            continue;
          }
          importedCount++;
        } else {
          skippedCount++;
        }
      } catch (chatError) {
        console.error('Error processing chat:', chatError);
      }
    }

    console.log(`Import complete: ${importedCount} imported, ${skippedCount} skipped`);

    return new Response(JSON.stringify({ 
      success: true,
      totalChats: chats?.length || 0,
      imported: importedCount,
      skipped: skippedCount,
      message: `${importedCount} conversa(s) importada(s), ${skippedCount} ignorada(s)`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch chats' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}