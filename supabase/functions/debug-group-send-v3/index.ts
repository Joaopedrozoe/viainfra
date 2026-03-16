import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const results: Record<string, any> = {};
  
  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    const instanceName = 'VIAINFRAOFICIAL';
    const groupJid = '120363421810878254@g.us'; // Via & T.Informatica
    const testMessage = `Teste v3 ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log('=== DEBUG GROUP SEND V3 - FORCE GROUP REFRESH ===');

    // 1. Forçar atualização do grupo específico via updateGroupSubject (não muda nada, só força refresh)
    console.log('\n🔄 1. Forçando refresh via fetchGroupMetadata...');
    try {
      // Método 1: Fetch group metadata para forçar refresh
      const resp = await fetch(`${evolutionUrl}/group/findGroupInfos/${instanceName}?groupJid=${groupJid}`, {
        headers: { 'apikey': evolutionKey }
      });
      const data = await resp.json();
      results.groupMetadata = { status: resp.status, subject: data?.subject, size: data?.size };
      console.log('Group metadata:', resp.status, data?.subject);
    } catch (e: any) {
      results.groupMetadata = { error: e.message };
    }

    // 2. Aguardar um pouco
    await new Promise(r => setTimeout(r, 1000));

    // 3. Tentar endpoint fetchParticipants para garantir que temos sessão ativa
    console.log('\n🔄 2. Forçando sessão via fetchParticipants...');
    try {
      const resp = await fetch(`${evolutionUrl}/group/participants/${instanceName}?groupJid=${groupJid}`, {
        headers: { 'apikey': evolutionKey }
      });
      const data = await resp.json();
      results.participants = { 
        status: resp.status, 
        count: Array.isArray(data?.participants) ? data.participants.length : (Array.isArray(data) ? data.length : 0)
      };
      console.log('Participants:', resp.status);
    } catch (e: any) {
      results.participants = { error: e.message };
    }

    // 4. Marcar chat como lido para ativar sessão
    console.log('\n🔄 3. Marcando chat como lido...');
    try {
      const resp = await fetch(`${evolutionUrl}/chat/markMessageAsRead/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          readMessages: [{ remoteJid: groupJid, fromMe: false, id: 'placeholder' }]
        })
      });
      results.markRead = { status: resp.status };
      console.log('Mark read:', resp.status);
    } catch (e: any) {
      results.markRead = { error: e.message };
    }

    // 5. Aguardar sessão estabilizar
    await new Promise(r => setTimeout(r, 2000));

    // 6. Enviar presença available
    console.log('\n🔄 4. Enviando presença available...');
    try {
      const resp = await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: groupJid, presence: 'available' })
      });
      results.presenceAvailable = { status: resp.status, data: await resp.text() };
      console.log('Presence available:', resp.status);
    } catch (e: any) {
      results.presenceAvailable = { error: e.message };
    }

    await new Promise(r => setTimeout(r, 1500));

    // 7. Enviar presença composing
    console.log('\n🔄 5. Enviando presença composing...');
    try {
      const resp = await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: groupJid, presence: 'composing' })
      });
      results.presenceComposing = { status: resp.status, data: await resp.text() };
      console.log('Presence composing:', resp.status);
    } catch (e: any) {
      results.presenceComposing = { error: e.message };
    }

    await new Promise(r => setTimeout(r, 2000));

    // 8. AGORA tentar enviar a mensagem
    console.log('\n📤 6. Enviando mensagem após todos os preparativos...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupJid, 
          text: testMessage,
          delay: 2000
        })
      });
      const data = await resp.text();
      results.sendText = { status: resp.status, data };
      console.log('Send text:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'sendText after full refresh',
          message: testMessage,
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.sendText = { error: e.message };
    }

    // 9. Se ainda falhou, tentar via archiveChat toggle (último recurso)
    console.log('\n🔄 7. Tentando toggle archive como último recurso...');
    try {
      // Arquivar
      await fetch(`${evolutionUrl}/chat/archiveChat/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessage: { key: { remoteJid: groupJid } }, archive: true })
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      // Desarquivar
      await fetch(`${evolutionUrl}/chat/archiveChat/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessage: { key: { remoteJid: groupJid } }, archive: false })
      });
      
      await new Promise(r => setTimeout(r, 2000));

      // Tentar novamente
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupJid, 
          text: testMessage + ' (retry)',
          delay: 2000
        })
      });
      const data = await resp.text();
      results.sendTextAfterArchive = { status: resp.status, data };
      console.log('Send after archive toggle:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'sendText after archive toggle',
          message: testMessage,
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.archiveToggle = { error: e.message };
    }

    // Se chegou aqui, falhou
    return new Response(JSON.stringify({
      success: false,
      message: 'Todas as tentativas falharam',
      note: 'O erro not-acceptable indica que a Evolution API está rejeitando mensagens para este grupo. Pode ser necessário verificar a versão da API ou configurações de grupo.',
      results
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      results 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
