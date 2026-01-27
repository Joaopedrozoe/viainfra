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

  console.log('🔧 FIX GROUP NAMES - Corrigindo nomes de grupos "Via Infra"');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    // Buscar grupos com nome "Via Infra"
    const { data: wrongNameGroups, error } = await supabase
      .from('contacts')
      .select('id, name, metadata')
      .eq('company_id', 'da17735c-5a76-4797-b338-f6e63a7b3f8b')
      .eq('name', 'Via Infra')
      .contains('metadata', { isGroup: true });

    if (error) {
      throw new Error(`Erro ao buscar grupos: ${error.message}`);
    }

    console.log(`📋 Encontrados ${wrongNameGroups?.length || 0} grupos com nome "Via Infra"`);

    const results: any[] = [];

    for (const group of wrongNameGroups || []) {
      const remoteJid = group.metadata?.remoteJid;
      if (!remoteJid) {
        results.push({ id: group.id, status: 'skip', reason: 'no remoteJid' });
        continue;
      }

      console.log(`\n🔍 Buscando nome real para: ${remoteJid}`);

      try {
        // Buscar nome do grupo via API Evolution
        const groupInfoResponse = await fetch(
          `${evolutionUrl}/group/findGroupInfos/VIAINFRAOFICIAL?groupJid=${remoteJid}`,
          { 
            headers: { 'apikey': evolutionKey },
            signal: AbortSignal.timeout(10000)
          }
        );

        if (!groupInfoResponse.ok) {
          console.log(`❌ API retornou ${groupInfoResponse.status}`);
          results.push({ id: group.id, remoteJid, status: 'error', reason: `API ${groupInfoResponse.status}` });
          continue;
        }

        const groupInfo = await groupInfoResponse.json();
        const realName = groupInfo?.subject;

        if (!realName) {
          console.log(`⚠️ Sem subject na resposta`);
          results.push({ id: group.id, remoteJid, status: 'skip', reason: 'no subject in API response' });
          continue;
        }

        console.log(`✅ Nome real encontrado: ${realName}`);

        // Atualizar o nome no banco
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ 
            name: realName, 
            metadata: { ...group.metadata, subject: realName },
            updated_at: new Date().toISOString() 
          })
          .eq('id', group.id);

        if (updateError) {
          results.push({ id: group.id, remoteJid, status: 'error', reason: updateError.message });
        } else {
          results.push({ id: group.id, remoteJid, oldName: 'Via Infra', newName: realName, status: 'updated' });
        }

      } catch (err: any) {
        console.error(`❌ Erro ao processar ${remoteJid}:`, err.message);
        results.push({ id: group.id, remoteJid, status: 'error', reason: err.message });
      }
    }

    const updated = results.filter(r => r.status === 'updated').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log(`\n✅ CONCLUÍDO: ${updated} atualizados, ${errors} erros`);

    return new Response(JSON.stringify({
      success: true,
      totalProcessed: wrongNameGroups?.length || 0,
      updated,
      errors,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
