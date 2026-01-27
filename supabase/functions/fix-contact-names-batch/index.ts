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

  console.log('🔧 FIX CONTACT NAMES BATCH - Corrigindo nomes de contatos problemáticos');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    // Buscar contatos individuais com nome "Via Infra" e telefone válido
    const { data: viaInfraContacts } = await supabase
      .from('contacts')
      .select('id, name, phone, metadata')
      .eq('company_id', 'da17735c-5a76-4797-b338-f6e63a7b3f8b')
      .eq('name', 'Via Infra')
      .not('phone', 'is', null);

    console.log(`📋 Contatos "Via Infra" com telefone: ${viaInfraContacts?.length || 0}`);

    const results: any[] = [];
    let updated = 0;

    for (const contact of viaInfraContacts || []) {
      const phone = contact.phone;
      const jid = contact.metadata?.remoteJid;
      
      // Pular broadcasts e JIDs estranhos
      if (jid?.includes('@broadcast') || !jid?.includes('@s.whatsapp.net')) {
        results.push({ id: contact.id, phone, status: 'skip', reason: 'invalid jid type' });
        continue;
      }

      console.log(`\n🔍 Buscando perfil para: ${phone}`);

      try {
        const profileResponse = await fetch(
          `${evolutionUrl}/chat/fetchProfile/VIAINFRAOFICIAL`,
          {
            method: 'POST',
            headers: { 
              'apikey': evolutionKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number: phone }),
            signal: AbortSignal.timeout(8000)
          }
        );

        if (!profileResponse.ok) {
          results.push({ id: contact.id, phone, status: 'api_error', code: profileResponse.status });
          continue;
        }

        const profileData = await profileResponse.json();
        console.log(`📥 Profile data:`, JSON.stringify(profileData));
        
        const realName = profileData?.name || profileData?.pushName || profileData?.profileName;

        if (realName && realName !== phone && !/^\d+$/.test(realName)) {
          console.log(`✅ Nome encontrado: ${realName}`);

          const { error: updateError } = await supabase
            .from('contacts')
            .update({ name: realName, updated_at: new Date().toISOString() })
            .eq('id', contact.id);

          if (!updateError) {
            updated++;
            results.push({ id: contact.id, phone, oldName: 'Via Infra', newName: realName, status: 'updated' });
          } else {
            results.push({ id: contact.id, phone, status: 'update_error', error: updateError.message });
          }
        } else {
          // Sem nome no perfil - tentar buscar do histórico de mensagens (pushName)
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('metadata')
            .eq('conversation_id', (await supabase
              .from('conversations')
              .select('id')
              .eq('contact_id', contact.id)
              .limit(1)
              .maybeSingle()).data?.id)
            .eq('sender_type', 'user')
            .not('metadata->pushName', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          const pushName = lastMessage?.metadata?.pushName;
          if (pushName && pushName !== phone && !/^\d+$/.test(pushName)) {
            console.log(`✅ Nome do pushName: ${pushName}`);
            
            await supabase
              .from('contacts')
              .update({ name: pushName, updated_at: new Date().toISOString() })
              .eq('id', contact.id);
            
            updated++;
            results.push({ id: contact.id, phone, oldName: 'Via Infra', newName: pushName, status: 'updated_from_pushname' });
          } else {
            results.push({ id: contact.id, phone, status: 'no_name_found', profileData });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err: any) {
        console.error(`❌ Erro:`, err.message);
        results.push({ id: contact.id, phone, status: 'error', reason: err.message });
      }
    }

    console.log(`\n✅ CONCLUÍDO: ${updated} atualizados`);

    return new Response(JSON.stringify({
      success: true,
      totalProcessed: viaInfraContacts?.length || 0,
      updated,
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
