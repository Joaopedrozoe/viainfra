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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Corrigir contato "2" para "Yago M Sam"
    const { data: updated1, error: err1 } = await supabase
      .from('contacts')
      .update({ name: 'Yago M Sam', updated_at: new Date().toISOString() })
      .eq('id', '8938f4e2-f7c7-415e-9a47-8aa7ecdd77ce')
      .select();

    if (err1) {
      console.error('Erro atualizando contato 2:', err1);
    } else {
      console.log('✅ Contato "2" atualizado para "Yago M Sam"');
    }

    // Buscar contatos com nomes que são apenas números
    const { data: numericNames } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .not('phone', 'is', null);

    let updatedCount = 0;
    if (numericNames) {
      for (const contact of numericNames) {
        const isNameJustNumbers = /^\d+$/.test(contact.name || '');
        if (isNameJustNumbers && contact.phone) {
          // Não temos o nome real, mas pelo menos deixa claro que é o telefone
          console.log(`⚠️ Contato com nome numérico: ${contact.name} (${contact.phone})`);
        }
      }
    }

    // Deletar conversa vazia do Luis Motoboy
    const { data: emptyConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', 'ebe8eeda-4d78-4835-9d29-5f276bcb9993')
      .single();

    if (emptyConv) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', emptyConv.id);

      if (count === 0) {
        await supabase.from('conversations').delete().eq('id', emptyConv.id);
        console.log('🗑️ Conversa vazia do Luis Motoboy removida');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Correções aplicadas'
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
