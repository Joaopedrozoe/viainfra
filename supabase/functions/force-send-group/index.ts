import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const { instance_name, group_jid, message } = await req.json();
    const instanceName = instance_name || 'VIAINFRAOFICIAL';
    const testMessage = message || `Teste de grupo - ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log('=== FORCE SEND TO GROUP ===');
    console.log('Instance:', instanceName);
    console.log('Group:', group_jid);

    if (!group_jid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'group_jid é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: Record<string, any> = {};

    // PASSO 1: Forçar refresh de TODOS os grupos para limpar cache
    console.log('\n🔄 PASSO 1: Forçando refresh de grupos...');
    
    const groupsResp = await fetch(`${evolutionUrl}/group/fetchAllGroups/${instanceName}?getParticipants=true`, {
      headers: { 'apikey': evolutionKey }
    });
    const groupsText = await groupsResp.text();
    console.log(`Refresh grupos: ${groupsResp.status}`);
    results.groupRefresh = { status: groupsResp.status, ok: groupsResp.ok };

    // Verificar se o grupo específico está na lista
    try {
      const groups = JSON.parse(groupsText);
      const targetGroup = groups?.find((g: any) => g.id === group_jid);
      if (targetGroup) {
        console.log(`✅ Grupo encontrado: ${targetGroup.subject}`);
        results.groupFound = { subject: targetGroup.subject, participantCount: targetGroup.participants?.length };
      } else {
        console.log('⚠️ Grupo NÃO encontrado na lista!');
        results.groupFound = false;
      }
    } catch {
      console.log('Não foi possível parsear lista de grupos');
    }

    // PASSO 2: Buscar participantes específicos do grupo para forçar metadata
    console.log('\n🔄 PASSO 2: Buscando participantes do grupo...');
    
    const participantsResp = await fetch(
      `${evolutionUrl}/group/participants/${instanceName}?groupJid=${group_jid}`,
      { headers: { 'apikey': evolutionKey } }
    );
    const participantsText = await participantsResp.text();
    console.log(`Participantes: ${participantsResp.status}`);
    results.participants = { status: participantsResp.status, ok: participantsResp.ok };

    // Aguardar 3 segundos para cache atualizar
    console.log('\n⏳ Aguardando 3 segundos para cache atualizar...');
    await new Promise(r => setTimeout(r, 3000));

    // PASSO 3: Enviar presença "available" para o grupo
    console.log('\n🔄 PASSO 3: Enviando presença "available"...');
    
    const presenceResp = await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: group_jid, presence: 'available' })
    });
    console.log(`Presença available: ${presenceResp.status}`);
    results.presenceAvailable = { status: presenceResp.status, ok: presenceResp.ok };

    // Aguardar 1 segundo
    await new Promise(r => setTimeout(r, 1000));

    // PASSO 4: Enviar presença "composing"
    console.log('\n🔄 PASSO 4: Enviando presença "composing"...');
    
    const composingResp = await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: group_jid, presence: 'composing' })
    });
    console.log(`Presença composing: ${composingResp.status}`);
    results.presenceComposing = { status: composingResp.status, ok: composingResp.ok };

    // Aguardar 2 segundos
    await new Promise(r => setTimeout(r, 2000));

    // PASSO 5: Enviar mensagem de texto
    console.log('\n📤 PASSO 5: Enviando mensagem de texto...');
    
    const sendResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: group_jid, 
        text: testMessage,
        delay: 2000
      })
    });
    const sendText = await sendResp.text();
    console.log(`Envio: ${sendResp.status}`, sendText);
    results.send = { status: sendResp.status, ok: sendResp.ok, response: sendText };

    if (sendResp.ok) {
      console.log('\n✅ SUCESSO! Mensagem enviada para o grupo!');
      return new Response(JSON.stringify({
        success: true,
        message: 'Mensagem enviada com sucesso!',
        results
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Se ainda falhou, tentar técnica alternativa: marcar chat como unread
    console.log('\n🔄 PASSO 6 (fallback): Marcando chat como unread...');
    
    const unreadResp = await fetch(`${evolutionUrl}/chat/markChatUnread/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: group_jid })
    });
    console.log(`Mark unread: ${unreadResp.status}`);
    
    await new Promise(r => setTimeout(r, 2000));

    // Tentar enviar novamente
    console.log('\n📤 Tentando envio novamente após mark unread...');
    
    const retryResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: group_jid, 
        text: testMessage,
        delay: 2000
      })
    });
    const retryText = await retryResp.text();
    console.log(`Retry: ${retryResp.status}`, retryText);
    results.retry = { status: retryResp.status, ok: retryResp.ok, response: retryText };

    if (retryResp.ok) {
      console.log('\n✅ SUCESSO após mark unread!');
      return new Response(JSON.stringify({
        success: true,
        message: 'Mensagem enviada após mark unread!',
        results
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Falhou todas as técnicas
    console.log('\n❌ TODAS AS TÉCNICAS FALHARAM');
    console.log('Possíveis causas:');
    console.log('1. A instância não é mais membro do grupo');
    console.log('2. O grupo foi excluído');
    console.log('3. Problema de sessão na Evolution API (precisa reiniciar)');

    return new Response(JSON.stringify({
      success: false,
      message: 'Todas as técnicas falharam. Verifique se a instância ainda é membro do grupo.',
      recommendation: 'Tente reiniciar a instância VIAINFRAOFICIAL na Evolution API',
      results
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
