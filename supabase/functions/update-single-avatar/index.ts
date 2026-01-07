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
    console.log(`📱 Instâncias encontradas:`, JSON.stringify(instances.map((i: any) => ({
      name: i.instance?.instanceName || i.instanceName,
      state: i.instance?.state || i.state,
      status: i.instance?.connectionStatus || i.connectionStatus
    }))));
    
    // Verificar múltiplos formatos de estado
    const connectedInstance = instances.find((i: any) => {
      const state = i.instance?.state || i.state;
      const connectionStatus = i.instance?.connectionStatus || i.connectionStatus;
      return state === 'open' || connectionStatus === 'open' || state === 'connected';
    });

    if (!connectedInstance) {
      // Usar a primeira instância disponível se nenhuma estiver "open"
      if (instances.length > 0) {
        console.log('⚠️ Nenhuma instância "open", usando primeira disponível');
      } else {
        return new Response(
          JSON.stringify({ error: 'Nenhuma instância WhatsApp encontrada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const instanceToUse = connectedInstance || instances[0];
    const instanceName = instanceToUse.instance?.instanceName || instanceToUse.instanceName;
    console.log(`📱 Usando instância: ${instanceName}`);

    // Buscar foto de perfil
    const remoteJid = contact.phone.includes('@') 
      ? contact.phone 
      : `${contact.phone}@s.whatsapp.net`;

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

    const pictureUrl = profileData.profilePictureUrl || profileData.picture || profileData.imgUrl;

    if (!pictureUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Contato não tem foto de perfil ou está com privacidade ativada',
          contact: { id: contact.id, name: contact.name }
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
