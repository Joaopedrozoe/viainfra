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

    const { dryRun = false, companyId } = await req.json().catch(() => ({}));
    
    console.log(`🧹 Limpando contatos @lid duplicados... (dryRun: ${dryRun})`);
    
    const stats = {
      lidContactsFound: 0,
      duplicatesRemoved: 0,
      conversationsDeleted: 0,
      messagesDeleted: 0,
      contactsWithPhoneFound: 0
    };

    // 1. Buscar todos os contatos @lid (nome contém @lid ou metadata.isLid = true)
    let query = supabase
      .from('contacts')
      .select('id, name, phone, metadata, company_id');
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data: allContacts, error: contactsErr } = await query;
    
    if (contactsErr) {
      throw new Error(`Erro ao buscar contatos: ${contactsErr.message}`);
    }

    // Filtrar contatos @lid problemáticos
    const lidContacts = (allContacts || []).filter(c => {
      const isLidName = c.name?.includes('@lid') || 
                        /^\d{15,25}@lid$/.test(c.name) ||
                        /^\d{15,25}$/.test(c.name);
      const isLidMetadata = c.metadata?.isLid === true || c.metadata?.isLidContact === true;
      return (isLidName || isLidMetadata) && !c.phone;
    });

    stats.lidContactsFound = lidContacts.length;
    console.log(`📊 Encontrados ${lidContacts.length} contatos @lid problemáticos`);

    // Para cada contato @lid, verificar se existe contato com telefone para o mesmo nome
    for (const lidContact of lidContacts) {
      const lidId = lidContact.metadata?.lidId || 
                    lidContact.metadata?.remoteJid?.replace('@lid', '') ||
                    lidContact.name?.replace('@lid', '');
      
      console.log(`🔍 Processando LID: ${lidId} (${lidContact.name})`);

      // Buscar mapeamento LID -> telefone
      const { data: mapping } = await supabase
        .from('lid_phone_mapping')
        .select('phone, contact_id')
        .eq('lid', lidId)
        .eq('company_id', lidContact.company_id)
        .maybeSingle();

      let targetContactId = mapping?.contact_id;

      // Se não tem mapeamento, tentar encontrar contato por conversa recente
      if (!targetContactId) {
        // Buscar conversa do @lid para mover mensagens
        const { data: lidConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('contact_id', lidContact.id)
          .limit(1)
          .maybeSingle();

        if (lidConv) {
          // Buscar última mensagem para encontrar pista do contato real
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('metadata')
            .eq('conversation_id', lidConv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Se a mensagem tem remoteJid com telefone, usar para encontrar contato
          const msgRemoteJid = lastMsg?.metadata?.remoteJid;
          if (msgRemoteJid && msgRemoteJid.includes('@s.whatsapp.net')) {
            const phone = msgRemoteJid.replace('@s.whatsapp.net', '');
            const { data: contactByPhone } = await supabase
              .from('contacts')
              .select('id')
              .eq('phone', phone)
              .eq('company_id', lidContact.company_id)
              .maybeSingle();
            
            if (contactByPhone) {
              targetContactId = contactByPhone.id;
              stats.contactsWithPhoneFound++;
              console.log(`✅ Encontrado contato com telefone: ${phone}`);
            }
          }
        }
      }

      if (targetContactId && targetContactId !== lidContact.id) {
        console.log(`🔗 LID ${lidId} tem contato real: ${targetContactId}`);

        // Buscar conversa do contato real
        const { data: realConv } = await supabase
          .from('conversations')
          .select('id, metadata')
          .eq('contact_id', targetContactId)
          .eq('channel', 'whatsapp')
          .limit(1)
          .maybeSingle();

        // Buscar conversa do @lid
        const { data: lidConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('contact_id', lidContact.id)
          .limit(1)
          .maybeSingle();

        if (lidConv) {
          if (!dryRun) {
            if (realConv) {
              // Mover mensagens do @lid para conversa real
              const { count: movedCount } = await supabase
                .from('messages')
                .update({ conversation_id: realConv.id })
                .eq('conversation_id', lidConv.id)
                .select('id', { count: 'exact' });
              
              console.log(`📝 Movidas ${movedCount || 0} mensagens para conversa real`);
              
              // Atualizar metadata da conversa real com lidJid
              const lidRemoteJid = lidContact.metadata?.remoteJid;
              if (lidRemoteJid) {
                await supabase
                  .from('conversations')
                  .update({ 
                    metadata: { ...realConv.metadata, lidJid: lidRemoteJid },
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', realConv.id);
              }
            }

            // Deletar mensagens restantes da conversa @lid
            await supabase
              .from('messages')
              .delete()
              .eq('conversation_id', lidConv.id);

            // Deletar conversa @lid
            await supabase
              .from('conversations')
              .delete()
              .eq('id', lidConv.id);
            
            stats.conversationsDeleted++;
          } else {
            console.log(`[DRY RUN] Deletaria conversa: ${lidConv.id}`);
          }
        }

        // Deletar contato @lid
        if (!dryRun) {
          await supabase
            .from('contacts')
            .delete()
            .eq('id', lidContact.id);
          
          stats.duplicatesRemoved++;
          console.log(`🗑️ Contato @lid deletado: ${lidContact.id}`);
        } else {
          console.log(`[DRY RUN] Deletaria contato: ${lidContact.id} (${lidContact.name})`);
          stats.duplicatesRemoved++;
        }
      } else {
        // Sem contato real - deletar @lid órfão para limpar inbox
        console.log(`⚠️ LID ${lidId} sem contato real - verificando se deve deletar...`);
        
        // Buscar conversa do @lid
        const { data: lidConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('contact_id', lidContact.id)
          .limit(1)
          .maybeSingle();

        if (lidConv) {
          // Verificar se tem mensagens importantes
          const { count: msgCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', lidConv.id);

          if ((msgCount || 0) <= 2) {
            // Poucas mensagens - pode deletar
            if (!dryRun) {
              await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', lidConv.id);
              
              await supabase
                .from('conversations')
                .delete()
                .eq('id', lidConv.id);
              
              await supabase
                .from('contacts')
                .delete()
                .eq('id', lidContact.id);
              
              stats.conversationsDeleted++;
              stats.duplicatesRemoved++;
              console.log(`🗑️ LID órfão deletado: ${lidContact.name}`);
            } else {
              console.log(`[DRY RUN] Deletaria LID órfão: ${lidContact.name}`);
              stats.duplicatesRemoved++;
            }
          } else {
            console.log(`📌 LID ${lidId} mantido - tem ${msgCount} mensagens`);
          }
        }
      }
    }

    console.log(`✅ Limpeza concluída:`, stats);

    return new Response(JSON.stringify({ 
      success: true, 
      dryRun,
      stats 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
