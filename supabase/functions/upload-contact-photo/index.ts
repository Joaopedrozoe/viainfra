import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactId, imageUrl, imageBase64, contentType: providedContentType } = await req.json();
    
    if (!contactId || (!imageUrl && !imageBase64)) {
      return new Response(
        JSON.stringify({ error: 'contactId e (imageUrl ou imageBase64) são obrigatórios' }),
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

    let blob: Uint8Array;
    let contentType = providedContentType || 'image/png';

    if (imageBase64) {
      // Decodificar base64
      console.log(`📥 Processando imagem base64 para ${contact.name}`);
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      blob = decode(base64Data);
    } else {
      // Baixar imagem de URL
      console.log(`📥 Baixando imagem para ${contact.name}: ${imageUrl}`);
      
      const imageResp = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (!imageResp.ok) {
        throw new Error(`Falha ao baixar imagem: ${imageResp.status}`);
      }

      contentType = imageResp.headers.get('content-type') || 'image/jpeg';
      const imageBuffer = await imageResp.arrayBuffer();
      blob = new Uint8Array(imageBuffer);
    }

    let extension = 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
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
