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
    const { contactId, imageUrl } = await req.json();
    
    if (!contactId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'contactId e imageUrl são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar se contato existe
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📥 Baixando imagem para ${contact.name}: ${imageUrl}`);

    // Baixar imagem
    const imageResp = await fetch(imageUrl, {
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

    const fileName = `${contactId}.${extension}`;

    // Upload para storage
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, blob, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload falhou: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    const newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    // Atualizar contato
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ 
        avatar_url: newAvatarUrl,
        metadata: { manualPhoto: true, photoUpdatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId);

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
