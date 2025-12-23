import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * FULL WHATSAPP SYNC - Garante paridade 100% entre WhatsApp Web e CRM
 * 
 * Este endpoint:
 * 1. Busca TODOS os chats do WhatsApp via Evolution API
 * 2. Compara com o banco de dados
 * 3. Cria conversas faltantes
 * 4. Atualiza mensagens desatualizadas
 * 5. Corrige timestamps para ordenação correta
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🔄 FULL WHATSAPP SYNC - Iniciando paridade 100%');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const { instanceName = 'VIAINFRAOFICIAL', dryRun = false, importMessages = true } = await req.json().catch(() => ({}));

    // Get instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .single();

    if (!instance) {
      return new Response(JSON.stringify({ error: 'Instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const companyId = instance.company_id;
    console.log(`📱 Instância: ${instanceName} | Empresa: ${companyId}`);

    const stats = {
      apiChats: 0,
      existingConversations: 0,
      missingChats: 0,
      created: 0,
      messagesImported: 0,
      timestampsUpdated: 0,
      errors: [] as string[]
    };

    // ============================================================
    // PASSO 1: Buscar TODOS os chats do WhatsApp
    // ============================================================
    console.log('\n📥 PASSO 1: Buscando todos os chats do WhatsApp...');
    
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error(`API error: ${chatsResponse.status}`);
    }

    const allChats = await chatsResponse.json();
    stats.apiChats = allChats.length;
    console.log(`📊 WhatsApp tem ${allChats.length} chats`);

    // Debug: log estrutura do primeiro chat para entender o formato
    if (allChats.length > 0) {
      console.log('\n🔍 Estrutura do primeiro chat:', JSON.stringify(allChats[0], null, 2));
    }

    // Ordenar por atividade recente
    allChats.sort((a: any, b: any) => {
      const tsA = a.lastMsgTimestamp || 0;
      const tsB = b.lastMsgTimestamp || 0;
      return tsB - tsA;
    });

    // Log top 20 para debug
    console.log('\n📋 Top 20 chats do WhatsApp (por atividade):');
    for (let i = 0; i < Math.min(20, allChats.length); i++) {
      const chat = allChats[i];
      // IMPORTANTE: remoteJid é o campo correto, não id (que é ID interno da Evolution)
      const remoteJid = chat.remoteJid || chat.jid;
      const name = chat.name || chat.pushName || chat.notify || remoteJid;
      const ts = chat.lastMsgTimestamp;
      const date = ts ? new Date(ts * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A';
      console.log(`  ${i+1}. ${name} | ${remoteJid} | ${date}`);
    }

    // ============================================================
    // PASSO 2: Buscar conversas existentes no banco
    // ============================================================
    console.log('\n📥 PASSO 2: Verificando conversas existentes no CRM...');
    
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id, updated_at, contacts(name, phone)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    stats.existingConversations = existingConvs?.length || 0;
    console.log(`📊 CRM tem ${stats.existingConversations} conversas`);

    // Build map por remoteJid e por telefone
    const existingByJid = new Map<string, any>();
    const existingByPhone = new Map<string, any>();
    
    for (const conv of existingConvs || []) {
      const jid = conv.metadata?.remoteJid;
      if (jid) {
        existingByJid.set(jid, conv);
        const phone = jid.split('@')[0];
        if (/^\d+$/.test(phone)) {
          existingByPhone.set(phone, conv);
        }
      }
    }

    // ============================================================
    // PASSO 3: Identificar e criar conversas faltantes
    // ============================================================
    console.log('\n📥 PASSO 3: Identificando e criando conversas faltantes...');
    
    const missingChats: any[] = [];
    
    for (const chat of allChats) {
      // IMPORTANTE: Usar remoteJid (não id que é interno da Evolution)
      const remoteJid = chat.remoteJid || chat.jid;
      if (!remoteJid || remoteJid === 'status@broadcast') continue;

      const isGroup = remoteJid.includes('@g.us');
      const isLid = remoteJid.includes('@lid');
      const phone = (isLid || isGroup) ? null : remoteJid.split('@')[0];
      const name = chat.name || chat.pushName || chat.notify || phone || remoteJid;
      
      // Verificar se existe
      let exists = existingByJid.has(remoteJid);
      if (!exists && phone) {
        exists = existingByPhone.has(phone);
      }
      
      if (!exists) {
        missingChats.push({
          remoteJid,
          name,
          phone,
          isGroup,
          isLid,
          lastMsgTimestamp: chat.lastMsgTimestamp
        });
      }
    }

    stats.missingChats = missingChats.length;
    console.log(`❌ Encontradas ${missingChats.length} conversas FALTANTES no CRM`);

    if (missingChats.length > 0) {
      console.log('\n📝 Conversas faltantes:');
      for (const chat of missingChats.slice(0, 30)) {
        const ts = chat.lastMsgTimestamp;
        const date = ts ? new Date(ts * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A';
        console.log(`  - ${chat.name} (${chat.remoteJid}) | Última msg: ${date} | ${chat.isLid ? '[LID]' : ''} ${chat.isGroup ? '[GRUPO]' : ''}`);
      }
    }

    // Criar conversas faltantes
    if (!dryRun && missingChats.length > 0) {
      console.log('\n🔨 Criando conversas faltantes...');
      
      for (const chat of missingChats) {
        try {
          // Validar telefone
          let validPhone = chat.phone;
          if (validPhone && !/^\d{10,15}$/.test(validPhone)) {
            validPhone = null;
          }

          // Criar contato
          const { data: contact, error: contactErr } = await supabase
            .from('contacts')
            .insert({
              name: chat.name,
              phone: validPhone,
              company_id: companyId,
              metadata: {
                remoteJid: chat.remoteJid,
                isGroup: chat.isGroup,
                isLid: chat.isLid,
                fullSyncCreated: true,
                createdAt: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (contactErr) {
            console.log(`  ⚠️ Erro ao criar contato ${chat.name}: ${contactErr.message}`);
            stats.errors.push(`Contact: ${chat.name} - ${contactErr.message}`);
            continue;
          }

          // Criar conversa
          const { data: conv, error: convErr } = await supabase
            .from('conversations')
            .insert({
              contact_id: contact.id,
              company_id: companyId,
              channel: 'whatsapp',
              status: 'open',
              bot_active: false,
              metadata: {
                remoteJid: chat.remoteJid,
                instanceName,
                isGroup: chat.isGroup,
                isLid: chat.isLid,
                fullSyncCreated: true,
                createdAt: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (convErr) {
            console.log(`  ⚠️ Erro ao criar conversa ${chat.name}: ${convErr.message}`);
            stats.errors.push(`Conversation: ${chat.name} - ${convErr.message}`);
            continue;
          }

          console.log(`  ✅ Criado: ${chat.name} (${conv.id})`);
          stats.created++;

          // Adicionar ao mapa para importar mensagens
          existingByJid.set(chat.remoteJid, { id: conv.id, contact_id: contact.id });

        } catch (err: any) {
          console.log(`  ❌ Erro: ${chat.name} - ${err.message}`);
          stats.errors.push(`${chat.name}: ${err.message}`);
        }
      }
    }

    // ============================================================
    // PASSO 4: Importar mensagens recentes para todas as conversas
    // ============================================================
    if (importMessages && !dryRun) {
      console.log('\n📥 PASSO 4: Importando mensagens recentes...');
      
      // Processar top 50 chats mais recentes
      const chatsToSync = allChats.slice(0, 50);
      
      for (const chat of chatsToSync) {
        const remoteJid = chat.id || chat.remoteJid || chat.jid;
        if (!remoteJid || remoteJid === 'status@broadcast') continue;

        const existingConv = existingByJid.get(remoteJid);
        if (!existingConv) continue;

        const msgCount = await importRecentMessages(
          supabase, evolutionApiUrl, evolutionApiKey,
          existingConv.id, remoteJid, instanceName
        );

        if (msgCount > 0) {
          console.log(`  📨 ${chat.name || remoteJid}: ${msgCount} novas mensagens`);
          stats.messagesImported += msgCount;
        }
      }
    }

    // ============================================================
    // PASSO 5: Atualizar timestamps de todas as conversas
    // ============================================================
    console.log('\n📥 PASSO 5: Atualizando timestamps para ordenação correta...');
    
    const { data: allConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    for (const conv of allConvs || []) {
      const { data: latestMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestMsg) {
        const { error: updateErr } = await supabase
          .from('conversations')
          .update({ updated_at: latestMsg.created_at })
          .eq('id', conv.id);

        if (!updateErr) stats.timestampsUpdated++;
      }
    }

    console.log(`✅ Atualizados ${stats.timestampsUpdated} timestamps`);

    // ============================================================
    // RESULTADO FINAL
    // ============================================================
    const duration = Date.now() - startTime;
    console.log(`\n✅ FULL SYNC COMPLETE em ${duration}ms`);
    console.log(`📊 Resumo:`);
    console.log(`  - Chats no WhatsApp: ${stats.apiChats}`);
    console.log(`  - Conversas existentes: ${stats.existingConversations}`);
    console.log(`  - Faltantes identificadas: ${stats.missingChats}`);
    console.log(`  - Novas criadas: ${stats.created}`);
    console.log(`  - Mensagens importadas: ${stats.messagesImported}`);
    console.log(`  - Timestamps atualizados: ${stats.timestampsUpdated}`);
    console.log(`  - Erros: ${stats.errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      stats,
      duration,
      dryRun,
      message: dryRun ? 'Dry run - nenhuma alteração feita' : 'Sincronização completa executada'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro fatal:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Importa mensagens recentes para uma conversa
 */
async function importRecentMessages(
  supabase: any,
  evolutionApiUrl: string,
  evolutionApiKey: string,
  conversationId: string,
  remoteJid: string,
  instanceName: string
): Promise<number> {
  try {
    // Buscar mensagens da API
    const resp = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({
        where: { key: { remoteJid } },
        limit: 50
      })
    });

    if (!resp.ok) return 0;

    const data = await resp.json();
    let messageList: any[] = [];
    
    if (Array.isArray(data)) messageList = data;
    else if (data.messages?.records) messageList = data.messages.records;
    else if (data.messages) messageList = data.messages;
    else if (data.records) messageList = data.records;

    if (messageList.length === 0) return 0;

    // Buscar mensagens existentes
    const { data: existingMsgs } = await supabase
      .from('messages')
      .select('metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(100);

    const existingIds = new Set<string>();
    for (const msg of existingMsgs || []) {
      const extId = msg.metadata?.external_id || msg.metadata?.message_id || msg.metadata?.messageId;
      if (extId) existingIds.add(extId);
    }

    // Filtrar novas mensagens
    const newMessages = [];
    
    for (const apiMsg of messageList) {
      const key = apiMsg.key || {};
      const messageId = key.id || apiMsg.id || apiMsg.messageId;
      
      if (messageId && existingIds.has(messageId)) continue;

      const content = extractContent(apiMsg);
      if (!content) continue;

      const ts = Number(apiMsg.messageTimestamp || 0);
      const timestampMs = ts > 1e12 ? ts : ts * 1000;
      const timestamp = ts > 0 ? new Date(timestampMs).toISOString() : new Date().toISOString();

      newMessages.push({
        conversation_id: conversationId,
        sender_type: key.fromMe ? 'agent' : 'user',
        content,
        created_at: timestamp,
        metadata: {
          external_id: messageId,
          message_id: messageId,
          remoteJid,
          fromMe: key.fromMe || false,
          instanceName,
          fullSyncImported: true
        }
      });

      if (messageId) existingIds.add(messageId);
    }

    if (newMessages.length > 0) {
      const { error } = await supabase.from('messages').insert(newMessages);
      if (error) {
        console.log(`  ⚠️ Erro inserindo mensagens: ${error.message}`);
        return 0;
      }
      return newMessages.length;
    }

    return 0;
  } catch (err: any) {
    console.log(`  ⚠️ Erro sync ${remoteJid}: ${err.message}`);
    return 0;
  }
}

function extractContent(msg: any): string {
  const message = msg.message || msg;
  
  if (typeof message === 'string') return message;
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  
  if (message.imageMessage) {
    return message.imageMessage.caption || '[Imagem]';
  }
  if (message.videoMessage) {
    return message.videoMessage.caption || '[Vídeo]';
  }
  if (message.audioMessage) {
    const seconds = message.audioMessage.seconds || 0;
    if (seconds > 0) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `[Áudio ${mins}:${secs.toString().padStart(2, '0')}]`;
    }
    return '[Áudio]';
  }
  if (message.documentMessage) {
    return `[Documento: ${message.documentMessage.fileName || message.documentMessage.title || 'arquivo'}]`;
  }
  if (message.stickerMessage) return '[Sticker]';
  if (message.contactMessage) return '[Contato]';
  if (message.locationMessage) return '[Localização]';
  if (message.reactionMessage) return '[Reação]';
  
  return '';
}
