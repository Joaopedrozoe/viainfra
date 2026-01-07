import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Imagem do Conquer em base64 (logo verde/preto)
const CONQUER_LOGO_BASE64 = "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";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const contactIds = [
      '858abf1b-7b73-437e-81bc-45e55f93f982',
      '77b0fa53-e4f7-48d8-b0d7-636310e90c60'
    ];

    const results = [];
    const blob = decode(CONQUER_LOGO_BASE64);
    
    // Upload para storage uma vez
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
