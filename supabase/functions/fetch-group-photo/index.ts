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
    const { groupJid } = await req.json().catch(() => ({}));
    
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar instância conectada
    const instancesResp = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
      headers: { 'apikey': evolutionKey }
    });
    const instances = await instancesResp.json();
    
    const connectedInstance = instances.find((i: any) => 
      (i.instance?.state || i.state) === 'open'
    );
    
    const instanceName = connectedInstance?.instance?.instanceName || 
                         connectedInstance?.instanceName || 
                         'VIAINFRAOFICIAL';

    console.log(`📱 Usando instância: ${instanceName}`);
    console.log(`🔍 Buscando foto do grupo: ${groupJid || 'todos'}`);

    // Método 1: fetchAllGroups com getParticipants
    console.log('=== Método 1: fetchAllGroups ===');
    const allGroupsResp = await fetch(
      `${evolutionUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`,
      { headers: { 'apikey': evolutionKey } }
    );
    
    const allGroupsData = await allGroupsResp.json();
    console.log(`fetchAllGroups retornou: ${JSON.stringify(allGroupsData).slice(0, 500)}`);

    // Método 2: findGroupInfos
    console.log('=== Método 2: findGroupInfos ===');
    const findGroupsResp = await fetch(
      `${evolutionUrl}/group/findGroupInfos/${instanceName}`,
      {
        method: 'POST',
        headers: { 
          'apikey': evolutionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          groupJid: groupJid || '120363420262094272@g.us' 
        })
      }
    );
    
    const findGroupsData = await findGroupsResp.json();
    console.log(`findGroupInfos retornou: ${JSON.stringify(findGroupsData).slice(0, 1000)}`);

    // Método 3: getGroupInfo (endpoint alternativo)
    console.log('=== Método 3: groupInfo ===');
    const groupInfoResp = await fetch(
      `${evolutionUrl}/group/groupInfo/${instanceName}`,
      {
        method: 'POST',
        headers: { 
          'apikey': evolutionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          groupJid: groupJid || '120363420262094272@g.us' 
        })
      }
    );
    
    const groupInfoData = await groupInfoResp.json();
    console.log(`groupInfo retornou: ${JSON.stringify(groupInfoData).slice(0, 1000)}`);

    // Método 4: Buscar pictureUrl diretamente com outro endpoint
    console.log('=== Método 4: profilePicture com grupo ===');
    const picResp = await fetch(
      `${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`,
      {
        method: 'POST',
        headers: { 
          'apikey': evolutionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          number: groupJid || '120363420262094272@g.us' 
        })
      }
    );
    
    const picData = await picResp.json();
    console.log(`fetchProfilePictureUrl retornou: ${JSON.stringify(picData)}`);

    // Encontrar foto do grupo em qualquer resposta
    let pictureUrl: string | null = null;
    
    // Verificar em findGroupInfos
    if (findGroupsData?.pictureUrl) {
      pictureUrl = findGroupsData.pictureUrl;
    } else if (findGroupsData?.profilePictureUrl) {
      pictureUrl = findGroupsData.profilePictureUrl;
    }
    
    // Verificar em groupInfo
    if (!pictureUrl && groupInfoData?.pictureUrl) {
      pictureUrl = groupInfoData.pictureUrl;
    } else if (!pictureUrl && groupInfoData?.profilePictureUrl) {
      pictureUrl = groupInfoData.profilePictureUrl;
    }
    
    // Verificar em allGroupsData
    if (!pictureUrl && Array.isArray(allGroupsData)) {
      const targetGroup = allGroupsData.find((g: any) => 
        g.id === (groupJid || '120363420262094272@g.us') ||
        g.jid === (groupJid || '120363420262094272@g.us')
      );
      if (targetGroup) {
        pictureUrl = targetGroup.pictureUrl || targetGroup.profilePictureUrl;
      }
    }
    
    // Verificar em picData
    if (!pictureUrl && picData?.profilePictureUrl) {
      pictureUrl = picData.profilePictureUrl;
    }

    console.log(`🖼️ Foto encontrada: ${pictureUrl || 'NENHUMA'}`);

    // Se encontrou foto, fazer upload
    if (pictureUrl) {
      console.log('📥 Baixando foto do grupo...');
      
      const imageResp = await fetch(pictureUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (imageResp.ok) {
        const contentType = imageResp.headers.get('content-type') || 'image/jpeg';
        const imageBuffer = await imageResp.arrayBuffer();
        const blob = new Uint8Array(imageBuffer);

        const contactId = '858abf1b-7b73-437e-81bc-45e55f93f982';
        const fileName = `${contactId}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, blob, {
            contentType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(fileName);

          const newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

          await supabase
            .from('contacts')
            .update({ 
              avatar_url: newAvatarUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', contactId);

          console.log(`✅ Foto do grupo atualizada: ${newAvatarUrl}`);
          
          return new Response(JSON.stringify({
            success: true,
            pictureUrl,
            newAvatarUrl,
            method: 'uploaded'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Foto não encontrada em nenhum endpoint',
      responses: {
        fetchAllGroups: typeof allGroupsData === 'object' ? (Array.isArray(allGroupsData) ? `${allGroupsData.length} grupos` : allGroupsData) : allGroupsData,
        findGroupInfos: findGroupsData,
        groupInfo: groupInfoData,
        fetchProfilePictureUrl: picData
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
