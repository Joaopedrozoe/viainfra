import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// IMPORTANTE: Instâncias autorizadas para operações
const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
      case 'sync-messages':
        return await syncMessages(req, supabase, evolutionApiUrl, evolutionApiKey);
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
      events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
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

      if (!data.qrcode?.base64 && !data.qrcode?.code) {
        try {
          const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
            headers: { 'apikey': evolutionApiKey },
          });
          
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            data.qrcode = qrData.qrcode || qrData;
          }
        } catch (qrError) {
          console.error('Error fetching QR after create:', qrError);
        }
      }
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
      headers: { 'apikey': evolutionApiKey },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting instance status:', error);
    return new Response('Failed to get instance status', { status: 500, headers: corsHeaders });
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
      headers: { 'apikey': evolutionApiKey },
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting QR code:', error);
    return new Response('Failed to get QR code', { status: 500, headers: corsHeaders });
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
      headers: { 'apikey': evolutionApiKey },
    });

    if (response.ok) {
      await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('instance_name', instanceName);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting instance:', error);
    return new Response('Failed to delete instance', { status: 500, headers: corsHeaders });
  }
}

async function sendMessage(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  const { instanceName, phoneNumber, message } = await req.json();
  
  if (!instanceName || !phoneNumber || !message) {
    return new Response('Instance name, phone number, and message are required', { 
      status: 400, headers: corsHeaders 
    });
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({ number: phoneNumber, text: message }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response('Failed to send message', { status: 500, headers: corsHeaders });
  }
}

async function listInstances(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to list instances: ${response.status}`);
    }

    const instances = await response.json();

    return new Response(
      JSON.stringify({ instances }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in listInstances:', error);
    return new Response('Failed to list instances', { status: 500, headers: corsHeaders });
  }
}

async function syncInstances(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
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

    const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch instances: ${response.status}`);
    }

    const instances = await response.json();
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
    const syncedInstances = [];

    for (const instance of instances) {
      const instanceName = instance.name || instance.instanceName || instance.instance?.instanceName;
      
      if (!instanceName) continue;

      try {
        await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
          }),
        });
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

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .upsert(instanceData, { onConflict: 'instance_name', ignoreDuplicates: false })
        .select()
        .single();

      if (!error) {
        syncedInstances.push(data);
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: syncedInstances.length, instances: syncedInstances }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in syncInstances:', error);
    return new Response('Failed to sync instances', { status: 500, headers: corsHeaders });
  }
}

async function configureWebhook(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response('Instance name is required', { status: 400, headers: corsHeaders });
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
    
    const response = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
      }),
    });

    const data = await response.json();

    if (response.ok) {
      await supabase
        .from('whatsapp_instances')
        .update({ webhook_url: webhookUrl, updated_at: new Date().toISOString() })
        .eq('instance_name', instanceName);
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error configuring webhook:', error);
    return new Response('Failed to configure webhook', { status: 500, headers: corsHeaders });
  }
}

async function toggleBot(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName, enabled } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data, error } = await supabase
      .from('whatsapp_instances')
      .update({ bot_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('instance_name', instanceName)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true, instanceName, botEnabled: enabled,
      message: enabled ? 'Bot ativado com sucesso' : 'Bot desativado com sucesso'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error toggling bot:', error);
    return new Response(JSON.stringify({ error: 'Failed to toggle bot' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================================
// FETCH CHATS - IMPORTAÇÃO COMPLETA PROFISSIONAL
// ============================================================
async function fetchChats(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`\n========================================`);
    console.log(`📥 IMPORTAÇÃO COMPLETA: ${instanceName}`);
    console.log(`========================================\n`);

    // Get instance record
    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id, connection_state')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;

    // Verify user access
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();
        
        if (!userProfile) {
          return new Response(JSON.stringify({ error: 'Acesso não autorizado' }), { 
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      }
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Empresa não encontrada' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check connection status
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey }
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({ error: 'Instância não acessível' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const statusData = await statusResponse.json();
    const connectionState = statusData?.instance?.state || statusData?.state;
    
    if (connectionState !== 'open' && connectionState !== 'connected') {
      return new Response(JSON.stringify({ 
        error: `Instância não conectada: ${connectionState || 'desconhecido'}`
      }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ============================================================
    // FETCH ALL DATA FROM EVOLUTION API
    // ============================================================
    
    let allContacts: any[] = [];
    let allChats: any[] = [];

    // Fetch contacts
    console.log(`👥 Buscando contatos...`);
    try {
      const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
        body: JSON.stringify({ where: {} })
      });

      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        allContacts = Array.isArray(contactsData) ? contactsData : [];
        console.log(`✅ ${allContacts.length} contatos encontrados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro ao buscar contatos:`, e);
    }

    // Fetch chats
    console.log(`💬 Buscando chats...`);
    try {
      const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
        body: JSON.stringify({})
      });

      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        allChats = Array.isArray(chatsData) ? chatsData : [];
        console.log(`✅ ${allChats.length} chats encontrados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro ao buscar chats:`, e);
    }

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    function normalizePhone(phone: string): string {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith('55')) {
        return '55' + digits;
      }
      return digits;
    }

    function isValidPhone(phone: string): boolean {
      const digits = phone.replace(/\D/g, '');
      return /^\d{10,15}$/.test(digits);
    }

    function extractMessageContent(msg: any): { content: string; type: string } {
      const m = msg?.message || msg;
      if (!m) return { content: '', type: 'unknown' };

      if (m.conversation) return { content: m.conversation, type: 'text' };
      if (m.extendedTextMessage?.text) return { content: m.extendedTextMessage.text, type: 'text' };
      if (m.text) return { content: m.text, type: 'text' };
      if (m.body) return { content: m.body, type: 'text' };
      if (m.imageMessage) return { content: m.imageMessage.caption || '📷 Imagem', type: 'image' };
      if (m.videoMessage) return { content: m.videoMessage.caption || '🎬 Vídeo', type: 'video' };
      if (m.audioMessage) return { content: '🎵 Áudio', type: 'audio' };
      if (m.documentMessage) return { content: `📄 ${m.documentMessage.fileName || 'Documento'}`, type: 'document' };
      if (m.stickerMessage) return { content: '🎨 Sticker', type: 'sticker' };
      if (m.contactMessage) return { content: `👤 Contato: ${m.contactMessage.displayName || 'N/A'}`, type: 'contact' };
      if (m.locationMessage) return { content: '📍 Localização', type: 'location' };
      
      return { content: '[Mensagem]', type: 'other' };
    }

    // Build contacts lookup map from Evolution API contacts (for name resolution)
    const contactsNameMap = new Map<string, string>();
    for (const contact of allContacts) {
      const jid = contact.remoteJid || contact.jid;
      const name = contact.pushName || contact.name || contact.notify || contact.verifiedName;
      if (jid && name) {
        const phone = jid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');
        if (phone) {
          contactsNameMap.set(phone, name);
          contactsNameMap.set(normalizePhone(phone), name);
        }
      }
    }
    console.log(`📇 Mapa de nomes criado: ${contactsNameMap.size} entradas`);

    // ============================================================
    // PROCESS ALL CHATS
    // ============================================================

    const stats = {
      contactsCreated: 0,
      contactsUpdated: 0,
      conversationsCreated: 0,
      conversationsUpdated: 0,
      messagesImported: 0,
      groupsCreated: 0,
      skipped: 0
    };

    const processedPhones = new Set<string>();
    const processedGroups = new Set<string>();

    // Sort chats by most recent first
    const sortedChats = allChats.sort((a: any, b: any) => {
      const tsA = a.updatedAt || a.lastMsgTimestamp || 0;
      const tsB = b.updatedAt || b.lastMsgTimestamp || 0;
      return new Date(tsB).getTime() - new Date(tsA).getTime();
    });

    console.log(`\n📋 Processando ${sortedChats.length} chats...\n`);

    for (const chat of sortedChats) {
      try {
        const jid = chat.remoteJid || chat.id || chat.jid || '';
        
        // Skip broadcasts and status
        if (jid.includes('@broadcast') || jid.startsWith('status@')) {
          stats.skipped++;
          continue;
        }

        const isGroup = jid.includes('@g.us');
        const isArchived = chat.archive === true || chat.archived === true;

        // ============================================================
        // PROCESS GROUPS
        // ============================================================
        if (isGroup) {
          if (processedGroups.has(jid)) continue;
          processedGroups.add(jid);

          let groupName = chat.subject || chat.name || chat.pushName;
          
          // Try to get group name from API if not available
          if (!groupName) {
            try {
              const groupInfoResponse = await fetch(`${evolutionApiUrl}/group/findGroupInfos/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify({ groupJid: jid })
              });
              
              if (groupInfoResponse.ok) {
                const groupInfo = await groupInfoResponse.json();
                groupName = groupInfo?.subject || groupInfo?.name;
              }
            } catch (e) {
              // Ignore error
            }
          }

          groupName = groupName || `Grupo ${jid.split('@')[0].slice(-8)}`;
          console.log(`👥 Grupo: ${groupName}`);

          // Find or create group contact
          let { data: existingGroupContact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('metadata->>remoteJid', jid)
            .maybeSingle();

          let contactId;
          
          if (!existingGroupContact) {
            const { data: newContact, error } = await supabase
              .from('contacts')
              .insert({
                company_id: companyId,
                name: groupName,
                phone: null,
                avatar_url: chat.profilePictureUrl || chat.profilePicUrl || null,
                metadata: { remoteJid: jid, isGroup: true, source: 'whatsapp_import' }
              })
              .select()
              .single();

            if (error) {
              console.error(`❌ Erro ao criar grupo ${groupName}:`, error);
              stats.skipped++;
              continue;
            }
            contactId = newContact.id;
            stats.groupsCreated++;
          } else {
            contactId = existingGroupContact.id;
            if (groupName !== existingGroupContact.name) {
              await supabase.from('contacts').update({ name: groupName }).eq('id', contactId);
            }
          }

          // Find or create conversation
          let { data: existingConv } = await supabase
            .from('conversations')
            .select('id, archived, status')
            .eq('company_id', companyId)
            .eq('contact_id', contactId)
            .eq('channel', 'whatsapp')
            .maybeSingle();

          let conversationId;
          
          if (!existingConv) {
            const { data: newConv, error } = await supabase
              .from('conversations')
              .insert({
                company_id: companyId,
                contact_id: contactId,
                channel: 'whatsapp',
                status: isArchived ? 'resolved' : 'open',
                archived: isArchived,
                metadata: { instanceName, remoteJid: jid, isGroup: true }
              })
              .select()
              .single();

            if (error) {
              console.error(`❌ Erro ao criar conversa grupo:`, error);
              continue;
            }
            conversationId = newConv.id;
            stats.conversationsCreated++;
          } else {
            conversationId = existingConv.id;
            if (isArchived !== existingConv.archived) {
              await supabase.from('conversations')
                .update({ archived: isArchived, status: isArchived ? 'resolved' : 'open' })
                .eq('id', conversationId);
              stats.conversationsUpdated++;
            }
          }

          // Sync group messages
          const msgCount = await syncMessagesForConversation(
            supabase, evolutionApiUrl, evolutionApiKey, instanceName,
            conversationId, jid, extractMessageContent
          );
          stats.messagesImported += msgCount;
          
          continue;
        }

        // ============================================================
        // PROCESS INDIVIDUAL CHATS
        // ============================================================
        
        // Extract phone number
        let phone = '';
        if (jid.includes('@s.whatsapp.net') || jid.includes('@c.us')) {
          phone = jid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');
        } else if (chat.phone) {
          phone = String(chat.phone).replace(/\D/g, '');
        }

        // Skip @lid without phone
        if (jid.includes('@lid') && !phone) {
          // Try to find phone from pushName match
          const pushName = chat.pushName || chat.name;
          if (pushName) {
            for (const [p, n] of contactsNameMap.entries()) {
              if (n.toLowerCase() === pushName.toLowerCase()) {
                phone = p;
                break;
              }
            }
          }
        }

        if (!phone || !isValidPhone(phone)) {
          stats.skipped++;
          continue;
        }

        const normalizedPhone = normalizePhone(phone);
        
        if (processedPhones.has(normalizedPhone)) {
          continue;
        }
        processedPhones.add(normalizedPhone);

        // Get contact name - PRIORITY: pushName from chat > contacts map > phone
        let contactName = chat.pushName || chat.name || chat.notify || chat.verifiedName;
        
        if (!contactName || contactName === normalizedPhone || /^\d+$/.test(contactName)) {
          contactName = contactsNameMap.get(normalizedPhone) || 
                       contactsNameMap.get(phone) || 
                       normalizedPhone;
        }

        const profilePicUrl = chat.profilePictureUrl || chat.profilePicUrl || chat.imgUrl || null;
        const whatsappJid = `${normalizedPhone}@s.whatsapp.net`;

        console.log(`📱 ${contactName} (${normalizedPhone})${isArchived ? ' [arquivado]' : ''}`);

        // Find or create contact
        let { data: existingContact } = await supabase
          .from('contacts')
          .select('id, name, avatar_url, phone')
          .eq('company_id', companyId)
          .or(`phone.eq.${normalizedPhone},phone.eq.${phone}`)
          .limit(1)
          .maybeSingle();

        let contactId;
        
        if (!existingContact) {
          const { data: newContact, error } = await supabase
            .from('contacts')
            .insert({
              company_id: companyId,
              name: contactName,
              phone: normalizedPhone,
              avatar_url: profilePicUrl,
              metadata: { remoteJid: whatsappJid, source: 'whatsapp_import' }
            })
            .select()
            .single();

          if (error) {
            console.error(`❌ Erro ao criar contato ${contactName}:`, error);
            stats.skipped++;
            continue;
          }
          contactId = newContact.id;
          stats.contactsCreated++;
        } else {
          contactId = existingContact.id;
          
          // Update contact if we have better data
          const updates: any = {};
          const nameIsJustPhone = !existingContact.name || 
            existingContact.name === existingContact.phone || 
            /^\d+$/.test(existingContact.name);
          
          if (contactName && nameIsJustPhone && contactName !== existingContact.name) {
            updates.name = contactName;
          }
          if (profilePicUrl && !existingContact.avatar_url) {
            updates.avatar_url = profilePicUrl;
          }
          
          if (Object.keys(updates).length > 0) {
            await supabase.from('contacts').update(updates).eq('id', contactId);
            stats.contactsUpdated++;
          }
        }

        // Find or create conversation
        let { data: existingConv } = await supabase
          .from('conversations')
          .select('id, archived, status')
          .eq('company_id', companyId)
          .eq('contact_id', contactId)
          .eq('channel', 'whatsapp')
          .maybeSingle();

        let conversationId;
        
        if (!existingConv) {
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              company_id: companyId,
              contact_id: contactId,
              channel: 'whatsapp',
              status: isArchived ? 'resolved' : 'open',
              archived: isArchived,
              metadata: { instanceName, remoteJid: whatsappJid }
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') {
              // Duplicate - fetch existing
              const { data: dup } = await supabase
                .from('conversations')
                .select('id')
                .eq('company_id', companyId)
                .eq('contact_id', contactId)
                .eq('channel', 'whatsapp')
                .maybeSingle();
              if (dup) conversationId = dup.id;
            } else {
              console.error(`❌ Erro ao criar conversa:`, error);
              continue;
            }
          } else {
            conversationId = newConv.id;
            stats.conversationsCreated++;
          }
        } else {
          conversationId = existingConv.id;
          
          if (isArchived !== existingConv.archived) {
            await supabase.from('conversations')
              .update({ archived: isArchived, status: isArchived ? 'resolved' : 'open' })
              .eq('id', conversationId);
            stats.conversationsUpdated++;
          }
        }

        if (!conversationId) continue;

        // Sync messages
        const msgCount = await syncMessagesForConversation(
          supabase, evolutionApiUrl, evolutionApiKey, instanceName,
          conversationId, whatsappJid, extractMessageContent
        );
        stats.messagesImported += msgCount;

      } catch (chatError) {
        console.error('Erro ao processar chat:', chatError);
        stats.skipped++;
      }
    }

    // ============================================================
    // FINAL PASS: Update contacts with phone-as-name
    // ============================================================
    console.log(`\n🔄 Atualizando nomes de contatos...`);
    
    const { data: contactsNeedingUpdate } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('company_id', companyId)
      .not('phone', 'is', null);

    let namesUpdated = 0;
    for (const contact of contactsNeedingUpdate || []) {
      const nameIsJustPhone = contact.name === contact.phone || /^\d+$/.test(contact.name);
      if (nameIsJustPhone && contact.phone) {
        const betterName = contactsNameMap.get(contact.phone) || 
                          contactsNameMap.get(normalizePhone(contact.phone));
        if (betterName && betterName !== contact.phone) {
          await supabase.from('contacts').update({ name: betterName }).eq('id', contact.id);
          namesUpdated++;
          console.log(`📝 ${contact.phone} → ${betterName}`);
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ IMPORTAÇÃO CONCLUÍDA`);
    console.log(`========================================`);
    console.log(`📊 Contatos: ${stats.contactsCreated} criados, ${stats.contactsUpdated + namesUpdated} atualizados`);
    console.log(`📊 Grupos: ${stats.groupsCreated} criados`);
    console.log(`📊 Conversas: ${stats.conversationsCreated} criadas, ${stats.conversationsUpdated} atualizadas`);
    console.log(`📊 Mensagens: ${stats.messagesImported} importadas`);
    console.log(`📊 Ignorados: ${stats.skipped}`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({ 
      success: true,
      totalChats: allChats.length,
      totalContacts: allContacts.length,
      importedContacts: stats.contactsCreated + stats.contactsUpdated + namesUpdated,
      importedGroups: stats.groupsCreated,
      importedConversations: stats.conversationsCreated + stats.conversationsUpdated,
      totalMessagesImported: stats.messagesImported,
      skipped: stats.skipped,
      message: `${stats.contactsCreated} contato(s), ${stats.groupsCreated} grupo(s), ${stats.conversationsCreated} conversa(s), ${stats.messagesImported} mensagem(ns)`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro em fetchChats:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha ao importar conversas', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================================
// SYNC MESSAGES FOR A CONVERSATION
// ============================================================
async function syncMessagesForConversation(
  supabase: any, 
  evolutionApiUrl: string, 
  evolutionApiKey: string, 
  instanceName: string,
  conversationId: string, 
  remoteJid: string,
  extractMessageContent: (msg: any) => { content: string; type: string }
): Promise<number> {
  try {
    // Get existing message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);

    const existingMessageIds = new Set<string>();
    if (existingMessages) {
      for (const msg of existingMessages) {
        if (msg.metadata?.messageId) {
          existingMessageIds.add(msg.metadata.messageId);
        }
      }
    }

    // Build JID variants for searching
    const isGroup = remoteJid.includes('@g.us');
    const phoneOnly = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@g.us', '').replace(/\D/g, '');
    
    const jidVariants = isGroup ? [remoteJid] : [
      remoteJid,
      `${phoneOnly}@s.whatsapp.net`,
      phoneOnly.startsWith('55') ? `${phoneOnly.substring(2)}@s.whatsapp.net` : null,
      !phoneOnly.startsWith('55') && phoneOnly.length >= 10 ? `55${phoneOnly}@s.whatsapp.net` : null,
    ].filter(Boolean) as string[];

    let messages: any[] = [];

    // Try each JID variant
    for (const jidToTry of jidVariants) {
      try {
        const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            where: { key: { remoteJid: jidToTry } },
            limit: 99999
          })
        });

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const fetchedMsgs = Array.isArray(messagesData) ? messagesData : 
                            (messagesData?.messages?.records || messagesData?.messages || []);
          
          if (fetchedMsgs.length > 0) {
            messages = fetchedMsgs;
            break;
          }
        }
      } catch (e) {
        // Continue to next variant
      }
    }

    if (messages.length === 0) {
      return 0;
    }

    // Sort messages by timestamp
    messages.sort((a, b) => {
      const tsA = a.messageTimestamp || a.key?.messageTimestamp || 0;
      const tsB = b.messageTimestamp || b.key?.messageTimestamp || 0;
      return (typeof tsA === 'number' ? tsA : 0) - (typeof tsB === 'number' ? tsB : 0);
    });

    let importedCount = 0;
    let lastMsgTimestamp: Date | null = null;

    for (const msg of messages) {
      try {
        const messageId = msg.key?.id;
        
        // Skip duplicates
        if (messageId && existingMessageIds.has(messageId)) {
          continue;
        }

        const { content, type } = extractMessageContent(msg);
        if (type === 'unknown' || !content) continue;

        const timestamp = msg.messageTimestamp || msg.key?.messageTimestamp;
        if (!timestamp) continue;

        const msgDate = new Date(typeof timestamp === 'number' ? 
          (timestamp > 9999999999 ? timestamp : timestamp * 1000) : timestamp);

        if (!lastMsgTimestamp || msgDate > lastMsgTimestamp) {
          lastMsgTimestamp = msgDate;
        }

        const isFromMe = msg.key?.fromMe === true;
        
        // For groups, include participant name
        let finalContent = content;
        if (isGroup && !isFromMe && msg.pushName) {
          finalContent = `${msg.pushName}: ${content}`;
        }

        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: finalContent,
            sender_type: isFromMe ? 'agent' : 'user',
            created_at: msgDate.toISOString(),
            metadata: { messageId, type }
          });

        if (!msgError) {
          importedCount++;
          if (messageId) existingMessageIds.add(messageId);
        }
      } catch (e) {
        // Continue
      }
    }

    // Update conversation timestamp to last message
    if (lastMsgTimestamp) {
      await supabase
        .from('conversations')
        .update({ updated_at: lastMsgTimestamp.toISOString() })
        .eq('id', conversationId);
    }

    return importedCount;
  } catch (error) {
    console.error('Erro ao sincronizar mensagens:', error);
    return 0;
  }
}

// ============================================================
// SYNC MESSAGES - ATUALIZAÇÃO INCREMENTAL
// ============================================================
async function syncMessages(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!ALLOWED_INSTANCES.includes(instanceName)) {
      return new Response(JSON.stringify({ 
        error: `Instância ${instanceName} não autorizada`
      }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`🔄 Sincronização incremental: ${instanceName}`);

    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;

    // Verify user access
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();
        
        if (!userProfile) {
          return new Response(JSON.stringify({ error: 'Acesso não autorizado' }), { 
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
      }
    }

    // Check connection
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': evolutionApiKey }
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({ error: 'Instância não acessível' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const statusData = await statusResponse.json();
    const connectionState = statusData?.instance?.state || statusData?.state;
    
    if (connectionState !== 'open' && connectionState !== 'connected') {
      return new Response(JSON.stringify({ 
        error: `Instância não conectada: ${connectionState}`,
        skipped: true 
      }), { 
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch current chats from WhatsApp
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error('Falha ao buscar chats');
    }

    const chatsData = await chatsResponse.json();
    const whatsappChats = Array.isArray(chatsData) ? chatsData : [];

    // Get all existing conversations with contacts
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, contact_id, metadata, contacts(phone)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    const convsByPhone = new Map<string, any>();
    for (const conv of existingConvs || []) {
      const phone = conv.contacts?.phone;
      if (phone) {
        convsByPhone.set(phone, conv);
      }
    }

    function extractMessageContent(msg: any): { content: string; type: string } {
      const m = msg?.message || msg;
      if (!m) return { content: '', type: 'unknown' };
      if (m.conversation) return { content: m.conversation, type: 'text' };
      if (m.extendedTextMessage?.text) return { content: m.extendedTextMessage.text, type: 'text' };
      if (m.text) return { content: m.text, type: 'text' };
      if (m.body) return { content: m.body, type: 'text' };
      if (m.imageMessage) return { content: m.imageMessage.caption || '📷 Imagem', type: 'image' };
      if (m.videoMessage) return { content: m.videoMessage.caption || '🎬 Vídeo', type: 'video' };
      if (m.audioMessage) return { content: '🎵 Áudio', type: 'audio' };
      if (m.documentMessage) return { content: `📄 ${m.documentMessage.fileName || 'Documento'}`, type: 'document' };
      if (m.stickerMessage) return { content: '🎨 Sticker', type: 'sticker' };
      if (m.contactMessage) return { content: `👤 Contato: ${m.contactMessage.displayName || 'N/A'}`, type: 'contact' };
      if (m.locationMessage) return { content: '📍 Localização', type: 'location' };
      return { content: '[Mensagem]', type: 'other' };
    }

    let syncedMessages = 0;
    let updatedTimestamps = 0;

    // Sync messages for existing conversations
    for (const chat of whatsappChats) {
      const jid = chat.remoteJid || chat.id || chat.jid || '';
      
      if (jid.includes('@broadcast') || jid.startsWith('status@') || jid.includes('@g.us')) {
        continue;
      }

      let phone = '';
      if (jid.includes('@s.whatsapp.net') || jid.includes('@c.us')) {
        phone = jid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');
      }

      if (!phone || phone.length < 10) continue;

      // Normalize phone
      if (phone.length >= 10 && phone.length <= 11 && !phone.startsWith('55')) {
        phone = '55' + phone;
      }

      const conv = convsByPhone.get(phone);
      if (!conv) continue;

      const whatsappJid = `${phone}@s.whatsapp.net`;
      
      const msgCount = await syncMessagesForConversation(
        supabase, evolutionApiUrl, evolutionApiKey, instanceName,
        conv.id, whatsappJid, extractMessageContent
      );
      
      if (msgCount > 0) {
        syncedMessages += msgCount;
        updatedTimestamps++;
      }
    }

    console.log(`✅ Sync: ${syncedMessages} mensagens, ${updatedTimestamps} conversas atualizadas`);

    return new Response(JSON.stringify({ 
      success: true,
      messagesSynced: syncedMessages,
      timestampsUpdated: updatedTimestamps,
      totalChats: whatsappChats.length,
      message: `${syncedMessages} mensagem(ns) sincronizada(s)`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro em syncMessages:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha ao sincronizar', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
