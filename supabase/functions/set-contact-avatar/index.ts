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
    const { contactId, avatarUrl, imageBase64 } = await req.json();
    
    if (!contactId || (!avatarUrl && !imageBase64)) {
      return new Response(
        JSON.stringify({ error: 'contactId e (avatarUrl ou imageBase64) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let finalAvatarUrl = avatarUrl;

    // Se temos base64, fazer upload para storage
    if (imageBase64) {
      console.log(`📥 Processando imagem base64 para contato ${contactId}`);
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const blob = decode(base64Data);
      
      const fileName = `${contactId}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload falhou: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      finalAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      console.log(`✅ Upload concluído: ${finalAvatarUrl}`);
    }

    // Atualizar contato diretamente
    const { data, error } = await supabase
      .from('contacts')
      .update({ 
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .select('id, name, avatar_url')
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar: ${error.message}`);
    }

    console.log(`✅ Avatar atualizado para ${data.name}: ${finalAvatarUrl}`);

    return new Response(
      JSON.stringify({ success: true, contact: data }),
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
