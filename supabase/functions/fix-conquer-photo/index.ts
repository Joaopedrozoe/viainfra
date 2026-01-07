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
    const body = await req.json().catch(() => ({}));
    const { imageBase64 } = body;
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const contactIds = [
      '858abf1b-7b73-437e-81bc-45e55f93f982',
      '77b0fa53-e4f7-48d8-b0d7-636310e90c60'
    ];

    // Decodificar base64
    console.log(`📥 Decodificando imagem base64...`);
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const blob = decode(base64Data);
    
    console.log(`✅ Imagem decodificada: ${blob.length} bytes`);

    // Upload para storage
    const fileName = 'conquer-group.png';
    
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload falhou: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    const newAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
    console.log(`✅ Imagem uploaded: ${newAvatarUrl}`);

    // Atualizar ambos os contatos
    const results = [];
    for (const contactId of contactIds) {
      const { data, error } = await supabase
        .from('contacts')
        .update({ 
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .select('id, name, avatar_url')
        .single();

      if (error) {
        results.push({ contactId, error: error.message });
      } else {
        results.push({ contactId, success: true, name: data.name, avatarUrl: data.avatar_url });
      }
    }

    return new Response(
      JSON.stringify({ success: true, avatarUrl: newAvatarUrl, results }),
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
