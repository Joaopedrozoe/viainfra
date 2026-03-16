import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    const instanceName = 'VIAINFRAOFICIAL';
    
    const groupJid = '120363421810878254@g.us';
    const testMessage = `Mensagem pendente enviada com sucesso - ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log(`=== FORÇANDO ENVIO PARA GRUPO ===`);

    const results: Record<string, any> = {};

    // ============================================================
    // TÉCNICA 1: Enviar presença antes de mensagem
    // Isso força o Baileys a estabelecer sessão com o grupo
    // ============================================================
    console.log('\n🔧 TÉCNICA 1: Enviar presença antes');
    
    // Enviar presença "composing" para o grupo
    const presencePayload = {
      number: groupJid,
      presence: 'composing'
    };
    
    const presenceResp = await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(presencePayload)
    });
    const presenceText = await presenceResp.text();
    console.log(`Presença: ${presenceResp.status} - ${presenceText}`);
    results.presence = { status: presenceResp.status, ok: presenceResp.ok, response: presenceText };

    // Aguardar 2 segundos para sessão estabelecer
    await new Promise(r => setTimeout(r, 2000));

    // Agora enviar mensagem
    console.log('\n📤 Enviando texto após presença...');
    const textPayload = {
      number: groupJid,
      text: testMessage
    };
    
    const textResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload)
    });
    const textResult = await textResp.text();
    console.log(`Texto: ${textResp.status} - ${textResult}`);
    results.textAfterPresence = { status: textResp.status, ok: textResp.ok, response: textResult };

    if (textResp.ok) {
      console.log('✅ SUCESSO! Técnica 1 funcionou');
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'presença + texto',
        response: textResult 
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================================
    // TÉCNICA 2: Usar sendMessage (API genérica do Evolution)
    // ============================================================
    console.log('\n🔧 TÉCNICA 2: /message/sendMessage endpoint');
    
    const genericPayload = {
      number: groupJid,
      options: {
        delay: 1200,
        presence: 'composing'
      },
      textMessage: {
        text: testMessage
      }
    };
    console.log('Payload:', JSON.stringify(genericPayload));
    
    const genericResp = await fetch(`${evolutionUrl}/message/sendMessage/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(genericPayload)
    });
    const genericResult = await genericResp.text();
    console.log(`Resultado: ${genericResp.status} - ${genericResult}`);
    results.sendMessage = { status: genericResp.status, ok: genericResp.ok, response: genericResult };

    if (genericResp.ok) {
      console.log('✅ SUCESSO! Técnica 2 funcionou');
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'sendMessage genérico',
        response: genericResult 
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================================
    // TÉCNICA 3: Fetch participants para forçar metadata update
    // ============================================================
    console.log('\n🔧 TÉCNICA 3: Force fetch participants e retry');
    
    // Forçar atualização dos participantes
    const participantsResp = await fetch(`${evolutionUrl}/group/participants/${instanceName}?groupJid=${groupJid}`, {
      headers: { 'apikey': evolutionKey }
    });
    const participantsText = await participantsResp.text();
    console.log(`Participants: ${participantsResp.status}`);
    
    // Aguardar sync
    await new Promise(r => setTimeout(r, 1500));
    
    // Retry envio
    const retryResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid, text: testMessage, delay: 1500 })
    });
    const retryResult = await retryResp.text();
    console.log(`Retry: ${retryResp.status} - ${retryResult}`);
    results.afterParticipants = { status: retryResp.status, ok: retryResp.ok, response: retryResult };

    if (retryResp.ok) {
      console.log('✅ SUCESSO! Técnica 3 funcionou');
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'após fetch participants',
        response: retryResult 
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================================
    // TÉCNICA 4: Usar markChatUnread para forçar sessão
    // ============================================================
    console.log('\n🔧 TÉCNICA 4: Mark chat como ativo');
    
    const markResp = await fetch(`${evolutionUrl}/chat/markChatUnread/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid })
    });
    console.log(`Mark: ${markResp.status}`);
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Retry final
    const finalResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid, text: testMessage })
    });
    const finalResult = await finalResp.text();
    console.log(`Final: ${finalResp.status} - ${finalResult}`);
    results.afterMark = { status: finalResp.status, ok: finalResp.ok, response: finalResult };

    if (finalResp.ok) {
      console.log('✅ SUCESSO! Técnica 4 funcionou');
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'após mark chat',
        response: finalResult 
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================================
    // TÉCNICA 5: Enviar via Archive/Unarchive para forçar sync
    // ============================================================
    console.log('\n🔧 TÉCNICA 5: Archive/Unarchive para sync');
    
    // Archive
    await fetch(`${evolutionUrl}/chat/archiveChat/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat: groupJid, archive: false })
    });
    
    await new Promise(r => setTimeout(r, 1500));
    
    // Envio final
    const archiveResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid, text: testMessage, delay: 2000 })
    });
    const archiveResult = await archiveResp.text();
    console.log(`After archive: ${archiveResp.status} - ${archiveResult}`);
    results.afterArchive = { status: archiveResp.status, ok: archiveResp.ok, response: archiveResult };

    if (archiveResp.ok) {
      console.log('✅ SUCESSO! Técnica 5 funcionou');
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'após archive/unarchive',
        response: archiveResult 
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================================
    // ANÁLISE: Verificar todos os endpoints disponíveis
    // ============================================================
    console.log('\n📊 Listando endpoints message disponíveis...');
    
    // Tentar descobrir endpoints alternativos testando OPTIONS
    const endpointsToTest = [
      '/message/sendText',
      '/message/sendMessage', 
      '/message/send',
      '/send/text',
      '/chat/sendText',
      '/group/sendMessage'
    ];
    
    for (const ep of endpointsToTest) {
      try {
        const testResp = await fetch(`${evolutionUrl}${ep}/${instanceName}`, {
          method: 'OPTIONS',
          headers: { 'apikey': evolutionKey }
        });
        console.log(`${ep}: ${testResp.status}`);
      } catch (e) {
        console.log(`${ep}: ERROR`);
      }
    }

    // Resultado final
    return new Response(JSON.stringify({
      success: false,
      message: 'Todas as técnicas falharam',
      results,
      nextStep: 'Verificar versão da Evolution API e atualizar para resolver bug LID'
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
