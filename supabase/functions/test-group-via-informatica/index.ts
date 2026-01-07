import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TESTE ESPECÍFICO para grupo "Via & T.Informatica"
 * JID: 120363421810878254@g.us
 * 
 * Tenta estratégias avançadas incluindo sync de participantes individuais
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
  const instanceName = 'VIAINFRAOFICIAL';
  const groupJid = '120363421810878254@g.us'; // Via & T.Informatica
  
  const body = await req.json().catch(() => ({}));
  const message = body.message || `Teste ${new Date().toLocaleTimeString('pt-BR')}`;
  const action = body.action || 'send'; // send | sync | restart
  
  const results: Record<string, any> = {};
  
  console.log('=== TESTE VIA & T.INFORMATICA ===');
  console.log('Action:', action);
  console.log('Grupo JID:', groupJid);

  try {
    // Se ação for restart, fazer soft restart da instância
    if (action === 'restart') {
      console.log('🔄 Fazendo soft restart da instância...');
      const restartResp = await fetch(`${evolutionUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionKey }
      });
      const restartText = await restartResp.text();
      
      return new Response(JSON.stringify({
        success: restartResp.ok,
        action: 'restart',
        status: restartResp.status,
        response: restartText,
        note: 'Soft restart executado - aguarde ~5s e tente enviar novamente'
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ESTRATÉGIA AVANÇADA: Sync de participantes + fetch profile de cada um
    if (action === 'sync') {
      console.log('📍 Sincronização profunda de participantes...');
      
      // Buscar participantes
      const partResp = await fetch(
        `${evolutionUrl}/group/participants/${instanceName}?groupJid=${groupJid}`,
        { headers: { 'apikey': evolutionKey } }
      );
      const partData = await partResp.json().catch(() => null);
      
      if (partData?.participants) {
        results.totalParticipants = partData.participants.length;
        console.log(`Encontrados ${partData.participants.length} participantes`);
        
        // Para cada participante, buscar profilePicture para forçar key sync
        for (const p of partData.participants.slice(0, 5)) { // Limitar a 5
          try {
            const jid = p.id || p;
            console.log(`Sync profile: ${jid}`);
            await fetch(`${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
              method: 'POST',
              headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ number: jid })
            });
            await new Promise(r => setTimeout(r, 200));
          } catch (e) {}
        }
        
        // Buscar mensagens recentes do grupo
        console.log('Sync mensagens recentes...');
        await fetch(`${evolutionUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            where: { key: { remoteJid: groupJid } },
            limit: 3
          })
        });
        
        await new Promise(r => setTimeout(r, 500));
      }
      
      return new Response(JSON.stringify({
        success: true,
        action: 'sync',
        results,
        note: 'Sincronização executada - tente enviar a mensagem agora'
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AÇÃO PADRÃO: Enviar mensagem com nova estratégia
    console.log('📤 Enviando mensagem...');
    
    // Estratégia 1: readMessage primeiro (ack de leitura força sync)
    console.log('1. Enviando read...');
    try {
      await fetch(`${evolutionUrl}/chat/markMessageAsRead/${instanceName}`, {
        method: 'PUT',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          read_messages: [{ remoteJid: groupJid }]
        })
      });
    } catch (e) {}
    
    await new Promise(r => setTimeout(r, 300));
    
    // Estratégia 2: Tentar enviar com delay maior
    console.log('2. Enviando com delay 2000...');
    const resp1 = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: groupJid, 
        text: message,
        delay: 2000
      })
    });
    const text1 = await resp1.text();
    results.attempt1 = { status: resp1.status, response: text1 };
    
    if (resp1.ok) {
      console.log('✅ Sucesso no envio!');
      return new Response(JSON.stringify({
        success: true,
        response: JSON.parse(text1)
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Falha:', text1);
    
    // Estratégia 3: Tentar com options.mentions vazias
    console.log('3. Tentando com options vazias...');
    const resp2 = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: groupJid, 
        text: message,
        options: {}
      })
    });
    const text2 = await resp2.text();
    results.attempt2 = { status: resp2.status, response: text2 };
    
    if (resp2.ok) {
      console.log('✅ Sucesso no envio!');
      return new Response(JSON.stringify({
        success: true,
        response: JSON.parse(text2)
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Se nenhuma funcionou, verificar se envio individual funciona
    console.log('4. Testando envio individual para comparação...');
    const testPhone = '5554999999999@s.whatsapp.net'; // Número fake para ver o erro
    const resp3 = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: testPhone, 
        text: 'Test (will fail - just checking error type)'
      })
    });
    const text3 = await resp3.text();
    results.individualTest = { status: resp3.status, response: text3 };

    // Falhou tudo
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro not-acceptable persiste - recomendação: executar action=restart',
      results,
      recommendation: 'Chame esta função com action=restart para fazer soft restart da instância'
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro geral:', error);
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
