import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// IMPORTANTE: Instâncias autorizadas para operações
const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// HELPERS PARA MÍDIA
// ============================================================
interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename?: string;
  mimeType?: string;
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/opus': 'opus',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };
  return mimeMap[mimeType] || 'bin';
}

function extractAttachmentFromMessage(msgContent: any): Attachment | null {
  if (msgContent.imageMessage) {
    return {
      type: 'image',
      url: msgContent.imageMessage.url || msgContent.imageMessage.directPath || '',
      mimeType: msgContent.imageMessage.mimetype,
    };
  }
  if (msgContent.videoMessage) {
    return {
      type: 'video',
      url: msgContent.videoMessage.url || msgContent.videoMessage.directPath || '',
      mimeType: msgContent.videoMessage.mimetype,
    };
  }
  if (msgContent.audioMessage) {
    return {
      type: 'audio',
      url: msgContent.audioMessage.url || msgContent.audioMessage.directPath || '',
      mimeType: msgContent.audioMessage.mimetype,
    };
  }
  if (msgContent.documentMessage) {
    return {
      type: 'document',
      url: msgContent.documentMessage.url || msgContent.documentMessage.directPath || '',
      filename: msgContent.documentMessage.fileName || msgContent.documentMessage.title,
      mimeType: msgContent.documentMessage.mimetype,
    };
  }
  return null;
}

async function downloadAndUploadMediaForImport(
  supabase: any,
  attachment: Attachment,
  message: any,
  conversationId: string,
  instanceName: string,
  evolutionApiUrl: string,
  evolutionApiKey: string
): Promise<string | null> {
  try {
    console.log('📥 Downloading media from WhatsApp via Evolution API...');
    
    // Tentar múltiplas abordagens para obter a mídia
    let base64Data: string | null = null;
    
    // Abordagem 1: getBase64FromMediaMessage (preferido para mensagens recentes)
    try {
      const mediaResponse = await fetch(`${evolutionApiUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          message: {
            key: message.key,
            message: message.message,
          },
          convertToMp4: false,
        }),
      });
      
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        if (mediaData.base64) {
          base64Data = mediaData.base64;
          console.log('✅ Mídia obtida via getBase64FromMediaMessage');
        }
      } else {
        console.log(`⚠️ getBase64FromMediaMessage retornou ${mediaResponse.status}`);
      }
    } catch (err) {
      console.log('⚠️ Falha em getBase64FromMediaMessage:', err);
    }

    // Abordagem 2: Tentar download direto da URL se disponível
    if (!base64Data && attachment.url && !attachment.url.includes('enc.media') && attachment.url.startsWith('http')) {
      try {
        console.log('📥 Tentando download direto da URL...');
        const directResponse = await fetch(attachment.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (directResponse.ok) {
          const arrayBuffer = await directResponse.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          // Converter para base64
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          base64Data = btoa(binary);
          console.log('✅ Mídia obtida via download direto');
        } else {
          console.log(`⚠️ Download direto retornou ${directResponse.status}`);
        }
      } catch (err) {
        console.log('⚠️ Falha no download direto:', err);
      }
    }

    // Abordagem 3: Tentar usando downloadMedia endpoint (para áudios e documentos)
    if (!base64Data && message.key?.id) {
      try {
        console.log('📥 Tentando via downloadMediaMessage...');
        const downloadResponse = await fetch(`${evolutionApiUrl}/chat/downloadMediaMessage/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            message: {
              key: message.key,
              message: message.message,
            }
          }),
        });
        
        if (downloadResponse.ok) {
          const mediaData = await downloadResponse.json();
          if (mediaData.base64) {
            base64Data = mediaData.base64;
            console.log('✅ Mídia obtida via downloadMediaMessage');
          }
        } else {
          console.log(`⚠️ downloadMediaMessage retornou ${downloadResponse.status}`);
        }
      } catch (err) {
        console.log('⚠️ Falha em downloadMediaMessage:', err);
      }
    }
    
    if (!base64Data) {
      console.error('❌ Não foi possível obter mídia por nenhum método');
      return null;
    }
    
    console.log('✅ Mídia baixada, fazendo upload para Supabase Storage...');
    
    // Convert base64 to binary
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const binaryData = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
    
    // Generate unique filename
    const extension = getExtensionFromMimeType(attachment.mimeType || 'application/octet-stream');
    const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, binaryData, {
        contentType: attachment.mimeType || 'application/octet-stream',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('❌ Error uploading to storage:', uploadError);
      return null;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);
    
    console.log('✅ Media uploaded to Supabase Storage:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Error in downloadAndUploadMediaForImport:', error);
    return null;
  }
}

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
      case 'reprocess-media':
        return await reprocessMedia(req, supabase, evolutionApiUrl, evolutionApiKey);
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
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: true,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'PRESENCE_UPDATE',
              'QRCODE_UPDATED'
            ]
          }),
        });
        console.log(`📡 Webhook configurado para ${instanceName}`);
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
    
    // Formato correto para Evolution API - estrutura aninhada
    const response = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE', 
            'CONNECTION_UPDATE',
            'PRESENCE_UPDATE',
            'QRCODE_UPDATED'
          ]
        }
      }),
    });
    
    console.log(`📡 Webhook configurado para ${instanceName}: ${response.status}`);

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
// FETCH CHATS - IMPORTAÇÃO SIMPLES E DIRETA v4
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
    console.log(`📥 IMPORTAÇÃO v4: ${instanceName}`);
    console.log(`========================================\n`);

    // Get instance record
    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord?.company_id) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;

    // Check connection
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
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
      return new Response(JSON.stringify({ error: `Não conectada: ${connectionState}` }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Stats
    const stats = { contacts: 0, conversations: 0, messages: 0, groups: 0 };

    // ============================================================
    // 1. BUSCAR TODOS OS CHATS DO WHATSAPP
    // ============================================================
    console.log(`📥 Buscando chats...`);
    
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error('Falha ao buscar chats');
    }

    const chatsData = await chatsResponse.json();
    const allChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || []);
    console.log(`✅ ${allChats.length} chats encontrados`);

    // ============================================================
    // 2. BUSCAR CONTATOS PARA NOMES
    // ============================================================
    console.log(`📥 Buscando contatos...`);
    
    let contactsData: any[] = [];
    try {
      const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: {} })
      });
      if (contactsResponse.ok) {
        const data = await contactsResponse.json();
        contactsData = Array.isArray(data) ? data : [];
        console.log(`✅ ${contactsData.length} contatos encontrados`);
      }
    } catch (e) { /* ignore */ }

    // Criar mapa de JID -> nome
    const nameMap = new Map<string, string>();
    for (const c of contactsData) {
      const jid = c.remoteJid || c.jid || c.id;
      const name = c.pushName || c.name || c.notify || c.verifiedName;
      if (jid && name) nameMap.set(jid, name);
    }

    // ============================================================
    // 3. PROCESSAR CADA CHAT
    // ============================================================
    console.log(`\n🔄 Processando ${allChats.length} chats...\n`);

    for (let i = 0; i < allChats.length; i++) {
      const chat = allChats[i];
      const jid = chat.remoteJid || chat.id || chat.jid || '';
      
      if (!jid || jid.includes('@broadcast') || jid.startsWith('status@')) continue;
      
      const isGroup = jid.includes('@g.us');
      const chatName = chat.name || chat.pushName || chat.subject || nameMap.get(jid) || '';
      const profilePic = chat.profilePictureUrl || chat.imgUrl || null;
      
      // Log progress
      if ((i + 1) % 20 === 0) console.log(`📊 Processados ${i + 1}/${allChats.length}...`);

      try {
        // Variáveis compartilhadas para grupos e contatos individuais
        let contactId: string | null = null;
        let convId: string | null = null;
        
        // ============================================================
        // GRUPOS - Buscar nome real via API de metadados do grupo
        // ============================================================
        if (isGroup) {
          let groupName = chatName || chat.subject || '';
          let groupPic = profilePic;
          
          // Buscar metadados do grupo para obter nome real (subject)
          try {
            const groupMetaResponse = await fetch(`${evolutionApiUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
              method: 'GET',
              headers: { 'apikey': evolutionApiKey }
            });
            
            if (groupMetaResponse.ok) {
              const groupsData = await groupMetaResponse.json();
              const groups = Array.isArray(groupsData) ? groupsData : [];
              const groupInfo = groups.find((g: any) => g.id === jid || g.jid === jid);
              
              if (groupInfo) {
                groupName = groupInfo.subject || groupInfo.name || groupName;
                groupPic = groupInfo.profilePictureUrl || groupInfo.pictureUrl || groupPic;
                console.log(`👥 Grupo encontrado: "${groupName}" (API metadata)`);
              }
            }
          } catch (e) {
            console.log(`⚠️ Falha ao buscar metadados do grupo ${jid}`);
          }
          
          // Fallback se ainda não tem nome
          if (!groupName) groupName = `Grupo ${jid.slice(-8)}`;
          console.log(`👥 ${groupName}`);

          // Criar/encontrar contato do grupo
          let { data: existingContact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('metadata->>remoteJid', jid)
            .maybeSingle();

          // Usar contactId declarado no escopo externo
          if (!existingContact) {
            const { data: newContact } = await supabase
              .from('contacts')
              .insert({
                company_id: companyId,
                name: groupName,
                avatar_url: groupPic,
                metadata: { remoteJid: jid, isGroup: true }
              })
              .select('id')
              .single();
            contactId = newContact?.id;
            if (contactId) stats.contacts++;
          } else {
            contactId = existingContact.id;
            // Atualizar nome do grupo se mudou ou era genérico
            if (existingContact.name !== groupName && !existingContact.name.includes('Grupo ')) {
              // Manter nome atual se não é genérico
            } else if (groupName && groupName !== existingContact.name) {
              await supabase
                .from('contacts')
                .update({ name: groupName, avatar_url: groupPic || existingContact.avatar_url })
                .eq('id', contactId);
              console.log(`  ✏️ Nome atualizado: "${existingContact.name}" → "${groupName}"`);
            }
          }

          if (!contactId) continue;

          // Criar/encontrar conversa
          let { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', companyId)
            .eq('contact_id', contactId)
            .eq('channel', 'whatsapp')
            .maybeSingle();

          // Usar convId declarado no escopo externo
          if (!existingConv) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                company_id: companyId,
                contact_id: contactId,
                channel: 'whatsapp',
                status: 'open',
                metadata: { isGroup: true, remoteJid: jid, instanceName, groupSubject: groupName }
              })
              .select('id')
              .single();
            convId = newConv?.id;
            if (convId) stats.conversations++;
          } else {
            convId = existingConv.id;
          }

          stats.groups++;
          // NÃO usar continue aqui - grupos também precisam ter mensagens importadas!
        } else {
          // ============================================================
          // CONTATOS INDIVIDUAIS (não grupos)
          // ============================================================
          
        // Detectar se é @lid (ID interno) ou @s.whatsapp.net (telefone real)
          const isLid = jid.includes('@lid');
          const phoneMatch = jid.match(/^(\d+)@/);
          if (!phoneMatch) continue;
          
          const rawNumber = phoneMatch[1];
          let phone = rawNumber;
          
          // VALIDAÇÃO: Se rawNumber parece ser @lid ID (> 15 dígitos ou não parece telefone brasileiro)
          // Isso evita salvar IDs internos como phone
          if (rawNumber.length > 15) {
            console.log(`⏭️ Pulando ID inválido (muito longo): ${rawNumber}`);
            continue;
          }
        
        // Obter nome
        const name = chatName || nameMap.get(jid) || '';
        
        // ============================================================
        // @lid - IDs internos do WhatsApp (sem telefone real)
        // Tentar fazer match por nome com contato existente
        // ============================================================
        if (isLid) {
          if (!name || name === rawNumber) {
            console.log(`⏭️ @lid sem nome: ${rawNumber}`);
            continue;
          }
          
          console.log(`🔍 @lid: Buscando "${name}" por nome...`);
          
          // Função para normalizar nome (remover acentos)
          const normalizeStr = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const normalizedName = normalizeStr(name);
          
          // Buscar TODOS os contatos da empresa com telefone
          const { data: allContacts } = await supabase
            .from('contacts')
            .select('id, name, phone')
            .eq('company_id', companyId)
            .not('phone', 'is', null);
          
          // Fazer match ignorando acentos
          let existingContact = null;
          if (allContacts) {
            existingContact = allContacts.find(c => {
              if (!c.name) return false;
              const normalizedContactName = normalizeStr(c.name);
              return normalizedContactName === normalizedName || 
                     normalizedContactName.includes(normalizedName) ||
                     normalizedName.includes(normalizedContactName);
            });
          }
          
          if (!existingContact) {
            console.log(`  ❌ Contato "${name}" não encontrado no DB`);
            continue;
          }
          
          console.log(`  ✅ Match: "${name}" → ${existingContact.name} (${existingContact.phone})`);
          contactId = existingContact.id;
          phone = existingContact.phone; // Guardar phone para buscar mensagens
          
          // Verificar/criar conversa
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', companyId)
            .eq('contact_id', contactId)
            .eq('channel', 'whatsapp')
            .maybeSingle();
          
          if (!existingConv) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                company_id: companyId,
                contact_id: contactId,
                channel: 'whatsapp',
                status: 'open',
                metadata: { lidJid: jid, instanceName }
              })
              .select('id')
              .single();
            convId = newConv?.id || null;
            if (convId) {
              stats.conversations++;
              console.log(`  ✅ Conversa criada para "${name}"`);
            }
          } else {
            convId = existingConv.id;
            console.log(`  🔄 Conversa @lid existente, sincronizando mensagens...`);
          }
        } 
        // ============================================================
        // @s.whatsapp.net - Telefone real
        // ============================================================
        else {
          // Normalizar: adicionar 55 se necessário
          if (phone.length === 10 || phone.length === 11) {
            phone = '55' + phone;
          }
          
          // Validar que parece um telefone real (8-15 dígitos)
          if (phone.length < 8 || phone.length > 15) {
            console.log(`⏭️ Telefone inválido: ${phone}`);
            continue;
          }
          
          console.log(`📱 ${name || phone} (${phone})`);

          // Criar/encontrar contato
          let { data: existingContact } = await supabase
            .from('contacts')
            .select('id, name, avatar_url')
            .eq('company_id', companyId)
            .eq('phone', phone)
            .maybeSingle();

          if (!existingContact) {
            const { data: newContact } = await supabase
              .from('contacts')
              .insert({
                company_id: companyId,
                name: name || phone,
                phone: phone,
                avatar_url: profilePic,
                metadata: { remoteJid: jid }
              })
              .select('id')
              .single();
            contactId = newContact?.id || null;
            if (contactId) stats.contacts++;
          } else {
            contactId = existingContact.id;
            // Atualizar nome se temos um melhor
            const hasRealName = name && !/^\d+$/.test(name);
            const currentNameIsPhone = /^\d+$/.test(existingContact.name || '');
            if (hasRealName && currentNameIsPhone) {
              await supabase.from('contacts').update({ name }).eq('id', contactId);
            }
            // Atualizar foto se não tem
            if (profilePic && !existingContact.avatar_url) {
              await supabase.from('contacts').update({ avatar_url: profilePic }).eq('id', contactId);
            }
          }

          if (!contactId) continue;

          // Criar/encontrar conversa
          let { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('company_id', companyId)
            .eq('contact_id', contactId)
            .eq('channel', 'whatsapp')
            .maybeSingle();

          if (!existingConv) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                company_id: companyId,
                contact_id: contactId,
                channel: 'whatsapp',
                status: 'open',
                metadata: { remoteJid: jid, instanceName }
              })
              .select('id')
              .single();
            convId = newConv?.id || null;
            if (convId) {
              stats.conversations++;
              console.log(`  ✅ Conversa criada`);
            }
          } else {
            convId = existingConv.id;
            console.log(`  🔄 Conversa existente, sincronizando mensagens...`);
          }
          }
        } // Fim do else (contatos individuais)

        if (!convId) continue;

        // ============================================================
        // BUSCAR MENSAGENS DO CHAT usando findMessages
        // ============================================================
        console.log(`  🔍 Buscando mensagens para jid: ${jid}`);
        try {
          const msgUrl = `${evolutionApiUrl}/chat/findMessages/${instanceName}`;
          console.log(`  📡 URL: ${msgUrl}`);
          
          const messagesResponse = await fetch(msgUrl, {
            method: 'POST',
            headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              where: { key: { remoteJid: jid } },
              limit: 1000 // Aumentado para buscar mais mensagens
            })
          });
          
          console.log(`  📥 Status: ${messagesResponse.status}`);
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const rawMessages = messagesData?.messages;
            console.log(`  📦 messages type: ${typeof rawMessages}, isArray: ${Array.isArray(rawMessages)}`);
            if (rawMessages && !Array.isArray(rawMessages)) {
              console.log(`  📦 messages keys: ${Object.keys(rawMessages).join(', ')}`);
            }
            
            // Tentar múltiplas estruturas possíveis
            const messages = Array.isArray(rawMessages) ? rawMessages :
                            (rawMessages?.records || rawMessages?.data || []);
            
            console.log(`  📨 ${messages.length} mensagens encontradas`);
            
            if (messages.length > 0) {
              // Importar mensagens
              for (const msg of messages) {
                const msgId = msg.key?.id;
                if (!msgId) continue;
                
                // Extrair conteúdo
                const msgContent = msg.message || {};
                let content = '';
                let hasMedia = false;
                
                if (msgContent.conversation) content = msgContent.conversation;
                else if (msgContent.extendedTextMessage?.text) content = msgContent.extendedTextMessage.text;
                else if (msgContent.imageMessage) {
                  content = msgContent.imageMessage.caption || '📷 Imagem';
                  hasMedia = true;
                }
                else if (msgContent.videoMessage) {
                  content = msgContent.videoMessage.caption || '🎬 Vídeo';
                  hasMedia = true;
                }
                else if (msgContent.audioMessage) {
                  content = '🎵 Áudio';
                  hasMedia = true;
                }
                else if (msgContent.documentMessage) {
                  content = `📄 ${msgContent.documentMessage.fileName || 'Documento'}`;
                  hasMedia = true;
                }
                else if (msgContent.stickerMessage) content = '🎨 Sticker';
                
                if (!content) continue;
                
                // Verificar duplicata
                const { data: existingMsg } = await supabase
                  .from('messages')
                  .select('id, metadata')
                  .eq('conversation_id', convId)
                  .eq('metadata->>messageId', msgId)
                  .maybeSingle();
                
                // Se mensagem existe mas tem mídia sem URL, tentar reprocessar
                if (existingMsg) {
                  const existingAttachment = existingMsg.metadata?.attachment;
                  const needsMediaReprocess = hasMedia && (!existingAttachment?.url || existingAttachment?.url === '');
                  
                  if (needsMediaReprocess) {
                    console.log(`    🔄 Reprocessando mídia para mensagem existente: ${msgId}`);
                    const attachment = extractAttachmentFromMessage(msgContent);
                    if (attachment) {
                      const storageUrl = await downloadAndUploadMediaForImport(
                        supabase, attachment, msg, convId, instanceName, evolutionApiUrl, evolutionApiKey
                      );
                      if (storageUrl) {
                        await supabase.from('messages')
                          .update({ metadata: { ...existingMsg.metadata, attachment: { ...attachment, url: storageUrl } } })
                          .eq('id', existingMsg.id);
                        console.log(`    ✅ Mídia atualizada: ${storageUrl.substring(0, 50)}...`);
                      }
                    }
                  }
                  continue;
                }
                
                const timestamp = msg.messageTimestamp;
                const msgDate = timestamp ? new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000) : new Date();
                
                // Para grupos, adicionar nome do remetente
                let finalContent = content;
                if (isGroup && !msg.key?.fromMe && msg.pushName) {
                  finalContent = `*${msg.pushName}*:\n\n${content}`;
                }
                
                // Extrair e processar attachment se houver mídia
                let messageMetadata: Record<string, any> = { messageId: msgId };
                
                if (hasMedia) {
                  const attachment = extractAttachmentFromMessage(msgContent);
                  if (attachment) {
                    console.log(`    📎 Attachment detected: ${attachment.type}`);
                    
                    // Tentar baixar e fazer upload da mídia
                    const storageUrl = await downloadAndUploadMediaForImport(
                      supabase,
                      attachment,
                      msg,
                      convId,
                      instanceName,
                      evolutionApiUrl,
                      evolutionApiKey
                    );
                    
                    if (storageUrl) {
                      messageMetadata.attachment = {
                        ...attachment,
                        url: storageUrl,
                      };
                      console.log(`    ✅ Media uploaded: ${storageUrl.substring(0, 60)}...`);
                    } else {
                      // Manter URL original (pode expirar) ou marcar como indisponível
                      messageMetadata.attachment = attachment;
                      console.log(`    ⚠️ Media not uploaded, keeping reference`);
                    }
                  }
                }
                
                await supabase.from('messages').insert({
                  conversation_id: convId,
                  content: finalContent,
                  sender_type: msg.key?.fromMe ? 'agent' : 'user',
                  created_at: msgDate.toISOString(),
                  metadata: messageMetadata
                });
                stats.messages++;
              }
              
              // Atualizar timestamp da conversa com a última mensagem
              const lastMsg = messages[messages.length - 1];
              if (lastMsg?.messageTimestamp) {
                const ts = lastMsg.messageTimestamp;
                const lastMsgDate = new Date(ts > 9999999999 ? ts : ts * 1000);
                await supabase.from('conversations')
                  .update({ updated_at: lastMsgDate.toISOString() })
                  .eq('id', convId);
              }
            }
          } else {
            const errText = await messagesResponse.text();
            console.log(`  ❌ findMessages falhou: ${messagesResponse.status} - ${errText.substring(0, 200)}`);
          }
        } catch (msgErr) {
          console.log(`  ❌ Erro ao buscar mensagens: ${msgErr}`);
        }

      } catch (chatError) {
        console.error(`Erro em chat:`, chatError);
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ IMPORTAÇÃO CONCLUÍDA`);
    console.log(`========================================`);
    console.log(`📊 Contatos: ${stats.contacts} criados`);
    console.log(`📊 Conversas: ${stats.conversations} criadas`);
    console.log(`📊 Grupos: ${stats.groups}`);
    console.log(`📊 Mensagens: ${stats.messages} importadas`);
    console.log(`========================================\n`);

    // ============================================================
    // SINCRONIZAR FOTOS DE PERFIL
    // ============================================================
    console.log(`📷 Sincronizando fotos de perfil...`);
    let photosUpdated = 0;
    try {
      // Buscar contatos sem foto que foram importados/atualizados
      const { data: contactsNeedingPhotos } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('company_id', companyId)
        .is('avatar_url', null)
        .not('phone', 'is', null)
        .limit(50);
      
      if (contactsNeedingPhotos && contactsNeedingPhotos.length > 0) {
        console.log(`📷 ${contactsNeedingPhotos.length} contatos sem foto`);
        
        for (const contact of contactsNeedingPhotos) {
          try {
            const picResponse = await fetch(
              `${evolutionApiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
              {
                method: 'POST',
                headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: contact.phone })
              }
            );
            
            if (picResponse.ok) {
              const picData = await picResponse.json();
              const picUrl = picData.profilePictureUrl || picData.picture?.url || picData.imgUrl;
              
              if (picUrl) {
                await supabase
                  .from('contacts')
                  .update({ avatar_url: picUrl, updated_at: new Date().toISOString() })
                  .eq('id', contact.id);
                photosUpdated++;
                console.log(`  ✅ Foto atualizada: ${contact.name}`);
              }
            }
          } catch (e) {
            // Ignorar erros de foto individual
          }
        }
      }
    } catch (e) {
      console.log(`⚠️ Erro ao sincronizar fotos: ${e}`);
    }

    console.log(`📷 ${photosUpdated} fotos atualizadas`);

    return new Response(JSON.stringify({ 
      success: true,
      importedContacts: stats.contacts,
      importedConversations: stats.conversations,
      importedMessages: stats.messages,
      photosUpdated,
      totalChats: allChats.length,
      stats
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha na importação', 
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
    // Extrair apenas o número do JID para logs mais claros
    const phoneForLog = remoteJid.replace('@s.whatsapp.net', '');
    console.log(`  🔍 Sync: ${phoneForLog}`);
    
    // Tentar múltiplos métodos para buscar mensagens (Evolution API é inconsistente)
    let messages: any[] = [];
    let apiMethod = '';
    
    // Método 1: findMessages com where.key.remoteJid
    try {
      const response1 = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: { key: { remoteJid: remoteJid } },
          limit: 1000
        })
      });
      
      if (response1.ok) {
        const data = await response1.json();
        const raw = data?.messages;
        messages = Array.isArray(raw) ? raw : 
                   (raw?.records || data?.records || raw?.data || []);
        if (messages.length > 0) apiMethod = 'key.remoteJid';
      }
    } catch (e) { /* continue */ }
    
    // Método 2: Se método 1 falhou, tentar findMessages com where.remoteJid diretamente
    if (messages.length === 0) {
      try {
        const response2 = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            where: { remoteJid: remoteJid },
            limit: 1000
          })
        });
        
        if (response2.ok) {
          const data = await response2.json();
          const raw = data?.messages;
          messages = Array.isArray(raw) ? raw : 
                     (raw?.records || data?.records || raw?.data || []);
          if (messages.length > 0) apiMethod = 'remoteJid';
        }
      } catch (e) { /* continue */ }
    }
    
    if (messages.length === 0) {
      console.log(`  ⚠️ ${phoneForLog}: 0 msgs na API`);
      return 0;
    }
    
    // Encontrar a mensagem mais recente da API para comparação
    let latestApiTimestamp = 0;
    for (const msg of messages) {
      const ts = msg.messageTimestamp || msg.key?.messageTimestamp || 0;
      const tsNum = typeof ts === 'number' ? ts : 0;
      if (tsNum > latestApiTimestamp) latestApiTimestamp = tsNum;
    }
    const latestApiDate = new Date((latestApiTimestamp > 9999999999 ? latestApiTimestamp : latestApiTimestamp * 1000));
    
    // Get existing message IDs para TODAS as conversas (evitar duplicar entre conversas)
    const { data: existingMsgsGlobal } = await supabase
      .from('messages')
      .select('metadata')
      .not('metadata->messageId', 'is', null);
    
    const globalMessageIds = new Set<string>();
    for (const msg of existingMsgsGlobal || []) {
      if (msg.metadata?.messageId) globalMessageIds.add(msg.metadata.messageId);
    }
    
    // Get existing message IDs para esta conversa
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('metadata, created_at')
      .eq('conversation_id', conversationId);
    
    const existingIds = new Set<string>();
    let latestDbTimestamp = 0;
    for (const msg of existingMsgs || []) {
      if (msg.metadata?.messageId) existingIds.add(msg.metadata.messageId);
      const dbTs = new Date(msg.created_at).getTime();
      if (dbTs > latestDbTimestamp) latestDbTimestamp = dbTs;
    }
    
    const latestDbDate = latestDbTimestamp > 0 ? new Date(latestDbTimestamp) : null;
    
    // Log detalhado para debug
    console.log(`  📊 ${phoneForLog}: API=${messages.length} msgs (até ${latestApiDate.toISOString().slice(0,16)}), DB=${existingIds.size} (até ${latestDbDate?.toISOString().slice(0,16) || 'N/A'})`);
    
    let importedCount = 0;
    let skippedGlobal = 0;
    let lastMsgTimestamp: Date | null = null;
    
    // Sort by timestamp
    messages.sort((a: any, b: any) => {
      const tsA = a.messageTimestamp || a.key?.messageTimestamp || 0;
      const tsB = b.messageTimestamp || b.key?.messageTimestamp || 0;
      return (typeof tsA === 'number' ? tsA : 0) - (typeof tsB === 'number' ? tsB : 0);
    });
    
    for (const msg of messages) {
      const messageId = msg.key?.id;
      
      // Skip se já existe nesta conversa
      if (messageId && existingIds.has(messageId)) continue;
      
      // CRÍTICO: Skip se já existe em QUALQUER conversa (evita duplicar entre conversas)
      if (messageId && globalMessageIds.has(messageId)) {
        skippedGlobal++;
        continue;
      }
      
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
      
      // Tratar erro de duplicata (índice único no messageId) graciosamente
      if (!error) {
        importedCount++;
        if (messageId) {
          existingIds.add(messageId);
          globalMessageIds.add(messageId);
        }
      } else if (error.code === '23505') {
        // Duplicata detectada pelo índice único - ignorar silenciosamente
        skippedGlobal++;
      }
    }
    
    if (skippedGlobal > 0) {
      console.log(`  ⚠️ ${phoneForLog}: ${skippedGlobal} msgs já em outras conversas (ignoradas)`);
    }
    
    // Update conversation timestamp
    if (lastMsgTimestamp) {
      await supabase.from('conversations')
        .update({ updated_at: lastMsgTimestamp.toISOString() })
        .eq('id', conversationId);
    }
    
    if (importedCount > 0) {
      console.log(`  ✅ +${importedCount} novas mensagens`);
    }
    
    return importedCount;
  } catch (e) {
    console.error('❌ Erro sync messages:', e);
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

    // STEP 1: Criar mapa de telefone -> JID real do findChats
    const phoneToJid = new Map<string, string>();
    for (const chat of whatsappChats) {
      const jid = chat.remoteJid || chat.id || chat.jid || '';
      if (!jid || jid.includes('@g.us') || jid.includes('@broadcast') || jid.includes('@lid')) continue;
      
      const phoneMatch = jid.match(/^(\d+)@/);
      if (phoneMatch) {
        let phone = phoneMatch[1];
        // Normalizar telefone brasileiro
        if (phone.length === 10 || phone.length === 11) {
          phone = '55' + phone;
        }
        phoneToJid.set(phone, jid);
      }
    }
    
    console.log(`🗺️ ${phoneToJid.size} JIDs mapeados de ${whatsappChats.length} chats`);
    
    // STEP 2: Sincronizar apenas conversas existentes com JID válido
    let syncedMessages = 0;
    let updatedTimestamps = 0;

    const { data: allConversations } = await supabase
      .from('conversations')
      .select('id, contact_id, metadata, contacts(phone, name, metadata)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp')
      .limit(500);
    
    console.log(`🔄 Sincronizando mensagens para ${allConversations?.length || 0} conversas...`);
    
    for (const conv of allConversations || []) {
      const phone = conv.contacts?.phone;
      if (!phone || phone.length < 8) continue;
      
      // Usar JID do metadata do contato se disponível, senão do mapa findChats
      let whatsappJid = conv.contacts?.metadata?.remoteJid || phoneToJid.get(phone);
      
      // Fallback: construir JID se não encontrou
      if (!whatsappJid) {
        whatsappJid = `${phone}@s.whatsapp.net`;
      }
      
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

// ============================================================
// REPROCESS MEDIA - Reprocessar mídias de mensagens existentes
// ============================================================
async function reprocessMedia(req: Request, supabase: any, evolutionApiUrl: string, evolutionApiKey: string) {
  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar autorização
    if (!ALLOWED_INSTANCES.includes(instanceName) && !ALLOWED_INSTANCES.includes(instanceName.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Instância não autorizada' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔄 Iniciando reprocessamento de mídias para ${instanceName}...`);

    // Obter company_id da instância
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', instanceName)
      .single();

    if (!instance?.company_id) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const companyId = instance.company_id;

    // Buscar TODAS as mensagens que podem ter mídia:
    // 1. Mensagens com attachment mas sem URL válida
    // 2. Mensagens com conteúdo indicando mídia (📷, 🎵, 🎬, 📄) mas sem attachment
    const { data: allMessages, error: queryError } = await supabase
      .from('messages')
      .select(`
        id, 
        conversation_id, 
        content, 
        metadata,
        conversations!inner(company_id, metadata, contact_id)
      `)
      .eq('conversations.company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (queryError) {
      console.error('❌ Erro ao buscar mensagens:', queryError);
      throw queryError;
    }

    // Filtrar mensagens que precisam de reprocessamento
    const messagesToProcess = (allMessages || []).filter((msg: any) => {
      const attachment = msg.metadata?.attachment;
      const content = msg.content || '';
      const messageId = msg.metadata?.messageId;
      
      // Sem messageId não conseguimos buscar no WhatsApp
      if (!messageId) return false;
      
      // Caso 1: Tem attachment mas sem URL válida
      if (attachment) {
        const hasNoUrl = !attachment.url || attachment.url === '';
        const hasExpiredUrl = attachment.url && (
          attachment.url.includes('mmg.whatsapp.net') || 
          attachment.url.includes('enc.media') ||
          !attachment.url.startsWith('https://xxojpfhnkxpbznbmhmua')
        );
        if (hasNoUrl || hasExpiredUrl) return true;
      }
      
      // Caso 2: Conteúdo indica mídia mas não tem attachment
      if (!attachment) {
        const hasMediaContent = 
          content.includes('📷') || content.includes('Imagem') ||
          content.includes('🎵') || content.includes('Áudio') ||
          content.includes('🎬') || content.includes('Vídeo') ||
          content.includes('📄') || content.includes('Documento');
        if (hasMediaContent) return true;
      }
      
      return false;
    });

    console.log(`📊 ${messagesToProcess.length} mensagens com mídia para reprocessar`);

    if (messagesToProcess.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        updated: 0,
        failed: 0,
        message: 'Nenhuma mídia pendente para reprocessar'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;
    let updated = 0;
    let failed = 0;

    for (const msg of messagesToProcess) {
      processed++;
      const messageId = msg.metadata?.messageId;
      const content = msg.content || '';
      
      console.log(`  🔄 [${processed}/${messagesToProcess.length}] Processando ${messageId}`);

      try {
        // Buscar remoteJid da conversa
        const convMetadata = msg.conversations?.metadata;
        const remoteJid = convMetadata?.remoteJid || convMetadata?.lidJid;
        
        if (!remoteJid) {
          console.log(`    ⏭️ Sem remoteJid, pulando`);
          failed++;
          continue;
        }

        // Buscar mensagem original do WhatsApp
        const findMsgResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            where: { 
              key: { 
                remoteJid,
                id: messageId
              }
            },
            limit: 1
          })
        });

        if (!findMsgResponse.ok) {
          console.log(`    ❌ Falha ao buscar mensagem: ${findMsgResponse.status}`);
          failed++;
          continue;
        }

        const findMsgData = await findMsgResponse.json();
        const messages = findMsgData?.messages || [];
        const originalMsg = messages.find((m: any) => m.key?.id === messageId);

        if (!originalMsg) {
          console.log(`    ❌ Mensagem não encontrada no WhatsApp`);
          failed++;
          continue;
        }

        // Extrair attachment da mensagem original
        const msgContent = originalMsg.message || {};
        let attachment = msg.metadata?.attachment || extractAttachmentFromMessage(msgContent);
        
        if (!attachment) {
          // Tentar determinar tipo pelo conteúdo
          if (content.includes('📷') || content.includes('Imagem')) {
            attachment = { type: 'image', url: '', mimeType: 'image/jpeg' };
          } else if (content.includes('🎵') || content.includes('Áudio')) {
            attachment = { type: 'audio', url: '', mimeType: 'audio/ogg' };
          } else if (content.includes('🎬') || content.includes('Vídeo')) {
            attachment = { type: 'video', url: '', mimeType: 'video/mp4' };
          } else if (content.includes('📄') || content.includes('Documento')) {
            attachment = { type: 'document', url: '', mimeType: 'application/pdf' };
          }
        }

        if (!attachment) {
          console.log(`    ⏭️ Não foi possível determinar tipo de attachment`);
          failed++;
          continue;
        }

        console.log(`    📎 Tipo: ${attachment.type}`);

        // Tentar baixar a mídia
        const storageUrl = await downloadAndUploadMediaForImport(
          supabase,
          attachment,
          originalMsg,
          msg.conversation_id,
          instanceName,
          evolutionApiUrl,
          evolutionApiKey
        );

        if (storageUrl) {
          // Atualizar mensagem com novo attachment e URL
          await supabase.from('messages')
            .update({ 
              metadata: { 
                ...msg.metadata, 
                attachment: { 
                  ...attachment, 
                  url: storageUrl 
                } 
              } 
            })
            .eq('id', msg.id);
          
          console.log(`    ✅ Mídia atualizada: ${storageUrl.substring(0, 50)}...`);
          updated++;
        } else {
          console.log(`    ⚠️ Não foi possível baixar mídia`);
          failed++;
        }
      } catch (err) {
        console.error(`    ❌ Erro:`, err);
        failed++;
      }

      // Pequena pausa para não sobrecarregar a API
      await new Promise(r => setTimeout(r, 150));
    }

    console.log(`✅ Reprocessamento concluído: ${updated} atualizadas, ${failed} falhas`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      updated,
      failed,
      message: `${updated} mídia(s) reprocessada(s) com sucesso`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro em reprocessMedia:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha ao reprocessar mídias', 
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
