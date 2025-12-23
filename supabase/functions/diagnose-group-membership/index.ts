import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GroupInfo {
  id: string;
  subject: string;
  owner: string;
  participants: { id: string; admin?: string }[];
  iAmMember: boolean;
  iAmAdmin: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    
    const { instance_name, group_jid } = await req.json();
    const instanceName = instance_name || 'VIAINFRAOFICIAL';

    console.log('=== DIAGNÓSTICO DE GRUPOS ===');
    console.log('Instance:', instanceName);
    console.log('Specific group:', group_jid || 'all');

    // 1. Buscar todos os grupos da instância
    console.log('\n📋 Buscando grupos da Evolution API...');
    
    const groupsResp = await fetch(`${evolutionUrl}/group/fetchAllGroups/${instanceName}?getParticipants=true`, {
      headers: { 'apikey': evolutionKey }
    });
    
    if (!groupsResp.ok) {
      const errorText = await groupsResp.text();
      console.error('Erro ao buscar grupos:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Falha ao buscar grupos da Evolution API',
        details: errorText
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const groupsData = await groupsResp.json();
    console.log(`Encontrados ${groupsData.length || 0} grupos`);

    // 2. Buscar número da instância
    const { data: instanceData } = await supabase
      .from('whatsapp_instances')
      .select('phone_number')
      .eq('instance_name', instanceName)
      .single();
    
    const instancePhone = instanceData?.phone_number || '';
    console.log('Telefone da instância:', instancePhone);

    // 3. Analisar cada grupo
    const groupsAnalysis: GroupInfo[] = [];
    const groups = Array.isArray(groupsData) ? groupsData : [];

    for (const group of groups) {
      const groupId = group.id || group.jid || '';
      const participants = group.participants || [];
      
      // Verificar se a instância é membro
      const iAmMember = participants.some((p: any) => {
        const participantPhone = (p.id || '').replace('@s.whatsapp.net', '');
        return participantPhone === instancePhone || 
               (p.id || '').includes(instancePhone);
      });
      
      // Verificar se é admin
      const iAmAdmin = participants.some((p: any) => {
        const participantPhone = (p.id || '').replace('@s.whatsapp.net', '');
        return (participantPhone === instancePhone || (p.id || '').includes(instancePhone)) && 
               (p.admin === 'admin' || p.admin === 'superadmin');
      });

      groupsAnalysis.push({
        id: groupId,
        subject: group.subject || 'Sem nome',
        owner: group.owner || 'Desconhecido',
        participants: participants.slice(0, 10), // Limitar para response menor
        iAmMember,
        iAmAdmin
      });
    }

    // 4. Buscar grupos no banco de dados
    console.log('\n📊 Comparando com grupos no banco...');
    
    const { data: dbConversations } = await supabase
      .from('conversations')
      .select('id, metadata, contacts(name)')
      .eq('channel', 'whatsapp')
      .not('metadata->remoteJid', 'is', null);
    
    const dbGroups = (dbConversations || []).filter((c: any) => {
      const remoteJid = c.metadata?.remoteJid || '';
      return remoteJid.includes('@g.us');
    });

    console.log(`Grupos no banco: ${dbGroups.length}`);

    // 5. Verificar mensagens pendentes em grupos
    const { data: pendingMessages } = await supabase
      .from('message_queue')
      .select('*, conversations!inner(metadata)')
      .eq('status', 'pending');
    
    const pendingGroupMessages = (pendingMessages || []).filter((m: any) => {
      const remoteJid = m.conversations?.metadata?.remoteJid || '';
      return remoteJid.includes('@g.us');
    });

    console.log(`Mensagens pendentes em grupos: ${pendingGroupMessages.length}`);

    // 6. Se um grupo específico foi solicitado, analisar em detalhe
    let specificGroupAnalysis = null;
    if (group_jid) {
      console.log(`\n🔍 Análise detalhada do grupo: ${group_jid}`);
      
      const specificGroup = groupsAnalysis.find(g => g.id === group_jid);
      
      if (specificGroup) {
        // Tentar buscar participantes detalhados
        const participantsResp = await fetch(
          `${evolutionUrl}/group/participants/${instanceName}?groupJid=${group_jid}`,
          { headers: { 'apikey': evolutionKey } }
        );
        
        let detailedParticipants = [];
        if (participantsResp.ok) {
          const pData = await participantsResp.json();
          detailedParticipants = pData.participants || pData || [];
        }
        
        specificGroupAnalysis = {
          ...specificGroup,
          detailedParticipants,
          canSend: specificGroup.iAmMember,
          recommendation: specificGroup.iAmMember 
            ? 'Pode enviar mensagens para este grupo'
            : 'NÃO É MEMBRO - não pode enviar mensagens'
        };
      } else {
        specificGroupAnalysis = {
          id: group_jid,
          found: false,
          recommendation: 'Grupo não encontrado na lista de grupos. Pode ter sido excluído ou a instância foi removida.'
        };
      }
    }

    // 7. Criar resumo
    const canSendCount = groupsAnalysis.filter(g => g.iAmMember).length;
    const cannotSendCount = groupsAnalysis.filter(g => !g.iAmMember).length;

    const summary = {
      instanceName,
      instancePhone,
      totalGroupsInWhatsApp: groupsAnalysis.length,
      totalGroupsInDB: dbGroups.length,
      groupsCanSend: canSendCount,
      groupsCannotSend: cannotSendCount,
      pendingGroupMessages: pendingGroupMessages.length,
      recommendation: cannotSendCount > 0 
        ? `Existem ${cannotSendCount} grupos onde a instância NÃO é membro e não pode enviar`
        : 'Todos os grupos podem receber mensagens'
    };

    console.log('\n📊 RESUMO:');
    console.log(JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify({
      success: true,
      summary,
      specificGroup: specificGroupAnalysis,
      groups: groupsAnalysis.slice(0, 50), // Limitar resposta
      pendingGroupMessages: pendingGroupMessages.map(m => ({
        id: m.id,
        content: m.content?.substring(0, 50),
        groupJid: m.conversations?.metadata?.remoteJid,
        status: m.status,
        error: m.error_message
      })),
      dbGroups: dbGroups.map((g: any) => ({
        id: g.id,
        name: g.contacts?.name,
        remoteJid: g.metadata?.remoteJid
      }))
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
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
