import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_INSTANCES = ['TESTE2', 'VIAINFRAOFICIAL', 'viainfraoficial'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'Instance name is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!ALLOWED_INSTANCES.includes(instanceName) && !ALLOWED_INSTANCES.includes(instanceName.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Instância não autorizada' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API configuration missing' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`\n========================================`);
    console.log(`📥 IMPORTAÇÃO COMPLETA V2: ${instanceName}`);
    console.log(`========================================\n`);

    // Get instance record
    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord?.company_id) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;
    console.log(`📍 Company ID: ${companyId}`);

    // Check connection
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionApiKey }
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({ error: 'Instância não acessível' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const statusData = await statusResponse.json();
    const connectionState = statusData?.instance?.state || statusData?.state;
    
    if (connectionState !== 'open' && connectionState !== 'connected') {
      return new Response(JSON.stringify({ error: `Não conectada: ${connectionState}` }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Stats
    const stats = { contacts: 0, conversations: 0, messages: 0, groups: 0, skipped: 0, updated: 0, synced: 0, namesFixed: 0, recovered: 0 };

    // ==========================================
    // PASSO 1: BUSCAR CONTATOS DA API (para nomes)
    // ==========================================
    console.log(`📥 Buscando contatos para nomes...`);
    const contactsNameMap = new Map<string, string>();
    
    try {
      const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        const contacts = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || []);
        
        for (const contact of contacts) {
          const jid = contact.id || contact.jid || contact.remoteJid;
          const name = contact.pushName || contact.name || contact.notify || contact.verifiedName || contact.shortName;
          
          if (jid && name && !jid.includes('@g.us') && !jid.includes('@lid')) {
            const phoneMatch = jid.match(/^(\d+)@/);
            if (phoneMatch) {
              const phone = phoneMatch[1];
              contactsNameMap.set(phone, name);
              if (phone.startsWith('55') && phone.length >= 12) {
                contactsNameMap.set(phone.slice(2), name);
              } else if (phone.length >= 10) {
                contactsNameMap.set('55' + phone, name);
              }
            }
          }
        }
        console.log(`✅ ${contactsNameMap.size} nomes de contatos mapeados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro buscando contatos: ${e}`);
    }

    // ==========================================
    // PASSO 2: BUSCAR CHATS ATIVOS (findChats)
    // ==========================================
    console.log(`📥 Buscando chats ativos...`);
    let activeChats: any[] = [];
    
    // Tentar múltiplos métodos para obter mais chats
    try {
      // Método 1: findChats padrão
      const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        activeChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || []);
        console.log(`✅ findChats retornou ${activeChats.length} chats`);
      }
    } catch (e) {
      console.log(`⚠️ Erro findChats: ${e}`);
    }

    // Método 2: Tentar com limit/offset maior
    if (activeChats.length < 50) {
      try {
        const chatsResponse2 = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 500 })
        });
        if (chatsResponse2.ok) {
          const chatsData2 = await chatsResponse2.json();
          const chats2 = Array.isArray(chatsData2) ? chatsData2 : (chatsData2?.chats || []);
          if (chats2.length > activeChats.length) {
            activeChats = chats2;
            console.log(`✅ findChats com limit:500 retornou ${activeChats.length} chats`);
          }
        }
      } catch (e) { /* continue */ }
    }

    // ==========================================
    // PASSO 3: BUSCAR GRUPOS (para metadados)
    // ==========================================
    console.log(`📥 Buscando grupos...`);
    const groupsMap = new Map<string, any>();
    try {
      const groupsResponse = await fetch(`${evolutionApiUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
        headers: { 'apikey': evolutionApiKey }
      });
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const allGroups = Array.isArray(groupsData) ? groupsData : [];
        for (const group of allGroups) {
          const jid = group.id || group.jid;
          if (jid) {
            groupsMap.set(jid, group);
          }
        }
        console.log(`✅ ${groupsMap.size} grupos mapeados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro buscando grupos: ${e}`);
    }

    // ==========================================
    // PASSO 4: CORRIGIR NOMES ESPECÍFICOS
    // ==========================================
    console.log(`\n🔧 Corrigindo nomes específicos...`);
    
    // Fix T Informatica -> Anthony Informatica
    const { data: tInfoContact } = await supabase
      .from('contacts')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('phone', '5511950025503')
      .maybeSingle();
    
    if (tInfoContact && tInfoContact.name !== 'Anthony Informatica') {
      await supabase.from('contacts').update({ 
        name: 'Anthony Informatica', 
        updated_at: new Date().toISOString() 
      }).eq('id', tInfoContact.id);
      console.log(`   📝 Corrigido: "T Informatica" -> "Anthony Informatica"`);
      stats.namesFixed++;
    }

    // Corrigir nomes numéricos
    const { data: numericContacts } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('company_id', companyId)
      .not('phone', 'is', null);
    
    if (numericContacts) {
      for (const contact of numericContacts) {
        const isNumericName = /^\d+$/.test(contact.name || '');
        if (isNumericName && contact.phone) {
          const realName = contactsNameMap.get(contact.phone) || 
                          contactsNameMap.get(contact.phone.replace(/^55/, '')) ||
                          (contact.phone.length <= 11 ? contactsNameMap.get('55' + contact.phone) : null);
          
          if (realName && realName !== contact.name) {
            console.log(`   📝 Corrigindo: "${contact.name}" -> "${realName}"`);
            await supabase.from('contacts').update({ 
              name: realName, 
              updated_at: new Date().toISOString() 
            }).eq('id', contact.id);
            stats.namesFixed++;
          }
        }
      }
    }
    console.log(`✅ ${stats.namesFixed} nomes corrigidos`);

    // ==========================================
    // PASSO 5: PROCESSAR CHATS ATIVOS
    // ==========================================
    console.log(`\n📊 Processando ${activeChats.length} chats ativos...\n`);
    const processedPhones = new Set<string>();

    for (let i = 0; i < activeChats.length; i++) {
      const chat = activeChats[i];
      const jid = chat.remoteJid || chat.id || chat.jid;
      
      if (!jid) { stats.skipped++; continue; }
      if (jid.includes('@lid') || jid.includes('@broadcast') || jid.startsWith('status@')) { stats.skipped++; continue; }

      const isGroup = jid.includes('@g.us');
      const groupData = isGroup ? groupsMap.get(jid) : null;
      let chatName = groupData?.subject || chat.name || chat.pushName || chat.notify || chat.verifiedName || '';

      try {
        let phone = '';
        let phoneVariants: string[] = [];
        
        if (!isGroup) {
          const phoneMatch = jid.match(/^(\d+)@/);
          if (!phoneMatch) { stats.skipped++; continue; }
          const rawPhone = phoneMatch[1];
          
          if (rawPhone.startsWith('55') && rawPhone.length >= 12) {
            phoneVariants = [rawPhone, rawPhone.slice(2)];
            phone = rawPhone;
          } else if (rawPhone.length >= 10 && rawPhone.length <= 11) {
            phoneVariants = [rawPhone, '55' + rawPhone];
            phone = '55' + rawPhone;
          } else {
            phoneVariants = [rawPhone];
            phone = rawPhone;
          }
          
          if (phone.length < 10 || phone.length > 15) { stats.skipped++; continue; }
          
          processedPhones.add(phone);
          for (const pv of phoneVariants) processedPhones.add(pv);

          if (!chatName || /^\d+$/.test(chatName)) {
            for (const pv of phoneVariants) {
              const mappedName = contactsNameMap.get(pv);
              if (mappedName) { chatName = mappedName; break; }
            }
          }
        }

        // Criar/atualizar contato
        let contactId: string | null = null;
        const profilePic = chat.profilePictureUrl || chat.imgUrl || null;

        if (isGroup) {
          stats.groups++;
          const groupName = chatName || `Grupo ${jid.slice(-8)}`;

          let { data: existingContact } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('company_id', companyId)
            .eq('metadata->>remoteJid', jid)
            .maybeSingle();

          if (!existingContact) {
            const { data: newContact } = await supabase.from('contacts').insert({
              company_id: companyId,
              name: groupName,
              avatar_url: profilePic,
              metadata: { remoteJid: jid, isGroup: true }
            }).select('id').single();
            contactId = newContact?.id;
            if (contactId) stats.contacts++;
          } else {
            contactId = existingContact.id;
            if (groupName && existingContact.name !== groupName) {
              await supabase.from('contacts').update({ name: groupName, updated_at: new Date().toISOString() }).eq('id', contactId);
              stats.updated++;
            }
          }
        } else {
          let existingContact = null;
          for (const phoneVar of phoneVariants) {
            const { data: found } = await supabase.from('contacts').select('id, name, phone')
              .eq('company_id', companyId).eq('phone', phoneVar).maybeSingle();
            if (found) { existingContact = found; break; }
          }

          if (!existingContact) {
            const contactName = chatName || phone;
            const { data: newContact } = await supabase.from('contacts').insert({
              company_id: companyId, name: contactName, phone: phone,
              avatar_url: profilePic, metadata: { remoteJid: jid }
            }).select('id').single();
            contactId = newContact?.id;
            if (contactId) stats.contacts++;
          } else {
            contactId = existingContact.id;
            const currentName = existingContact.name || '';
            const isNameJustNumbers = /^\d+$/.test(currentName);
            const hasGoodName = chatName && chatName.length >= 2 && !/^\d+$/.test(chatName);
            
            if (hasGoodName && isNameJustNumbers) {
              await supabase.from('contacts').update({ name: chatName, updated_at: new Date().toISOString() }).eq('id', contactId);
              stats.updated++;
            }
          }
        }

        if (!contactId) continue;

        // Criar/encontrar conversa
        let { data: existingConv } = await supabase.from('conversations')
          .select('id').eq('company_id', companyId).eq('contact_id', contactId).eq('channel', 'whatsapp').maybeSingle();

        let convId = existingConv?.id;
        const isNewConversation = !existingConv;

        if (!existingConv) {
          const { data: newConv } = await supabase.from('conversations').insert({
            company_id: companyId, contact_id: contactId, channel: 'whatsapp', status: 'open',
            metadata: isGroup ? { isGroup: true, remoteJid: jid, instanceName } : { remoteJid: jid, instanceName }
          }).select('id').single();
          convId = newConv?.id;
        }

        if (!convId) continue;

        // SEMPRE buscar e importar mensagens (mesmo para conversas existentes)
        // Usar limit maior para pegar histórico completo
        const messages = await fetchMessagesFromApi(evolutionApiUrl, evolutionApiKey, instanceName, jid, 2000);
        
        if (messages.length > 0) {
          const imported = await importMessagesToDb(supabase, convId, messages, jid, true);
          stats.messages += imported;
          if (isNewConversation && imported > 0) stats.conversations++;
          else if (!isNewConversation && imported > 0) {
            stats.synced++;
            console.log(`🔄 ${i+1}/${activeChats.length} ${isGroup ? '👥' : '👤'} ${chatName || phone}: +${imported} msgs (atualizado)`);
          } else {
            console.log(`✅ ${i+1}/${activeChats.length} ${isGroup ? '👥' : '👤'} ${chatName || phone}: ${imported === 0 ? 'já atualizado' : `+${imported} msgs`}`);
          }
        } else if (isNewConversation) {
          await supabase.from('conversations').delete().eq('id', convId);
          stats.skipped++;
        }

      } catch (err) {
        console.error(`❌ Erro processando ${jid}:`, err);
        stats.skipped++;
      }
    }

    // ==========================================
    // PASSO 6: RECUPERAR CONVERSAS FALTANDO
    // (Contatos existentes SEM conversa)
    // ==========================================
    console.log(`\n🔄 RECUPERANDO CONVERSAS FALTANDO...`);
    
    const { data: contactsWithoutConv } = await supabase
      .from('contacts')
      .select('id, name, phone, metadata')
      .eq('company_id', companyId)
      .not('phone', 'is', null);

    if (contactsWithoutConv) {
      for (const contact of contactsWithoutConv) {
        // Skip se já processou este telefone
        if (processedPhones.has(contact.phone)) continue;
        
        // Verificar se tem conversa
        const { count } = await supabase.from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('contact_id', contact.id)
          .eq('channel', 'whatsapp');
        
        if (count && count > 0) continue;

        // Não tem conversa - tentar buscar mensagens diretamente
        const phone = contact.phone;
        const remoteJid = `${phone}@s.whatsapp.net`;
        
        console.log(`   📞 Tentando recuperar: ${contact.name} (${phone})...`);
        
        const messages = await fetchMessagesFromApi(evolutionApiUrl, evolutionApiKey, instanceName, remoteJid, 2000);
        
        if (messages.length > 0) {
          // Criar conversa
          const { data: newConv } = await supabase.from('conversations').insert({
            company_id: companyId, contact_id: contact.id, channel: 'whatsapp', status: 'open',
            metadata: { remoteJid, instanceName }
          }).select('id').single();
          
          if (newConv?.id) {
            const imported = await importMessagesToDb(supabase, newConv.id, messages, remoteJid, true);
            if (imported > 0) {
              stats.recovered++;
              stats.messages += imported;
              console.log(`   ✅ RECUPERADO: ${contact.name} com ${imported} mensagens`);
            } else {
              // Sem mensagens importadas, remover conversa
              await supabase.from('conversations').delete().eq('id', newConv.id);
            }
          }
        } else {
          console.log(`   ⚠️ Sem mensagens para ${contact.name}`);
        }
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // ==========================================
    // PASSO 7: LIMPAR CONVERSAS VAZIAS
    // ==========================================
    console.log(`\n🧹 Limpando conversas vazias...`);
    
    const { data: allConversations } = await supabase.from('conversations')
      .select('id, contact_id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    if (allConversations) {
      for (const conv of allConversations) {
        const { count } = await supabase.from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);
        
        if (!count || count === 0) {
          await supabase.from('conversations').delete().eq('id', conv.id);
          console.log(`   🗑️ Removida conversa vazia`);
        }
      }
    }

    // ==========================================
    // PASSO 8: ATUALIZAR TIMESTAMPS
    // ==========================================
    console.log(`\n⏰ Atualizando timestamps...`);
    
    const { data: convsToUpdate } = await supabase.from('conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    if (convsToUpdate) {
      for (const conv of convsToUpdate) {
        const { data: lastMsg } = await supabase.from('messages')
          .select('created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (lastMsg) {
          await supabase.from('conversations')
            .update({ updated_at: lastMsg.created_at })
            .eq('id', conv.id);
        }
      }
    }

    // ==========================================
    // PASSO 9: SINCRONIZAR FOTOS (forceUpdate)
    // ==========================================
    console.log(`\n📸 Sincronizando fotos de perfil...`);
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-profile-pictures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ companyId, forceUpdate: true })
      });
      console.log(`   ✅ Sync de fotos iniciado (forceUpdate)`);
    } catch (e) {
      console.log(`   ⚠️ Erro sync fotos: ${e}`);
    }

    // Contar resultado final
    const { count: finalConvCount } = await supabase.from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    console.log(`\n========================================`);
    console.log(`✅ IMPORTAÇÃO V2 CONCLUÍDA`);
    console.log(`   Conversas totais: ${finalConvCount}`);
    console.log(`   Contatos novos: ${stats.contacts}`);
    console.log(`   Conversas novas: ${stats.conversations}`);
    console.log(`   Conversas recuperadas: ${stats.recovered}`);
    console.log(`   Sincronizadas: ${stats.synced}`);
    console.log(`   Mensagens: ${stats.messages}`);
    console.log(`   Nomes corrigidos: ${stats.namesFixed}`);
    console.log(`   Grupos: ${stats.groups}`);
    console.log(`   Pulados: ${stats.skipped}`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({
      success: true,
      stats: { ...stats, totalConversations: finalConvCount },
      message: `Importação V2: ${finalConvCount} conversas totais, ${stats.recovered} recuperadas, ${stats.messages} mensagens`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Erro fatal na importação:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno durante importação',
      details: String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

async function fetchMessagesFromApi(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  instanceName: string,
  jid: string,
  limit: number = 1000
): Promise<any[]> {
  // Tentar múltiplos formatos de requisição
  const attempts = [
    { where: { key: { remoteJid: jid } }, limit },
    { where: { remoteJid: jid }, limit },
    { remoteJid: jid, limit }
  ];

  for (const body of attempts) {
    try {
      const response = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) continue;

      const data = await response.json();
      let messages: any[] = [];
      
      if (Array.isArray(data?.messages)) {
        messages = data.messages;
      } else if (Array.isArray(data?.messages?.records)) {
        messages = data.messages.records;
      } else if (Array.isArray(data?.records)) {
        messages = data.records;
      } else if (Array.isArray(data)) {
        messages = data;
      }
      
      if (messages.length > 0) return messages;
    } catch (err) { /* continue */ }
  }
  
  return [];
}

async function importMessagesToDb(
  supabase: any,
  conversationId: string,
  messages: any[],
  jid: string,
  forceSync: boolean = false
): Promise<number> {
  try {
    // Buscar todas mensagens existentes para esta conversa
    const { data: existingMsgs } = await supabase.from('messages')
      .select('id, metadata, created_at')
      .eq('conversation_id', conversationId);
    
    const existingMessageIds = new Set(
      (existingMsgs || []).map((m: any) => m.metadata?.messageId).filter(Boolean)
    );
    
    // Se forceSync, também verificar duplicatas globais por messageId
    const messageIdsToCheck = messages.map(msg => msg.key?.id || msg.id).filter(Boolean);
    
    // Verificar duplicatas globais em batches
    if (messageIdsToCheck.length > 0) {
      for (let i = 0; i < messageIdsToCheck.length; i += 50) {
        const batch = messageIdsToCheck.slice(i, i + 50);
        try {
          const { data: globalExisting } = await supabase
            .from('messages')
            .select('metadata')
            .or(batch.map(id => `metadata->>messageId.eq.${id}`).join(','));
          
          if (globalExisting) {
            for (const msg of globalExisting) {
              if (msg.metadata?.messageId) existingMessageIds.add(msg.metadata.messageId);
            }
          }
        } catch (e) {
          // Fallback: se query falhar, continuar
        }
      }
    }

    let imported = 0;
    const messagesToInsert: any[] = [];

    // Ordenar mensagens por timestamp para inserir na ordem correta
    const sortedMessages = [...messages].sort((a, b) => {
      const tsA = Number(a.messageTimestamp || 0);
      const tsB = Number(b.messageTimestamp || 0);
      return tsA - tsB;
    });

    for (const msg of sortedMessages) {
      const messageId = msg.key?.id || msg.id;
      if (!messageId) continue;
      
      // Pular mensagens já existentes
      if (existingMessageIds.has(messageId)) continue;

      const content = extractContent(msg);
      if (!content) continue;

      const fromMe = msg.key?.fromMe === true;
      const timestamp = msg.messageTimestamp 
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      const attachment = extractAttachment(msg);

      messagesToInsert.push({
        conversation_id: conversationId,
        sender_type: fromMe ? 'agent' : 'user',
        content,
        created_at: timestamp,
        metadata: { 
          messageId, 
          fromMe, 
          remoteJid: jid,
          syncedAt: new Date().toISOString(),
          ...(attachment && { attachment }) 
        }
      });

      existingMessageIds.add(messageId);
      imported++;
    }

    // Inserir mensagens em batches
    if (messagesToInsert.length > 0) {
      for (let i = 0; i < messagesToInsert.length; i += 50) {
        const chunk = messagesToInsert.slice(i, i + 50);
        try {
          const { error: insertError } = await supabase.from('messages').insert(chunk);
          if (insertError && insertError.code !== '23505') {
            console.error(`Erro inserindo batch ${i}:`, insertError);
          }
        } catch (insertErr: any) {
          if (insertErr.code !== '23505') console.error(`Erro inserindo batch:`, insertErr);
        }
      }

      // Atualizar timestamp da conversa com a mensagem mais recente
      const { data: lastMsg } = await supabase.from('messages')
        .select('created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        await supabase.from('conversations')
          .update({ updated_at: lastMsg.created_at })
          .eq('id', conversationId);
      }
    }

    return imported;
  } catch (err) {
    console.error(`Erro importando mensagens:`, err);
    return 0;
  }
}

function extractContent(msg: any): string {
  const m = msg.message || msg;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return `📷 ${m.imageMessage.caption}`;
  if (m.imageMessage) return '📷 Imagem';
  if (m.videoMessage?.caption) return `🎬 ${m.videoMessage.caption}`;
  if (m.videoMessage) return '🎬 Vídeo';
  if (m.audioMessage) return '🎵 Áudio';
  if (m.documentMessage?.fileName) return `📄 ${m.documentMessage.fileName}`;
  if (m.documentMessage) return '📄 Documento';
  if (m.stickerMessage) return '🎨 Sticker';
  if (m.locationMessage) return '📍 Localização';
  if (m.contactMessage) return '👤 Contato';
  return '';
}

function extractAttachment(msg: any): any {
  const m = msg.message || msg;
  if (m.imageMessage) return { type: 'image', mimetype: m.imageMessage.mimetype, caption: m.imageMessage.caption, hasMedia: true };
  if (m.videoMessage) return { type: 'video', mimetype: m.videoMessage.mimetype, caption: m.videoMessage.caption, hasMedia: true };
  if (m.audioMessage) return { type: 'audio', mimetype: m.audioMessage.mimetype, ptt: m.audioMessage.ptt, hasMedia: true };
  if (m.documentMessage) return { type: 'document', mimetype: m.documentMessage.mimetype, fileName: m.documentMessage.fileName, hasMedia: true };
  return null;
}
