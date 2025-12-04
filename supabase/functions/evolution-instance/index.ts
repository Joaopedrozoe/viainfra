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

    // Update the bot_enabled column in database
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({ 
        bot_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName)
      .select()
      .single();

    if (error) {
      console.error('Error updating instance:', error);
      throw error;
    }

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

// Fetch and import chats/contacts from WhatsApp
async function fetchChats(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`📥 Starting import for instance: ${instanceName}`);

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

    // First, check instance connection status
    console.log(`🔍 Checking connection status for ${instanceName}...`);
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      }
    });

    if (!statusResponse.ok) {
      const statusText = await statusResponse.text();
      console.error('❌ Instance not found or not accessible:', statusText);
      return new Response(JSON.stringify({ 
        error: 'Instância não encontrada ou não acessível. Verifique se está conectada.',
        details: statusText
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const statusData = await statusResponse.json();
    console.log(`📡 Instance status:`, JSON.stringify(statusData));

    const connectionState = statusData?.instance?.state || statusData?.state;
    if (connectionState !== 'open' && connectionState !== 'connected') {
      return new Response(JSON.stringify({ 
        error: `Instância não está conectada. Status atual: ${connectionState || 'desconhecido'}`,
        connectionState
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let allContacts: any[] = [];
    let allChats: any[] = [];

    // Try to fetch contacts first
    console.log(`👥 Fetching contacts for ${instanceName}...`);
    try {
      const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({ where: {} })
      });

      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        allContacts = Array.isArray(contactsData) ? contactsData : [];
        console.log(`✅ Fetched ${allContacts.length} contacts`);
      } else {
        console.log(`⚠️ Could not fetch contacts: ${contactsResponse.status}`);
      }
    } catch (contactsError) {
      console.log(`⚠️ Error fetching contacts:`, contactsError);
    }

    // Try to fetch chats
    console.log(`💬 Fetching chats for ${instanceName}...`);
    try {
      const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({})
      });

      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        allChats = Array.isArray(chatsData) ? chatsData : [];
        console.log(`✅ Fetched ${allChats.length} chats`);
      } else {
        console.log(`⚠️ Could not fetch chats: ${chatsResponse.status}`);
      }
    } catch (chatsError) {
      console.log(`⚠️ Error fetching chats:`, chatsError);
    }

    // Combine unique entries from contacts and chats
    const processedPhones = new Set<string>();
    let importedContacts = 0;
    let importedConversations = 0;
    let skippedCount = 0;

    // Helper function to validate phone number (8-15 digits only)
    function isValidPhoneNumber(phone: string): boolean {
      const digitsOnly = phone.replace(/\D/g, '');
      return /^\d{8,15}$/.test(digitsOnly);
    }

    // Helper function to extract valid phone from entry
    // IMPORTANT: Do NOT use entry.id as it's often an internal database ID (cmh...)
    function extractPhoneNumber(entry: any): string | null {
      // Priority order - only fields that should contain phone/WhatsApp IDs
      const phoneFields = [
        entry.remoteJid,      // WhatsApp JID (xxxxx@s.whatsapp.net)
        entry.jid,            // Alternative JID field
        entry.phone,          // Direct phone field
        entry.number,         // Alternative number field
        entry.wid?.user,      // Some APIs nest it in wid.user
      ];

      for (const field of phoneFields) {
        if (!field || typeof field !== 'string') continue;
        
        // Skip groups, internal IDs, broadcasts
        if (field.includes('@g.us') || field.includes('@lid') || field.includes('@broadcast')) {
          continue;
        }

        // Extract number from WhatsApp format
        let phone = field.replace('@s.whatsapp.net', '').replace('@c.us', '');
        
        // Clean any remaining non-digit chars except the phone itself
        phone = phone.replace(/\D/g, '');
        
        // Validate it's actually a phone number
        if (isValidPhoneNumber(phone)) {
          return phone;
        }
      }

      return null;
    }

    // Helper function to process a contact/chat entry
    async function processEntry(entry: any, source: string, isArchived: boolean = false) {
      try {
        // Skip group chats
        if (entry.isGroup) {
          return { skipped: true, reason: 'group' };
        }

        // Extract valid phone number
        const phoneNumber = extractPhoneNumber(entry);
        
        if (!phoneNumber) {
          // Log only first 100 chars to avoid log spam
          console.log(`⏭️ Skip (no valid phone): ${entry.pushName || entry.name || 'unknown'}`);
          return { skipped: true, reason: 'invalid_phone' };
        }
        
        // Skip if already processed
        if (processedPhones.has(phoneNumber)) {
          return { skipped: true, reason: 'duplicate' };
        }
        processedPhones.add(phoneNumber);

        // Get contact name - prefer pushName, then name, then notify
        const contactName = entry.pushName || entry.name || entry.notify || entry.verifiedName || phoneNumber;
        const profilePicUrl = entry.profilePictureUrl || entry.profilePicUrl || entry.imgUrl || null;
        
        // Build proper WhatsApp JID from phone number
        const remoteJid = `${phoneNumber}@s.whatsapp.net`;

        console.log(`📱 Processing: ${contactName} (${phoneNumber})${isArchived ? ' [archived]' : ''}`);

        // Check if contact exists by phone
        let { data: existingContact } = await supabase
          .from('contacts')
          .select('id, name, avatar_url, phone')
          .eq('company_id', companyId)
          .eq('phone', phoneNumber)
          .maybeSingle();

        let contactId;
        let contactCreated = false;

        if (!existingContact) {
          // Create contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              company_id: companyId,
              name: contactName,
              phone: phoneNumber,
              avatar_url: profilePicUrl,
              metadata: { remoteJid, source: `whatsapp_import_${source}` }
            })
            .select()
            .single();

          if (contactError) {
            console.error('❌ Error creating contact:', contactError);
            return { skipped: true, reason: 'contact_error' };
          }
          contactId = newContact.id;
          contactCreated = true;
          console.log(`✅ Created contact: ${contactName} (${phoneNumber})`);
        } else {
          contactId = existingContact.id;
          
          // Update contact name/avatar if better data available
          const updates: any = {};
          if (contactName && contactName !== phoneNumber && existingContact.name === phoneNumber) {
            updates.name = contactName;
          }
          if (profilePicUrl && !existingContact.avatar_url) {
            updates.avatar_url = profilePicUrl;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from('contacts').update(updates).eq('id', contactId);
            console.log(`📝 Updated contact: ${contactName}`);
          }
        }

        // For contacts source, only create the contact, not conversation
        // For chats source, always create conversation - if it's in chats list, it has history
        if (source === 'contacts') {
          return { contactCreated, conversationCreated: false };
        }
        
        // Log chat info for debugging
        console.log(`💬 Chat entry: ${contactName} - archived: ${isArchived}, unread: ${entry.unreadCount || 0}`)

        // Check if conversation already exists for this contact
        let { data: existingConversation } = await supabase
          .from('conversations')
          .select('id, archived, status')
          .eq('company_id', companyId)
          .eq('contact_id', contactId)
          .eq('channel', 'whatsapp')
          .maybeSingle();

        if (existingConversation) {
          // Update existing conversation status based on import
          const updates: any = { updated_at: new Date().toISOString() };
          
          if (isArchived) {
            // If archived in WhatsApp, mark as resolved/archived
            updates.archived = true;
            updates.status = 'resolved';
          } else {
            // If active in WhatsApp, reopen the conversation
            updates.archived = false;
            if (existingConversation.status === 'resolved') {
              updates.status = 'open';
            }
          }
          
          await supabase.from('conversations').update(updates).eq('id', existingConversation.id);
          console.log(`📝 Updated conversation for ${contactName} (${isArchived ? 'archived' : 'active'})`);
          return { contactCreated, conversationCreated: false };
        }

        // Create new conversation only if doesn't exist
        const { error: convError } = await supabase
          .from('conversations')
          .insert({
            company_id: companyId,
            contact_id: contactId,
            channel: 'whatsapp',
            status: isArchived ? 'resolved' : 'open',
            archived: isArchived,
            metadata: { 
              instanceName, 
              remoteJid,
              importedAt: new Date().toISOString()
            }
          });

        if (convError) {
          // If duplicate key error, conversation was created by another concurrent request - that's OK
          if (convError.code === '23505') {
            console.log(`⚠️ Conversation already exists for ${contactName} (concurrent)`);
            return { contactCreated, conversationCreated: false };
          }
          console.error('Error creating conversation:', convError);
          return { contactCreated, conversationCreated: false };
        }
        
        console.log(`💬 Created conversation for ${contactName}${isArchived ? ' (archived)' : ''}`);
        return { contactCreated, conversationCreated: true };
      } catch (entryError) {
        console.error('Error processing entry:', entryError);
        return { skipped: true, reason: 'error' };
      }
    }

    // Process CHATS FIRST (creates conversations) - important to do chats before contacts
    // so that processedPhones doesn't skip chats that were already seen as contacts
    console.log(`📋 Processing ${allChats.length} chats first...`);
    for (const chat of allChats) {
      const isArchived = chat.archive === true || chat.archived === true;
      const result = await processEntry(chat, 'chats', isArchived);
      if (result.skipped) {
        skippedCount++;
      } else {
        if (result.contactCreated) importedContacts++;
        if (result.conversationCreated) importedConversations++;
      }
    }

    // Process contacts second (no conversations created, just creates contact if not exists)
    console.log(`👥 Processing ${allContacts.length} contacts...`);
    for (const contact of allContacts) {
      const result = await processEntry(contact, 'contacts', false);
      if (result.skipped) {
        skippedCount++;
      } else {
        if (result.contactCreated) importedContacts++;
        if (result.conversationCreated) importedConversations++;
      }
    }

    console.log(`✅ Import complete: ${importedContacts} contacts, ${importedConversations} conversations, ${skippedCount} skipped`);

    return new Response(JSON.stringify({ 
      success: true,
      totalContacts: allContacts.length,
      totalChats: allChats.length,
      importedContacts,
      importedConversations,
      skipped: skippedCount,
      message: `${importedContacts} contato(s) importado(s), ${importedConversations} conversa(s) criada(s)`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in fetchChats:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha ao importar conversas', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}