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
    const { contactId, phone } = await req.json();
    
    if (!contactId && !phone) {
      return new Response(
        JSON.stringify({ error: 'contactId ou phone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    
    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API credentials not configured');
    }

    // Buscar contato
    let contact;
    if (contactId) {
      const { data } = await supabase
        .from('contacts')
        .select('id, name, phone, avatar_url, metadata')
        .eq('id', contactId)
        .single();
      contact = data;
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      const { data } = await supabase
        .from('contacts')
        .select('id, name, phone, avatar_url, metadata')
        .or(`phone.eq.${cleanPhone},phone.like.%${cleanPhone.slice(-8)}%`)
        .limit(1)
        .single();
      contact = data;
    }

    if (!contact) {
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é grupo
    const isGroup = contact.metadata?.isGroup === true || 
                    contact.metadata?.remoteJid?.includes('@g.us');

    console.log(`📷 Atualizando foto de ${contact.name} (${isGroup ? 'GRUPO' : contact.phone})...`);

    // Buscar instâncias conectadas
    const instancesResp = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': evolutionApiKey }
    });
    
    const instances = await instancesResp.json();
    
    const getInstanceName = (inst: any): string | null => {
      return inst.instance?.instanceName || 
             inst.instanceName || 
             inst.name || 
             inst.instance?.name;
    };
    
    const getInstanceState = (inst: any): string => {
      return inst.instance?.state || 
             inst.state || 
             inst.instance?.connectionStatus || 
             inst.connectionStatus ||
             inst.status ||
             'unknown';
    };

    let instanceName: string | null = null;
    
    for (const inst of instances) {
      const name = getInstanceName(inst);
      const state = getInstanceState(inst);
      if (state === 'open' || state === 'connected') {
        instanceName = name;
        break;
      }
    }
    
    if (!instanceName && instances.length > 0) {
      instanceName = getInstanceName(instances[0]);
    }

    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma instância disponível' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📱 Usando instância: ${instanceName}`);

    let pictureUrl: string | null = null;

    if (isGroup) {
      // Para grupos, usar o remoteJid do metadata
      const groupJid = contact.metadata?.remoteJid;
      if (!groupJid) {
        return new Response(
          JSON.stringify({ error: 'Grupo sem remoteJid no metadata', contact }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📸 Buscando foto do grupo: ${groupJid}`);
      
      // Tentar fetchProfilePictureUrl primeiro
      const profileResp = await fetch(
        `${evolutionApiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({ number: groupJid })
        }
      );

      const profileData = await profileResp.json();
      console.log('📸 Resposta fetchProfilePictureUrl:', JSON.stringify(profileData));
      
      pictureUrl = profileData.profilePictureUrl || profileData.picture || profileData.imgUrl || profileData.url;

      // Se não funcionou, tentar findGroups
      if (!pictureUrl) {
        console.log('🔍 Tentando findGroups...');
        const groupsResp = await fetch(
          `${evolutionApiUrl}/group/findGroups/${instanceName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey
            },
            body: JSON.stringify({ groupJid })
          }
        );
        
        const groupData = await groupsResp.json();
        console.log('📸 Resposta findGroups:', JSON.stringify(groupData));
        
        if (groupData?.pictureUrl) {
          pictureUrl = groupData.pictureUrl;
        } else if (Array.isArray(groupData) && groupData.length > 0) {
          pictureUrl = groupData[0]?.pictureUrl || groupData[0]?.profilePictureUrl;
        }
      }

      // Última tentativa: fetchGroups
      if (!pictureUrl) {
        console.log('🔍 Tentando fetchGroups...');
        const allGroupsResp = await fetch(
          `${evolutionApiUrl}/group/fetchGroups/${instanceName}?getProfilePicture=true`,
          {
            headers: { 'apikey': evolutionApiKey }
          }
        );
        
        const allGroups = await allGroupsResp.json();
        const targetGroup = Array.isArray(allGroups) 
          ? allGroups.find((g: any) => g.id === groupJid || g.jid === groupJid)
          : null;
          
        if (targetGroup) {
          console.log('📸 Grupo encontrado:', JSON.stringify(targetGroup));
          pictureUrl = targetGroup.pictureUrl || targetGroup.profilePictureUrl || targetGroup.picture;
        }
      }

    } else {
      // Para contatos normais
      const remoteJid = contact.phone?.includes('@') 
        ? contact.phone 
        : `${contact.phone}@s.whatsapp.net`;

      console.log(`📸 Buscando foto para ${remoteJid}`);
      const profileResp = await fetch(
        `${evolutionApiUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({ number: remoteJid })
        }
      );

      const profileData = await profileResp.json();
      console.log('📸 Resposta da Evolution:', JSON.stringify(profileData));

      pictureUrl = profileData.profilePictureUrl || profileData.picture || profileData.imgUrl || profileData.url;
    }

    if (!pictureUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Foto não disponível na API',
          contact: { id: contact.id, name: contact.name, isGroup }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Baixar e fazer upload da imagem
    console.log(`📥 Baixando imagem: ${pictureUrl}`);
    
    const imageResp = await fetch(pictureUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!imageResp.ok) {
      throw new Error(`Falha ao baixar imagem: ${imageResp.status}`);
    }

    const contentType = imageResp.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResp.arrayBuffer();
    const blob = new Uint8Array(imageBuffer);

    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';

    const fileName = `${contact.id}.${extension}`;

    // Upload para storage
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, blob, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      throw new Error(`Upload falhou: ${uploadError.message}`);
    }

    // Obter URL pública com cache buster
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    const newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    // Atualizar contato
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ 
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', contact.id);

    if (updateError) {
      throw new Error(`Falha ao atualizar contato: ${updateError.message}`);
    }

    console.log(`✅ Foto atualizada: ${newAvatarUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          isGroup,
          oldAvatarUrl: contact.avatar_url,
          newAvatarUrl
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
