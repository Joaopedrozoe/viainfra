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
      events: [
        'MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED',
        'CHATS_SET', 'CHATS_UPSERT', 'CONTACTS_SET', 'CONTACTS_UPSERT', 'PRESENCE_UPDATE'
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

    // Buscar primeiro perfil do usuário (pode ter múltiplos em empresas diferentes)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1);

    const companyId = profiles?.[0]?.company_id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'User has no company' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
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
        company_id: companyId,
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

    // ============================================================
    // SOLUÇÃO DEFINITIVA: USAR CONTATOS COMO FONTE PRINCIPAL
    // findChats só retorna ~35 chats recentes
    // findContacts retorna TODOS os 303 contatos
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
    const processedJids = new Set<string>();

    // Build chat lookup for quick reference (archived status, etc)
    const chatLookup = new Map<string, any>();
    
    // Fetch chats just for metadata (archived status, etc) - not as primary source
    console.log(`\n📥 Buscando metadados de chats...`);
    try {
      const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
        body: JSON.stringify({ where: {}, limit: 1000 })
      });
      if (chatsResponse.ok) {
        const data = await chatsResponse.json();
        const chats = Array.isArray(data) ? data : (data?.chats || data?.data || []);
        chats.forEach((c: any) => {
          const jid = c.remoteJid || c.id || c.jid || '';
          if (jid) chatLookup.set(jid, c);
        });
        console.log(`✅ ${chatLookup.size} chats carregados para lookup`);
      }
    } catch (e) { 
      console.log(`⚠️ Erro ao buscar chats (não crítico):`, e);
    }

    // Also get archived chats
    try {
      const archivedResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
        body: JSON.stringify({ where: { archived: true }, limit: 1000 })
      });
      if (archivedResponse.ok) {
        const data = await archivedResponse.json();
        const archived = Array.isArray(data) ? data : (data?.chats || data?.data || []);
        archived.forEach((c: any) => {
          c.archived = true;
          const jid = c.remoteJid || c.id || c.jid || '';
          if (jid && !chatLookup.has(jid)) chatLookup.set(jid, c);
        });
        console.log(`✅ ${archived.length} chats arquivados adicionados`);
      }
    } catch (e) { /* ignore */ }

    // ============================================================
    // NOVA ESTRATÉGIA: BUSCAR MENSAGENS POR CHAT INDIVIDUALMENTE
    // Usando fetchMessages que busca direto do WhatsApp
    // ============================================================
    
    // Função para buscar mensagens de um chat específico
    async function fetchMessagesForJid(jid: string): Promise<any[]> {
      try {
        // Primeiro tenta findMessages com filtro (pode não funcionar - bug #1632)
        const resp1 = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            where: { key: { remoteJid: jid } },
            limit: 100
          })
        });
        
        if (resp1.ok) {
          const data1 = await resp1.json();
          const msgs1 = Array.isArray(data1) ? data1 : 
                       (data1?.messages?.records || data1?.messages || data1?.records || []);
          if (msgs1.length > 0) return msgs1;
        }
        
        // Se não funcionou, tenta fetchMessages (busca do WhatsApp diretamente)
        const resp2 = await fetch(`${evolutionApiUrl}/chat/fetchMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: jid, count: 50 })
        });
        
        if (resp2.ok) {
          const data2 = await resp2.json();
          return Array.isArray(data2) ? data2 : 
                 (data2?.messages || data2?.records || []);
        }
      } catch (e) { 
        // Silently fail - will process without messages
      }
      return [];
    }
    
    // Processar TODOS os chats do chatLookup (que vem de findChats)
    const allJidsToProcess = new Set<string>();
    for (const jid of chatLookup.keys()) {
      if (!jid.includes('@broadcast') && !jid.startsWith('status@')) {
        allJidsToProcess.add(jid);
      }
    }
    
    // Adicionar JIDs de contatos também (podem não estar em chatLookup)
    for (const contact of allContacts) {
      const jid = contact.remoteJid || contact.jid || contact.id || '';
      if (jid && !jid.includes('@broadcast') && !jid.startsWith('status@')) {
        allJidsToProcess.add(jid);
      }
    }
    
    console.log(`\n🔄 Processando ${allJidsToProcess.size} JIDs...`);
    console.log(`📨 Buscando mensagens por chat...`);

    // ============================================================
    // PROCESSAR TODOS OS JIDs - CRIAR CONTATOS E CONVERSAS
    // ============================================================
    let processedCount = 0;
    const jidsArray = Array.from(allJidsToProcess);
    
    console.log(`\n🔄 Processando ${jidsArray.length} JIDs...`);
    
    for (const jid of jidsArray) {
      try {
        if (!jid) continue;
        if (processedJids.has(jid)) continue;
        processedJids.add(jid);
        
        processedCount++;
        if (processedCount % 30 === 0) {
          console.log(`  📥 Processados ${processedCount}/${jidsArray.length}...`);
        }
        
        const isGroup = jid.includes('@g.us');
        const isLid = jid.includes('@lid');
        const chatMeta = chatLookup.get(jid);
        const isArchived = chatMeta?.archive === true || chatMeta?.archived === true;
        
        // Find contact info
        const contact = allContacts.find((c: any) => (c.remoteJid || c.jid) === jid);
        const contactName = contact?.pushName || contact?.name || contact?.notify || 
                           contact?.verifiedName || chatMeta?.name || chatMeta?.pushName || 
                           chatMeta?.subject || '';
        const profilePicUrl = contact?.profilePictureUrl || contact?.profilePicUrl || null;

        // ============================================================
        // PROCESS GROUPS
        // ============================================================
        if (isGroup) {
          if (processedGroups.has(jid)) continue;
          processedGroups.add(jid);

          let groupName = contactName || chatMeta?.subject || chatMeta?.name || `Grupo ${jid.slice(-8)}`;
          console.log(`👥 ${groupName}`);

          // Find or create group contact
          let { data: existingGroupContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('company_id', companyId)
            .eq('metadata->>remoteJid', jid)
            .maybeSingle();

          let groupContactId;
          if (!existingGroupContact) {
            const { data: newContact, error } = await supabase
              .from('contacts')
              .insert({
                company_id: companyId,
                name: groupName,
                phone: null,
                avatar_url: profilePicUrl,
                metadata: { remoteJid: jid, isGroup: true }
              })
              .select('id')
              .single();

            if (error) { stats.skipped++; continue; }
            groupContactId = newContact.id;
            stats.contactsCreated++;
          } else {
            groupContactId = existingGroupContact.id;
          }

          // Find or create group conversation
          let { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', companyId)
            .eq('contact_id', groupContactId)
            .eq('channel', 'whatsapp')
            .maybeSingle();

          if (!existingConv) {
            const { data: newConv, error } = await supabase
              .from('conversations')
              .insert({
                company_id: companyId,
                contact_id: groupContactId,
                channel: 'whatsapp',
                status: isArchived ? 'resolved' : 'open',
                archived: isArchived,
                metadata: { isGroup: true, remoteJid: jid, instanceName }
              })
              .select('id')
              .single();

            if (!error && newConv) {
              stats.conversationsCreated++;
            } else if (error?.code === '23505') {
              stats.conversationsReused++;
            }
          } else {
            stats.conversationsReused++;
          }
          stats.groupsCreated++;
          continue;
        }

        // ============================================================
        // PROCESS INDIVIDUAL CONTACTS
        // ============================================================
        let phone = extractPhoneFromJid(jid);
        
        // Handle @lid
        if (isLid) {
          phone = contactsPhoneMap.get(jid) || contactsPhoneMap.get(jid.replace('@lid', ''));
          if (!phone && contactName) {
            phone = nameToPhoneMap.get(contactName.toLowerCase().trim());
          }
          if (!phone) { stats.invalidPhone++; continue; }
          stats.lidResolved++;
        }

        if (!phone || phone.length < 8) { stats.invalidPhone++; continue; }

        const normalizedPhone = normalizePhone(phone);
        if (processedPhones.has(normalizedPhone)) continue;
        processedPhones.add(normalizedPhone);

        // Get best name
        let finalName = contactName;
        if (!finalName || /^\+?\d[\d\s-]+$/.test(finalName)) {
          finalName = contactsNameMap.get(normalizedPhone) || contactsNameMap.get(phone) || normalizedPhone;
        }

        console.log(`📱 ${finalName} (${normalizedPhone})${isArchived ? ' [arq]' : ''}`);

        // Find or create contact
        let { data: existingContact } = await supabase
          .from('contacts')
          .select('id, name, avatar_url')
          .eq('company_id', companyId)
          .eq('phone', normalizedPhone)
          .maybeSingle();
        
        let contactId;
        if (!existingContact) {
          // Try original phone
          const { data: altContact } = await supabase
            .from('contacts')
            .select('id, name, avatar_url')
            .eq('company_id', companyId)
            .eq('phone', phone)
            .maybeSingle();
          existingContact = altContact;
        }
        
        if (!existingContact) {
          const { data: newContact, error } = await supabase
            .from('contacts')
            .insert({
              company_id: companyId,
              name: finalName,
              phone: normalizedPhone,
              avatar_url: profilePicUrl,
              metadata: { remoteJid: `${normalizedPhone}@s.whatsapp.net`, source: 'import' }
            })
            .select('id')
            .single();

          if (error) { stats.skipped++; continue; }
          contactId = newContact.id;
          stats.contactsCreated++;
        } else {
          contactId = existingContact.id;
          // Update name if we have a better one
          const hasRealName = finalName && !/^\+?\d[\d\s-]+$/.test(finalName);
          const currentNameIsPhone = !existingContact.name || /^\+?\d[\d\s-]+$/.test(existingContact.name);
          if (hasRealName && currentNameIsPhone) {
            await supabase.from('contacts').update({ name: finalName }).eq('id', contactId);
            stats.contactsUpdated++;
          }
        }

        // Find or create conversation - THIS IS THE KEY PART
        const { data: existingConv, error: findError } = await supabase
          .from('conversations')
          .select('id, status')
          .eq('company_id', companyId)
          .eq('contact_id', contactId)
          .eq('channel', 'whatsapp')
          .maybeSingle();

        if (findError) {
          console.error(`❌ Erro buscar conversa para ${finalName}:`, findError.message);
        }

        if (!existingConv) {
          console.log(`  🆕 Criando conversa para: ${finalName} (contact: ${contactId})`);
          
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              company_id: companyId,
              contact_id: contactId,
              channel: 'whatsapp',
              status: isArchived ? 'resolved' : 'open',
              archived: isArchived,
              metadata: { instanceName, remoteJid: jid }
            })
            .select('id')
            .single();

          if (error) {
            console.error(`  ❌ ERRO INSERT: ${error.code} - ${error.message}`);
            if (error.code === '23505') {
              stats.conversationsReused++;
            }
          } else if (newConv) {
            stats.conversationsCreated++;
            console.log(`  ✅ CONV CRIADA: ${finalName} -> ${newConv.id}`);
          } else {
            console.error(`  ⚠️ INSERT sem erro mas sem dados: ${finalName}`);
          }
        } else {
          stats.conversationsReused++;
          // Update archived status if changed
          if (isArchived && existingConv.status !== 'resolved') {
            await supabase.from('conversations').update({ archived: true, status: 'resolved' }).eq('id', existingConv.id);
            stats.conversationsUpdated++;
          }
        }

      } catch (chatError) {
        console.error('Erro processar:', chatError);
        stats.skipped++;
      }
    }

    console.log(`\n📋 Processados ${processedJids.size} JIDs únicos`);

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
      const nameIsJustPhone = contact.name === contact.phone || /^\+?\d[\d\s-]+$/.test(contact.name?.trim() || '');
      if (nameIsJustPhone && contact.phone) {
        const betterName = contactsNameMap.get(contact.phone) || 
                          contactsNameMap.get(normalizePhone(contact.phone));
        if (betterName && betterName !== contact.phone && !/^\+?\d[\d\s-]+$/.test(betterName.trim())) {
          await supabase.from('contacts').update({ name: betterName }).eq('id', contact.id);
          namesUpdated++;
          console.log(`🔗 ${contact.phone} → ${betterName}`);
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ IMPORTAÇÃO CONCLUÍDA`);
    console.log(`========================================`);
    console.log(`📊 Contatos processados: ${allContacts.length}`);
    console.log(`📊 Contatos: ${stats.contactsCreated} criados, ${stats.contactsUpdated + namesUpdated} atualizados`);
    console.log(`📊 Grupos: ${stats.groupsCreated} criados`);
    console.log(`📊 Conversas: ${stats.conversationsCreated} criadas, ${stats.conversationsReused} reusadas, ${stats.conversationsUpdated} atualizadas`);
    console.log(`📊 Mensagens: ${stats.messagesImported} importadas`);
    console.log(`📊 @lid resolvidos: ${stats.lidResolved}`);
    console.log(`📊 Ignorados: ${stats.skipped} (telefone inválido: ${stats.invalidPhone})`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({ 
      success: true,
      totalChats: processedJids.size,
      totalContacts: allContacts.length,
      // Flat fields for UI progress display
      importedContacts: stats.contactsCreated + stats.contactsUpdated + namesUpdated,
      importedConversations: stats.conversationsCreated + stats.conversationsReused,
      importedMessages: stats.messagesImported,
      archivedCount: Array.from(chatLookup.values()).filter((c: any) => c.archived).length,
      skippedCount: stats.skipped,
      // Detailed stats
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
// IMPORT CACHED MESSAGES - usa mensagens já carregadas em memória
// ============================================================
async function importCachedMessages(
  supabase: any, 
  conversationId: string, 
  messages: any[],
  extractMessageContent: (msg: any) => { content: string; type: string },
  isGroup: boolean
): Promise<number> {
  try {
    if (!messages || messages.length === 0) return 0;
    
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
        
        // Track timestamp even for existing messages
        const timestamp = msg.messageTimestamp || msg.key?.messageTimestamp;
        if (timestamp) {
          const msgDate = new Date(typeof timestamp === 'number' ? 
            (timestamp > 9999999999 ? timestamp : timestamp * 1000) : timestamp);
          if (!lastMsgTimestamp || msgDate > lastMsgTimestamp) {
            lastMsgTimestamp = msgDate;
          }
        }
        
        // Skip duplicates
        if (messageId && existingMessageIds.has(messageId)) {
          continue;
        }

        const { content, type } = extractMessageContent(msg);
        if (type === 'unknown' || !content) continue;
        if (!timestamp) continue;

        const msgDate = new Date(typeof timestamp === 'number' ? 
          (timestamp > 9999999999 ? timestamp : timestamp * 1000) : timestamp);

        const isFromMe = msg.key?.fromMe === true;
        
        // For groups, prefix with sender name
        let finalContent = content;
        if (isGroup && !isFromMe) {
          const senderName = msg.pushName || msg.key?.participant?.split('@')[0] || '';
          if (senderName) {
            finalContent = `*${senderName}*\n${content}`;
          }
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
      } catch (e) { /* continue */ }
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
    console.error('Error importing cached messages:', error);
    return 0;
  }
}

// ============================================================
// SYNC MESSAGES FOR CONVERSATION - BUSCA MENSAGENS DO WHATSAPP
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
    // Buscar mensagens usando fetchMessages (busca direto do WhatsApp)
    const response = await fetch(`${evolutionApiUrl}/chat/fetchMessages/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: remoteJid, count: 100 })
    });
    
    if (!response.ok) return 0;
    
    const data = await response.json();
    const messages = Array.isArray(data) ? data : (data?.messages || data?.records || []);
    
    if (messages.length === 0) return 0;
    
    // Get existing message IDs
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId);
    
    const existingIds = new Set<string>();
    for (const msg of existingMsgs || []) {
      if (msg.metadata?.messageId) existingIds.add(msg.metadata.messageId);
    }
    
    let importedCount = 0;
    let lastMsgTimestamp: Date | null = null;
    
    // Sort by timestamp
    messages.sort((a: any, b: any) => {
      const tsA = a.messageTimestamp || a.key?.messageTimestamp || 0;
      const tsB = b.messageTimestamp || b.key?.messageTimestamp || 0;
      return (typeof tsA === 'number' ? tsA : 0) - (typeof tsB === 'number' ? tsB : 0);
    });
    
    for (const msg of messages) {
      const messageId = msg.key?.id;
      if (messageId && existingIds.has(messageId)) continue;
      
      const timestamp = msg.messageTimestamp || msg.key?.messageTimestamp;
      if (!timestamp) continue;
      
      const { content, type } = extractMessageContent(msg);
      if (type === 'unknown' || !content) continue;
      
      const msgDate = new Date(typeof timestamp === 'number' ? 
        (timestamp > 9999999999 ? timestamp : timestamp * 1000) : timestamp);
      
      if (!lastMsgTimestamp || msgDate > lastMsgTimestamp) {
        lastMsgTimestamp = msgDate;
      }
      
      const isFromMe = msg.key?.fromMe === true;
      
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        content,
        sender_type: isFromMe ? 'agent' : 'user',
        created_at: msgDate.toISOString(),
        metadata: { messageId, type }
      });
      
      if (!error) {
        importedCount++;
        if (messageId) existingIds.add(messageId);
      }
    }
    
    // Update conversation timestamp
    if (lastMsgTimestamp) {
      await supabase.from('conversations')
        .update({ updated_at: lastMsgTimestamp.toISOString() })
        .eq('id', conversationId);
    }
    
    return importedCount;
  } catch (e) {
    console.error('Erro sync messages:', e);
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

    // STEP 1: Criar conversas para contatos sem conversa
    const { data: contactsWithoutConv } = await supabase
      .from('contacts')
      .select('id, phone, name')
      .eq('company_id', companyId)
      .not('phone', 'is', null);
    
    let conversationsCreated = 0;
    for (const contact of contactsWithoutConv || []) {
      if (!contact.phone || convsByPhone.has(contact.phone)) continue;
      
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('channel', 'whatsapp')
        .maybeSingle();
      
      if (!existingConv) {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            company_id: companyId,
            contact_id: contact.id,
            channel: 'whatsapp',
            status: 'open',
            metadata: { instanceName }
          })
          .select()
          .single();
        
        if (!error && newConv) {
          convsByPhone.set(contact.phone, newConv);
          conversationsCreated++;
          console.log(`✅ Conversa criada: ${contact.name} (${contact.phone})`);
        }
      }
    }
    
    console.log(`📊 ${conversationsCreated} conversas criadas para contatos existentes`);

    let syncedMessages = 0;
    let updatedTimestamps = 0;

    // STEP 2: Sync messages for ALL conversations (not just from findChats)
    const { data: allConversations } = await supabase
      .from('conversations')
      .select('id, contact_id, contacts(phone, name)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp')
      .limit(500);
    
    console.log(`🔄 Sincronizando mensagens para ${allConversations?.length || 0} conversas...`);
    
    for (const conv of allConversations || []) {
      const phone = conv.contacts?.phone;
      if (!phone || phone.length < 10) continue;
      
      const whatsappJid = `${phone}@s.whatsapp.net`;
      
      const msgCount = await syncMessagesForConversation(
        supabase, evolutionApiUrl, evolutionApiKey, instanceName,
        conv.id, whatsappJid, extractMessageContent
      );
      
      if (msgCount > 0) {
        syncedMessages += msgCount;
        updatedTimestamps++;
        console.log(`  📨 ${conv.contacts?.name}: +${msgCount} msgs`);
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
