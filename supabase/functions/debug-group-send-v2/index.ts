import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const testMessage = `Teste v2 ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log('=== DEBUG GROUP SEND V2 ===');
    console.log('URL:', evolutionUrl);

    // 1. Verificar a versão da API Evolution
    console.log('\n🔍 1. Verificando versão da API...');
    try {
      // Tentar endpoint de status/info
      const infoResp = await fetch(`${evolutionUrl}/`, {
        headers: { 'apikey': evolutionKey }
      });
      const infoData = await infoResp.text();
      results.apiInfo = { status: infoResp.status, data: infoData.substring(0, 500) };
      console.log('API Info:', infoResp.status, infoData.substring(0, 300));
    } catch (e: any) {
      results.apiInfo = { error: e.message };
    }

    // 2. Listar todos os endpoints disponíveis (via OPTIONS ou GET)
    console.log('\n🔍 2. Verificando endpoints de mensagem...');
    const endpoints = [
      '/message/sendText',
      '/message/sendMessage',
      '/chat/sendMessage',
      '/group/sendText',
      '/send/text'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const resp = await fetch(`${evolutionUrl}${endpoint}/${instanceName}`, {
          method: 'OPTIONS',
          headers: { 'apikey': evolutionKey }
        });
        results[`check_${endpoint.replace(/\//g, '_')}`] = resp.status;
      } catch (e) {
        // ignore
      }
    }

    // 3. Tentar enviar com diferentes formatos de body
    console.log('\n📤 3. Testando diferentes formatos de body...');
    
    // Formato 1: number + text (padrão)
    console.log('3a. Formato padrão...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupJid, 
          text: testMessage 
        })
      });
      results.format1 = { status: resp.status, data: await resp.text() };
    } catch (e: any) {
      results.format1 = { error: e.message };
    }

    // Formato 2: remoteJid ao invés de number
    console.log('3b. Com remoteJid...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          remoteJid: groupJid, 
          text: testMessage 
        })
      });
      results.format2 = { status: resp.status, data: await resp.text() };
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'remoteJid format',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.format2 = { error: e.message };
    }

    // Formato 3: chatId ao invés de number
    console.log('3c. Com chatId...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: groupJid, 
          text: testMessage 
        })
      });
      results.format3 = { status: resp.status, data: await resp.text() };
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'chatId format',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.format3 = { error: e.message };
    }

    // Formato 4: to ao invés de number
    console.log('3d. Com to...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: groupJid, 
          text: testMessage 
        })
      });
      results.format4 = { status: resp.status, data: await resp.text() };
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'to format',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.format4 = { error: e.message };
    }

    // Formato 5: jid ao invés de number
    console.log('3e. Com jid...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jid: groupJid, 
          text: testMessage 
        })
      });
      results.format5 = { status: resp.status, data: await resp.text() };
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'jid format',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.format5 = { error: e.message };
    }

    // Formato 6: body diferente - message ao invés de text
    console.log('3f. Com message ao invés de text...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupJid, 
          message: testMessage 
        })
      });
      results.format6 = { status: resp.status, data: await resp.text() };
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'message field format',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.format6 = { error: e.message };
    }

    // 4. Testar via fetch das mensagens recentes para verificar se conseguimos interagir
    console.log('\n🔍 4. Buscando mensagens recentes do grupo...');
    try {
      const resp = await fetch(`${evolutionUrl}/chat/findMessages/${instanceName}?where[key.remoteJid]=${groupJid}&page=1&offset=5`, {
        headers: { 'apikey': evolutionKey }
      });
      const data = await resp.text();
      results.recentMessages = { status: resp.status, data: data.substring(0, 500) };
      console.log('Mensagens recentes:', resp.status, data.substring(0, 200));
    } catch (e: any) {
      results.recentMessages = { error: e.message };
    }

    // 5. Verificar se o problema é a sessão do grupo - tentar reentrar
    console.log('\n🔍 5. Verificando inviteCode do grupo...');
    try {
      const resp = await fetch(`${evolutionUrl}/group/inviteCode/${instanceName}?groupJid=${groupJid}`, {
        headers: { 'apikey': evolutionKey }
      });
      const data = await resp.text();
      results.inviteCode = { status: resp.status, data };
      console.log('InviteCode:', resp.status, data);
    } catch (e: any) {
      results.inviteCode = { error: e.message };
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Todos os formatos falharam',
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
