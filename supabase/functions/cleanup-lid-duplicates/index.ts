import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Limpa conversas @lid duplicadas quando já existe conversa com telefone real
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🧹 CLEANUP LID DUPLICATES - Removendo @lid duplicados');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dryRun = true, companyId = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' } = await req.json().catch(() => ({}));

    // Encontrar contatos @lid que têm duplicata com telefone (mesmo nome)
    const { data: lidContacts } = await supabase
      .from('contacts')
      .select('id, name, metadata')
      .eq('company_id', companyId)
      .not('metadata->remoteJid', 'is', null);

    const { data: phoneContacts } = await supabase
      .from('contacts')
      .select('id, name, phone, metadata')
      .eq('company_id', companyId)
      .not('phone', 'is', null)
      .neq('phone', '');

    // Build phone contact name lookup
    const phoneContactNames = new Map<string, any>();
    for (const pc of phoneContacts || []) {
      if (pc.phone && /^\d{10,15}$/.test(pc.phone)) {
        const key = pc.name?.toLowerCase().trim();
        if (key) phoneContactNames.set(key, pc);
      }
    }

    // Find @lid contacts that have phone duplicates
    const duplicates: any[] = [];
    for (const lc of lidContacts || []) {
      const jid = lc.metadata?.remoteJid;
      if (!jid || !jid.includes('@lid')) continue;
      
      const key = lc.name?.toLowerCase().trim();
      const phoneMatch = phoneContactNames.get(key);
      
      if (phoneMatch) {
        duplicates.push({
          lidContactId: lc.id,
          lidName: lc.name,
          lidJid: jid,
          phoneContactId: phoneMatch.id,
          phoneName: phoneMatch.name,
          phone: phoneMatch.phone
        });
      }
    }

    console.log(`📊 Encontrados ${duplicates.length} contatos @lid duplicados`);
    
    for (const dup of duplicates) {
      console.log(`  - ${dup.lidName} (@lid: ${dup.lidJid}) -> já existe com telefone: ${dup.phone}`);
    }

    const stats = {
      duplicatesFound: duplicates.length,
      conversationsDeleted: 0,
      contactsDeleted: 0,
      errors: [] as string[]
    };

    if (!dryRun && duplicates.length > 0) {
      console.log('\n🗑️ Removendo duplicatas...');
      
      for (const dup of duplicates) {
        try {
          // Find conversation for the @lid contact
          const { data: lidConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('contact_id', dup.lidContactId)
            .maybeSingle();

          if (lidConv) {
            // Delete messages first
            await supabase
              .from('messages')
              .delete()
              .eq('conversation_id', lidConv.id);

            // Delete conversation
            const { error: convErr } = await supabase
              .from('conversations')
              .delete()
              .eq('id', lidConv.id);

            if (convErr) {
              console.log(`  ⚠️ Erro deletando conversa ${dup.lidName}: ${convErr.message}`);
              stats.errors.push(`Conv: ${dup.lidName} - ${convErr.message}`);
            } else {
              console.log(`  ✅ Conversa deletada: ${dup.lidName}`);
              stats.conversationsDeleted++;
            }
          }

          // Delete the @lid contact
          const { error: contactErr } = await supabase
            .from('contacts')
            .delete()
            .eq('id', dup.lidContactId);

          if (contactErr) {
            console.log(`  ⚠️ Erro deletando contato ${dup.lidName}: ${contactErr.message}`);
            stats.errors.push(`Contact: ${dup.lidName} - ${contactErr.message}`);
          } else {
            console.log(`  ✅ Contato deletado: ${dup.lidName}`);
            stats.contactsDeleted++;
          }

        } catch (err: any) {
          console.log(`  ❌ Erro: ${dup.lidName} - ${err.message}`);
          stats.errors.push(`${dup.lidName}: ${err.message}`);
        }
      }
    }

    // Also delete empty @lid conversations that have no messages and no matching phone contact
    console.log('\n🔍 Buscando conversas @lid vazias sem duplicata...');
    
    const { data: emptyLidConvs } = await supabase
      .from('conversations')
      .select(`
        id, 
        contact_id,
        metadata,
        contacts(id, name, metadata)
      `)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp')
      .gte('created_at', '2025-12-23T16:40:00Z');

    let emptyCount = 0;
    for (const conv of emptyLidConvs || []) {
      const jid = conv.metadata?.remoteJid;
      if (!jid || !jid.includes('@lid')) continue;

      // Check if has messages
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      if (count === 0) {
        emptyCount++;
        console.log(`  📭 Conversa vazia: ${(conv.contacts as any)?.name || jid}`);
        
        if (!dryRun) {
          // Move to far past to push to bottom of list
          await supabase
            .from('conversations')
            .update({ updated_at: '2020-01-01T00:00:00Z' })
            .eq('id', conv.id);
        }
      }
    }

    console.log(`\n📊 ${emptyCount} conversas @lid vazias encontradas`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats,
      emptyLidConversations: emptyCount,
      message: dryRun ? 'Dry run - nenhuma alteração' : 'Limpeza executada'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
