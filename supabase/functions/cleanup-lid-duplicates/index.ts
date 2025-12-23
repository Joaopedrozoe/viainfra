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

    // DELETE ALL empty conversations (no messages) - they pollute the inbox
    console.log('\n🔍 Buscando TODAS as conversas vazias para deletar...');
    
    const { data: allConvs } = await supabase
      .from('conversations')
      .select(`
        id, 
        contact_id,
        metadata,
        contacts(id, name, metadata)
      `)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    let emptyCount = 0;
    let deletedCount = 0;
    const emptyConvIds: string[] = [];
    const orphanContactIds: string[] = [];

    for (const conv of allConvs || []) {
      // Check if has messages
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);

      if (count === 0) {
        emptyCount++;
        const contactName = (conv.contacts as any)?.name || conv.metadata?.remoteJid || 'Unknown';
        console.log(`  📭 Conversa vazia: ${contactName}`);
        emptyConvIds.push(conv.id);
        if (conv.contact_id) {
          orphanContactIds.push(conv.contact_id);
        }
      }
    }

    console.log(`\n📊 ${emptyCount} conversas vazias encontradas`);

    if (!dryRun && emptyConvIds.length > 0) {
      console.log('\n🗑️ Deletando conversas vazias...');
      
      // Delete conversations in batches
      for (const convId of emptyConvIds) {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', convId);
        
        if (!error) {
          deletedCount++;
        } else {
          console.log(`  ⚠️ Erro deletando conversa: ${error.message}`);
        }
      }
      
      console.log(`  ✅ ${deletedCount} conversas vazias deletadas`);
      
      // Also clean up orphaned contacts (contacts with no conversations)
      console.log('\n🧹 Limpando contatos órfãos...');
      let orphansDeleted = 0;
      
      for (const contactId of orphanContactIds) {
        // Check if contact has other conversations
        const { count: convCount } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('contact_id', contactId);
        
        if (convCount === 0) {
          const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactId);
          
          if (!error) orphansDeleted++;
        }
      }
      
      console.log(`  ✅ ${orphansDeleted} contatos órfãos removidos`);
      stats.contactsDeleted += orphansDeleted;
    }
    
    stats.conversationsDeleted += deletedCount;

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
