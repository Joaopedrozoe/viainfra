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

    console.log(`📷 Atualizando foto de ${contact.name} (${contact.phone})...`);

    // Buscar instâncias conectadas
    console.log(`🔍 Buscando instâncias em ${evolutionApiUrl}/instance/fetchInstances`);
    const instancesResp = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': evolutionApiKey }
    });
    
    const instances = await instancesResp.json();
    console.log(`📱 RAW Instâncias:`, JSON.stringify(instances));
    
    // Extrair nome da instância de diferentes formatos possíveis
    const getInstanceName = (inst: any): string | null => {
      return inst.instance?.instanceName || 
             inst.instanceName || 
             inst.name || 
             inst.instance?.name ||
             (typeof inst === 'object' ? Object.keys(inst).find(k => k !== 'instance' && k !== 'state' && k !== 'status') : null);
    };
    
    const getInstanceState = (inst: any): string => {
      return inst.instance?.state || 
             inst.state || 
             inst.instance?.connectionStatus || 
             inst.connectionStatus ||
             inst.status ||
             'unknown';
    };

    // Encontrar instância conectada
    let instanceName: string | null = null;
    
    for (const inst of instances) {
      const name = getInstanceName(inst);
      const state = getInstanceState(inst);
      console.log(`  -> Instância: ${name}, estado: ${state}`);
      
      if (state === 'open' || state === 'connected') {
        instanceName = name;
        break;
      }
    }
    
    // Se nenhuma open, usar a primeira com nome válido
    if (!instanceName && instances.length > 0) {
      for (const inst of instances) {
        const name = getInstanceName(inst);
        if (name) {
          instanceName = name;
          break;
        }
      }
    }

    if (!instanceName) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível identificar o nome da instância', rawInstances: instances }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📱 Usando instância: ${instanceName}`);

    // Buscar foto de perfil
    const remoteJid = contact.phone.includes('@') 
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

    const pictureUrl = profileData.profilePictureUrl || profileData.picture || profileData.imgUrl || profileData.url;

    if (!pictureUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Foto não disponível na API',
          contact: { id: contact.id, name: contact.name },
          apiResponse: profileData
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
