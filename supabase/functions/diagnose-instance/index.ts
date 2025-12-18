import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatDiagnostic {
  jid: string;
  name: string;
  isGroup: boolean;
  inEvolution: boolean;
  inDatabase: boolean;
  evolutionMessageCount?: number;
  databaseMessageCount?: number;
  lastEvolutionMessage?: string;
  lastDatabaseMessage?: string;
  status: 'ok' | 'missing_in_db' | 'missing_messages' | 'outdated';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceName } = await req.json();
    
    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'instanceName is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`\n🔍 DIAGNÓSTICO DA INSTÂNCIA: ${instanceName}`);
    console.log(`========================================\n`);

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

    // Get instance record
    const { data: instanceRecord } = await supabase
      .from('whatsapp_instances')
      .select('id, company_id, connection_state')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instanceRecord?.company_id) {
      return new Response(JSON.stringify({ error: 'Instância não encontrada no banco' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const companyId = instanceRecord.company_id;
    console.log(`📍 Company ID: ${companyId}`);

    // Check connection status
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionApiKey }
    });

    if (!statusResponse.ok) {
      return new Response(JSON.stringify({ error: 'Instância não acessível na Evolution API' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const statusData = await statusResponse.json();
    const connectionState = statusData?.instance?.state || statusData?.state;
    console.log(`📱 Estado da conexão: ${connectionState}`);

    // ==========================================
    // 1. BUSCAR TODOS OS CHATS DA EVOLUTION API
    // ==========================================
    console.log(`\n📥 Buscando chats da Evolution API...`);
    
    let evolutionChats: any[] = [];
    
    // Tentar múltiplos métodos
    const chatMethods = [
      { body: {}, name: 'default' },
      { body: { limit: 1000 }, name: 'limit:1000' },
      { body: { limit: 500, offset: 0 }, name: 'limit:500' }
    ];

    for (const method of chatMethods) {
      try {
        const response = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(method.body)
        });
        
        if (response.ok) {
          const data = await response.json();
          const chats = Array.isArray(data) ? data : (data?.chats || []);
          if (chats.length > evolutionChats.length) {
            evolutionChats = chats;
            console.log(`✅ Método ${method.name}: ${chats.length} chats`);
          }
        }
      } catch (e) {
        console.log(`⚠️ Erro método ${method.name}: ${e}`);
      }
    }

    console.log(`📊 Total de chats na Evolution API: ${evolutionChats.length}`);

    // ==========================================
    // 2. BUSCAR GRUPOS DA EVOLUTION API
    // ==========================================
    console.log(`\n📥 Buscando grupos...`);
    const groupsMap = new Map<string, any>();
    
    try {
      const response = await fetch(`${evolutionApiUrl}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
        headers: { 'apikey': evolutionApiKey }
      });
      if (response.ok) {
        const groups = await response.json();
        for (const group of (Array.isArray(groups) ? groups : [])) {
          const jid = group.id || group.jid;
          if (jid) groupsMap.set(jid, group);
        }
        console.log(`✅ ${groupsMap.size} grupos encontrados`);
      }
    } catch (e) {
      console.log(`⚠️ Erro buscando grupos: ${e}`);
    }

    // ==========================================
    // 3. BUSCAR CONVERSAS DO BANCO DE DADOS
    // ==========================================
    console.log(`\n📥 Buscando conversas do banco de dados...`);
    
    const { data: dbConversations } = await supabase
      .from('conversations')
      .select(`
        id, 
        contact_id,
        metadata,
        status,
        updated_at,
        contacts!conversations_contact_id_fkey(id, name, phone, metadata)
      `)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    console.log(`📊 Total de conversas no banco: ${dbConversations?.length || 0}`);

    // Build map of DB conversations by remoteJid
    const dbConversationsMap = new Map<string, any>();
    for (const conv of dbConversations || []) {
      const remoteJid = conv.metadata?.remoteJid || conv.contacts?.metadata?.remoteJid;
      if (remoteJid) {
        dbConversationsMap.set(remoteJid, conv);
      }
      // Also map by phone number
      const phone = conv.contacts?.phone;
      if (phone) {
        dbConversationsMap.set(`${phone}@s.whatsapp.net`, conv);
        if (phone.startsWith('55')) {
          dbConversationsMap.set(`${phone.slice(2)}@s.whatsapp.net`, conv);
        }
      }
    }

    // ==========================================
    // 4. COMPARAR E DIAGNOSTICAR
    // ==========================================
    console.log(`\n🔍 Comparando dados...`);
    
    const diagnostics: ChatDiagnostic[] = [];
    const summary = {
      totalEvolution: evolutionChats.length,
      totalDatabase: dbConversations?.length || 0,
      missingInDb: 0,
      missingMessages: 0,
      outdated: 0,
      ok: 0,
      groups: 0,
      contacts: 0
    };

    // Check each Evolution chat
    for (const chat of evolutionChats) {
      const jid = chat.remoteJid || chat.id || chat.jid;
      if (!jid) continue;
      
      // Skip broadcasts and status
      if (jid.includes('@broadcast') || jid.startsWith('status@') || jid.includes('@lid')) continue;

      const isGroup = jid.includes('@g.us');
      const groupData = isGroup ? groupsMap.get(jid) : null;
      const chatName = groupData?.subject || chat.name || chat.pushName || chat.notify || jid.split('@')[0];
      
      if (isGroup) summary.groups++;
      else summary.contacts++;

      // Check if exists in database
      const dbConv = dbConversationsMap.get(jid);
      
      // Get message counts
      let evolutionMessageCount = 0;
      let lastEvolutionTimestamp = '';
      
      try {
        const msgResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ where: { key: { remoteJid: jid } }, limit: 5 })
        });
        
        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          const messages = Array.isArray(msgData?.messages) ? msgData.messages : 
                          Array.isArray(msgData?.messages?.records) ? msgData.messages.records :
                          Array.isArray(msgData) ? msgData : [];
          evolutionMessageCount = messages.length;
          
          if (messages.length > 0) {
            const lastMsg = messages[0];
            const ts = lastMsg.messageTimestamp;
            if (ts) {
              lastEvolutionTimestamp = new Date(Number(ts) * 1000).toISOString();
            }
          }
        }
      } catch (e) { /* continue */ }

      let databaseMessageCount = 0;
      let lastDatabaseTimestamp = '';
      
      if (dbConv) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', dbConv.id);
        databaseMessageCount = count || 0;
        
        const { data: lastDbMsg } = await supabase
          .from('messages')
          .select('created_at')
          .eq('conversation_id', dbConv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (lastDbMsg) {
          lastDatabaseTimestamp = lastDbMsg.created_at;
        }
      }

      // Determine status
      let status: 'ok' | 'missing_in_db' | 'missing_messages' | 'outdated' = 'ok';
      
      if (!dbConv) {
        status = 'missing_in_db';
        summary.missingInDb++;
      } else if (databaseMessageCount === 0 && evolutionMessageCount > 0) {
        status = 'missing_messages';
        summary.missingMessages++;
      } else if (lastEvolutionTimestamp && lastDatabaseTimestamp) {
        const evDate = new Date(lastEvolutionTimestamp);
        const dbDate = new Date(lastDatabaseTimestamp);
        if (evDate > dbDate && (evDate.getTime() - dbDate.getTime()) > 60000) {
          status = 'outdated';
          summary.outdated++;
        } else {
          summary.ok++;
        }
      } else {
        summary.ok++;
      }

      diagnostics.push({
        jid,
        name: chatName,
        isGroup,
        inEvolution: true,
        inDatabase: !!dbConv,
        evolutionMessageCount,
        databaseMessageCount,
        lastEvolutionMessage: lastEvolutionTimestamp,
        lastDatabaseMessage: lastDatabaseTimestamp,
        status
      });

      // Small delay to avoid overwhelming the API
      await new Promise(r => setTimeout(r, 50));
    }

    // Sort diagnostics: problems first
    diagnostics.sort((a, b) => {
      const priority = { 'missing_in_db': 0, 'missing_messages': 1, 'outdated': 2, 'ok': 3 };
      return priority[a.status] - priority[b.status];
    });

    console.log(`\n========================================`);
    console.log(`📊 RESUMO DO DIAGNÓSTICO`);
    console.log(`========================================`);
    console.log(`Total na Evolution API: ${summary.totalEvolution}`);
    console.log(`   - Contatos: ${summary.contacts}`);
    console.log(`   - Grupos: ${summary.groups}`);
    console.log(`Total no Banco: ${summary.totalDatabase}`);
    console.log(`----------------------------------------`);
    console.log(`✅ OK: ${summary.ok}`);
    console.log(`❌ Faltando no DB: ${summary.missingInDb}`);
    console.log(`⚠️ Sem mensagens: ${summary.missingMessages}`);
    console.log(`🔄 Desatualizados: ${summary.outdated}`);
    console.log(`========================================\n`);

    // Get top problems
    const problems = diagnostics.filter(d => d.status !== 'ok').slice(0, 50);

    return new Response(JSON.stringify({
      success: true,
      instanceName,
      connectionState,
      summary,
      problems,
      allDiagnostics: diagnostics
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno',
      details: String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
