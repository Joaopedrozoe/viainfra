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
    const { contactId, avatarUrl } = await req.json();
    
    if (!contactId || !avatarUrl) {
      return new Response(
        JSON.stringify({ error: 'contactId e avatarUrl são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Atualizar contato diretamente
    const { data, error } = await supabase
      .from('contacts')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .select('id, name, avatar_url')
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar: ${error.message}`);
    }

    console.log(`✅ Avatar atualizado para ${data.name}: ${avatarUrl}`);

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
