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
// FETCH CHATS - IMPORTAÇÃO COMPLETA PROFISSIONAL v3
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
    console.log(`📥 IMPORTAÇÃO COMPLETA v3: ${instanceName}`);
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
    // HELPER FUNCTIONS
    // ============================================================

    function isValidBrazilianPhone(phone: string): boolean {
      const digits = phone.replace(/\D/g, '');
      // Valid formats: 11 digits (with country code 55) or 10-11 without
      // Examples: 5511999999999 (13), 11999999999 (11), 999999999 (9-10)
      return /^55\d{10,11}$/.test(digits) || /^\d{10,11}$/.test(digits);
    }

    function normalizePhone(phone: string): string {
      if (!phone) return '';
      const digits = phone.replace(/\D/g, '');
      // Add country code if missing and looks like Brazilian number
      if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) {
        return '55' + digits;
      }
      return digits;
    }

    function extractPhoneFromJid(jid: string): string | null {
      if (!jid) return null;
      
      // Skip non-phone JIDs
      if (jid.includes('@g.us') || jid.includes('@broadcast') || 
          jid.includes('@lid') || jid.startsWith('status@')) {
        return null;
      }
      
      // Extract from @s.whatsapp.net or @c.us
      const match = jid.match(/^(\d+)@/);
      if (match && match[1]) {
        const digits = match[1];
        // Valid phone should be 10-15 digits
        if (digits.length >= 10 && digits.length <= 15 && isValidBrazilianPhone(digits)) {
          return digits;
        }
      }
      return null;
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

    // ============================================================
    // FETCH ALL DATA FROM EVOLUTION API
    // ============================================================
    
    let allContacts: any[] = [];
    let allChats: any[] = [];

    // Fetch contacts first
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
        console.log(`✅ ${allContacts.length} contatos encontrados na API`);
        
        // Log first 5 contacts for debugging
        console.log(`📇 Amostra de contatos:`);
        allContacts.slice(0, 5).forEach((c, i) => {
          console.log(`  ${i+1}. JID: ${c.remoteJid || c.jid}, Name: ${c.pushName || c.name || 'N/A'}`);
        });
      }
    } catch (e) {
      console.log(`⚠️ Erro ao buscar contatos:`, e);
    }

    // Build contacts lookup maps
    const contactsNameMap = new Map<string, string>();  // phone -> name
    const contactsPhoneMap = new Map<string, string>(); // lid -> phone (for @lid resolution)
    const nameToPhoneMap = new Map<string, string>();   // name -> phone (fallback for @lid)
    
    for (const contact of allContacts) {
      const jid = contact.remoteJid || contact.jid || '';
      const name = contact.pushName || contact.name || contact.notify || contact.verifiedName;
      const lid = contact.lid || '';
      
      // Extract phone from standard JID
      const phone = extractPhoneFromJid(jid);
      
      if (phone) {
        const normalized = normalizePhone(phone);
        
        // Map phone -> name
        if (name) {
          contactsNameMap.set(phone, name);
          contactsNameMap.set(normalized, name);
        }
        
        // Map lid -> phone (if lid exists)
        if (lid) {
          contactsPhoneMap.set(lid, normalized);
          contactsPhoneMap.set(`${lid}@lid`, normalized);
        }
        
        // Map name -> phone (for fallback matching)
        if (name) {
          const nameLower = name.toLowerCase().trim();
          if (!nameToPhoneMap.has(nameLower)) {
            nameToPhoneMap.set(nameLower, normalized);
          }
        }
      }
    }
    
    console.log(`📇 Mapas criados: ${contactsNameMap.size} nomes, ${contactsPhoneMap.size} lids, ${nameToPhoneMap.size} name->phone`);

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
        console.log(`✅ ${allChats.length} chats encontrados na API`);
        
        // Log ALL chats for complete debugging
        console.log(`💬 TODOS os chats retornados pela API:`);
        allChats.forEach((c, i) => {
          const jid = c.remoteJid || c.id || c.jid || '';
          const name = c.pushName || c.name || c.subject || 'N/A';
          const phone = c.phone || c.number || '';
          const archived = c.archive || c.archived || false;
          console.log(`  ${i+1}. ${name} | JID: ${jid.slice(0,30)}... | Phone: ${phone} | Archived: ${archived}`);
        });
      }
    } catch (e) {
      console.log(`⚠️ Erro ao buscar chats:`, e);
    }

    // ============================================================
    // PROCESS ALL CHATS
    // ============================================================

    const stats = {
      contactsCreated: 0,
      contactsUpdated: 0,
      conversationsCreated: 0,
      conversationsUpdated: 0,
      conversationsReused: 0,
      messagesImported: 0,
      groupsCreated: 0,
      skipped: 0,
      invalidPhone: 0,
      lidResolved: 0
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
            stats.conversationsReused++;
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
        
        // Try to extract phone from JID or resolve @lid
        let phone = extractPhoneFromJid(jid);
        let resolvedFromLid = false;
        
        // If it's an @lid JID, try to resolve to a real phone
        if (!phone && jid.includes('@lid')) {
          const lidId = jid.split('@')[0];
          const chatName = chat.pushName || chat.name || chat.notify || '';
          const chatPhone = chat.phone || chat.number || '';
          
          // Try 1: Direct phone field in chat
          if (chatPhone && chatPhone.length >= 10) {
            const cleaned = chatPhone.replace(/\D/g, '');
            if (isValidBrazilianPhone(cleaned)) {
              phone = cleaned;
              resolvedFromLid = true;
              console.log(`🔗 @lid resolved via phone field: ${lidId} -> ${phone}`);
            }
          }
          
          // Try 2: Look up in contacts lid map
          if (!phone) {
            phone = contactsPhoneMap.get(lidId) || contactsPhoneMap.get(jid);
            if (phone) {
              resolvedFromLid = true;
              console.log(`🔗 @lid resolved via lid map: ${lidId} -> ${phone}`);
            }
          }
          
          // Try 3: Match by name in nameToPhone map
          if (!phone && chatName) {
            const nameLower = chatName.toLowerCase().trim();
            phone = nameToPhoneMap.get(nameLower);
            if (phone) {
              resolvedFromLid = true;
              console.log(`🔗 @lid resolved via name: ${chatName} -> ${phone}`);
            }
          }
          
          // Try 4: Search in database for contact by name (exact match)
          if (!phone && chatName && chatName.length > 2) {
            const { data: contactByName } = await supabase
              .from('contacts')
              .select('phone, name')
              .eq('company_id', companyId)
              .ilike('name', chatName)
              .not('phone', 'is', null)
              .limit(1)
              .maybeSingle();
            
            if (contactByName?.phone && isValidBrazilianPhone(contactByName.phone)) {
              phone = contactByName.phone;
              resolvedFromLid = true;
              console.log(`🔗 @lid resolved via DB name search: ${chatName} -> ${phone}`);
            }
          }
          
          // Try 5: Use fetchProfile API to get phone from @lid
          if (!phone) {
            console.log(`🔍 Tentando resolver @lid via fetchProfile: ${jid}`);
            try {
              const profileResponse = await fetch(`${evolutionApiUrl}/chat/fetchProfile/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify({ number: jid })
              });
              
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log(`  🔎 Profile response: ${JSON.stringify(profileData).slice(0, 300)}`);
                
                // Try to extract phone from profile
                const profilePhone = profileData?.wid?.user || profileData?.jid?.split('@')[0] || 
                                     profileData?.number || profileData?.phone;
                if (profilePhone) {
                  const cleaned = String(profilePhone).replace(/\D/g, '');
                  if (isValidBrazilianPhone(cleaned)) {
                    phone = cleaned;
                    resolvedFromLid = true;
                    console.log(`🔗 @lid resolved via fetchProfile: ${jid} -> ${phone}`);
                  }
                }
              }
            } catch (profileErr) {
              console.log(`  ⚠️ Erro fetchProfile:`, profileErr);
            }
          }
          
          // Try 6: Check contact in contacts API with @lid directly
          if (!phone) {
            try {
              const contactResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify({ where: { remoteJid: jid } })
              });
              
              if (contactResponse.ok) {
                const contactData = await contactResponse.json();
                const contacts = Array.isArray(contactData) ? contactData : [];
                console.log(`  🔎 Contact by @lid: ${contacts.length} encontrados`);
                
                if (contacts.length > 0) {
                  const contact = contacts[0];
                  console.log(`  🔎 Contact data: ${JSON.stringify(contact).slice(0, 300)}`);
                  
                  // Extract phone from contact
                  const contactPhone = contact.phone || contact.number || contact.wid?.user;
                  if (contactPhone) {
                    const cleaned = String(contactPhone).replace(/\D/g, '');
                    if (isValidBrazilianPhone(cleaned)) {
                      phone = cleaned;
                      resolvedFromLid = true;
                      console.log(`🔗 @lid resolved via contact lookup: ${jid} -> ${phone}`);
                    }
                  }
                }
              }
            } catch (contactErr) {
              console.log(`  ⚠️ Erro contact lookup:`, contactErr);
            }
          }
          
          // Try 7: FETCH MESSAGES and look for non-fromMe messages with pushName
          if (!phone) {
            try {
              const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
                body: JSON.stringify({
                  where: { key: { remoteJid: jid, fromMe: false } },
                  limit: 20
                })
              });
              
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                const messages = messagesData?.messages?.records || messagesData?.records || 
                                 (Array.isArray(messagesData) ? messagesData : []);
                
                console.log(`  📬 ${messages.length} msgs recebidas (fromMe=false)`);
                
                for (const msg of messages) {
                  // Check pushName from received messages
                  const msgPushName = msg.pushName;
                  if (msgPushName) {
                    console.log(`  🔎 Msg pushName: ${msgPushName}`);
                    
                    // Try nameToPhoneMap
                    const nameLower = msgPushName.toLowerCase().trim();
                    let foundPhone = nameToPhoneMap.get(nameLower);
                    
                    // Try partial match
                    if (!foundPhone) {
                      for (const [name, ph] of nameToPhoneMap.entries()) {
                        if (name.includes(nameLower) || nameLower.includes(name)) {
                          foundPhone = ph;
                          break;
                        }
                      }
                    }
                    
                    if (foundPhone) {
                      phone = foundPhone;
                      resolvedFromLid = true;
                      console.log(`🔗 @lid resolved via msg pushName->map: ${msgPushName} -> ${phone}`);
                      break;
                    }
                    
                    // DB lookup
                    const { data: contactByMsgName } = await supabase
                      .from('contacts')
                      .select('phone, name')
                      .eq('company_id', companyId)
                      .ilike('name', `%${msgPushName}%`)
                      .not('phone', 'is', null)
                      .limit(1)
                      .maybeSingle();
                    
                    if (contactByMsgName?.phone && isValidBrazilianPhone(contactByMsgName.phone)) {
                      phone = contactByMsgName.phone;
                      resolvedFromLid = true;
                      console.log(`🔗 @lid resolved via msg pushName->DB: ${msgPushName} -> ${phone}`);
                      break;
                    }
                  }
                  
                  // Check participant
                  const participant = msg.key?.participant || msg.participant;
                  if (participant && participant.includes('@s.whatsapp.net')) {
                    const extractedPhone = extractPhoneFromJid(participant);
                    if (extractedPhone && isValidBrazilianPhone(extractedPhone)) {
                      phone = extractedPhone;
                      resolvedFromLid = true;
                      console.log(`🔗 @lid resolved via msg participant: ${jid} -> ${phone}`);
                      break;
                    }
                  }
                }
              }
            } catch (msgErr) {
              console.log(`  ⚠️ Erro buscar msgs:`, msgErr);
            }
          }
          
          if (!phone) {
            console.log(`⏭️ Skip: ${jid} (could not resolve @lid, name: ${chatName || 'N/A'})`);
            stats.invalidPhone++;
            continue;
          }
          
          stats.lidResolved++;
        }
        
        if (!phone) {
          console.log(`⏭️ Skip: ${jid} (invalid phone format)`);
          stats.invalidPhone++;
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
        const originalJid = resolvedFromLid ? jid : whatsappJid;

        console.log(`📱 ${contactName} (${normalizedPhone})${resolvedFromLid ? ' [@lid]' : ''}${isArchived ? ' [arquivado]' : ''}`);

        // Find or create contact - try multiple phone variations
        let existingContact = null;
        
        // Try normalized phone first
        let { data: contactByNorm } = await supabase
          .from('contacts')
          .select('id, name, avatar_url, phone')
          .eq('company_id', companyId)
          .eq('phone', normalizedPhone)
          .maybeSingle();
        
        if (contactByNorm) {
          existingContact = contactByNorm;
        } else {
          // Try original phone
          let { data: contactByOrig } = await supabase
            .from('contacts')
            .select('id, name, avatar_url, phone')
            .eq('company_id', companyId)
            .eq('phone', phone)
            .maybeSingle();
          
          if (contactByOrig) {
            existingContact = contactByOrig;
          }
        }

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
              metadata: { instanceName, remoteJid: whatsappJid, originalJid: resolvedFromLid ? jid : undefined }
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
              if (dup) {
                conversationId = dup.id;
                stats.conversationsReused++;
              }
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
          stats.conversationsReused++;
          
          if (isArchived !== existingConv.archived) {
            await supabase.from('conversations')
              .update({ archived: isArchived, status: isArchived ? 'resolved' : 'open' })
              .eq('id', conversationId);
            stats.conversationsUpdated++;
          }
        }

        if (!conversationId) continue;

        // Sync messages - try multiple JID variations including original @lid
        const jidsToTry = [originalJid, jid, whatsappJid, `${phone}@s.whatsapp.net`].filter(Boolean);
        let msgCount = 0;
        
        for (const tryJid of [...new Set(jidsToTry)]) {
          msgCount = await syncMessagesForConversation(
            supabase, evolutionApiUrl, evolutionApiKey, instanceName,
            conversationId, tryJid, extractMessageContent
          );
          if (msgCount > 0) break;
        }
        
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
    console.log(`📊 Chats processados: ${sortedChats.length}`);
    console.log(`📊 Contatos: ${stats.contactsCreated} criados, ${stats.contactsUpdated + namesUpdated} atualizados`);
    console.log(`📊 Grupos: ${stats.groupsCreated} criados`);
    console.log(`📊 Conversas: ${stats.conversationsCreated} criadas, ${stats.conversationsReused} reusadas, ${stats.conversationsUpdated} atualizadas`);
    console.log(`📊 Mensagens: ${stats.messagesImported} importadas`);
    console.log(`📊 @lid resolvidos: ${stats.lidResolved}`);
    console.log(`📊 Ignorados: ${stats.skipped} (telefone inválido: ${stats.invalidPhone})`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({ 
      success: true,
      totalChats: allChats.length,
      totalContacts: allContacts.length,
      stats: {
        contactsCreated: stats.contactsCreated,
        contactsUpdated: stats.contactsUpdated + namesUpdated,
        groupsCreated: stats.groupsCreated,
        conversationsCreated: stats.conversationsCreated,
        conversationsReused: stats.conversationsReused,
        conversationsUpdated: stats.conversationsUpdated,
        messagesImported: stats.messagesImported,
        lidResolved: stats.lidResolved,
        skipped: stats.skipped,
        invalidPhone: stats.invalidPhone
      },
      message: `${stats.contactsCreated} contato(s), ${stats.groupsCreated} grupo(s), ${stats.conversationsCreated + stats.conversationsReused} conversa(s), ${stats.messagesImported} mensagem(ns), ${stats.lidResolved} @lid resolvidos`
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
// SYNC MESSAGES FOR A CONVERSATION v2
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
    console.log(`  📨 Buscando mensagens para: ${remoteJid}`);
    
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
    console.log(`  📊 Mensagens existentes: ${existingMessageIds.size}`);

    // Build JID variants for searching
    const isGroup = remoteJid.includes('@g.us');
    const phoneOnly = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@g.us', '').replace(/\D/g, '');
    
    const jidVariants = isGroup ? [remoteJid] : [
      remoteJid,
      `${phoneOnly}@s.whatsapp.net`,
      `${phoneOnly}@c.us`,
      phoneOnly.startsWith('55') ? `${phoneOnly.substring(2)}@s.whatsapp.net` : null,
      !phoneOnly.startsWith('55') && phoneOnly.length >= 10 ? `55${phoneOnly}@s.whatsapp.net` : null,
    ].filter(Boolean) as string[];

    let messages: any[] = [];
    let successJid: string | null = null;

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
            successJid = jidToTry;
            console.log(`  ✅ ${fetchedMsgs.length} msgs encontradas com JID: ${jidToTry}`);
            break;
          }
        }
      } catch (e) {
        // Continue to next variant
      }
    }

    if (messages.length === 0) {
      console.log(`  ⚠️ Nenhuma mensagem encontrada para: ${remoteJid}`);
      return 0;
    }

    // Sort messages by timestamp
    messages.sort((a, b) => {
      const tsA = a.messageTimestamp || a.key?.messageTimestamp || 0;
      const tsB = b.messageTimestamp || b.key?.messageTimestamp || 0;
      return (typeof tsA === 'number' ? tsA : 0) - (typeof tsB === 'number' ? tsB : 0);
    });

    let importedCount = 0;
    let skippedDuplicates = 0;
    let lastMsgTimestamp: Date | null = null;

    for (const msg of messages) {
      try {
        const messageId = msg.key?.id;
        
        // Skip duplicates
        if (messageId && existingMessageIds.has(messageId)) {
          skippedDuplicates++;
          // Still track timestamp even for existing messages
          const timestamp = msg.messageTimestamp || msg.key?.messageTimestamp;
          if (timestamp) {
            const msgDate = new Date(typeof timestamp === 'number' ? 
              (timestamp > 9999999999 ? timestamp : timestamp * 1000) : timestamp);
            if (!lastMsgTimestamp || msgDate > lastMsgTimestamp) {
              lastMsgTimestamp = msgDate;
            }
          }
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
      console.log(`  ⏰ Timestamp atualizado: ${lastMsgTimestamp.toISOString()}`);
    }

    console.log(`  📥 Importadas: ${importedCount}, Duplicatas: ${skippedDuplicates}`);
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
