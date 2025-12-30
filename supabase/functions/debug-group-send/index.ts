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
    const testMessage = `Teste debug ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log('=== DEBUG GROUP SEND ===');
    console.log('URL:', evolutionUrl);
    console.log('Instance:', instanceName);
    console.log('Group:', groupJid);

    // 1. Verificar estado da instância
    console.log('\n📡 1. Verificando estado da instância...');
    try {
      const stateResp = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evolutionKey }
      });
      const stateData = await stateResp.text();
      results.instanceState = { status: stateResp.status, data: stateData };
      console.log('Estado:', stateResp.status, stateData);
    } catch (e: any) {
      results.instanceState = { error: e.message };
    }

    // 2. Verificar se conseguimos acessar o grupo
    console.log('\n📋 2. Verificando acesso ao grupo...');
    try {
      const groupResp = await fetch(`${evolutionUrl}/group/findGroupInfos/${instanceName}?groupJid=${groupJid}`, {
        headers: { 'apikey': evolutionKey }
      });
      const groupData = await groupResp.text();
      results.groupInfo = { status: groupResp.status, data: groupData.substring(0, 500) };
      console.log('Grupo:', groupResp.status, groupData.substring(0, 300));
    } catch (e: any) {
      results.groupInfo = { error: e.message };
    }

    // 3. Tentar enviar via sendText com número formatado como grupo
    console.log('\n📤 3. Tentando sendText com @g.us...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupJid, 
          text: testMessage 
        })
      });
      const data = await resp.text();
      results.sendText_gus = { status: resp.status, data };
      console.log('sendText @g.us:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'sendText with @g.us',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.sendText_gus = { error: e.message };
    }

    // 4. Tentar enviar via sendText apenas com ID do grupo (sem @g.us)
    console.log('\n📤 4. Tentando sendText sem @g.us...');
    const groupId = groupJid.replace('@g.us', '');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupId, 
          text: testMessage 
        })
      });
      const data = await resp.text();
      results.sendText_id = { status: resp.status, data };
      console.log('sendText ID:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'sendText with group ID only',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.sendText_id = { error: e.message };
    }

    // 5. Tentar via textMessage endpoint
    console.log('\n📤 5. Tentando textMessage...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/textMessage/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupJid, 
          textMessage: { text: testMessage }
        })
      });
      const data = await resp.text();
      results.textMessage = { status: resp.status, data };
      console.log('textMessage:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'textMessage endpoint',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.textMessage = { error: e.message };
    }

    // 6. Tentar via chat/sendMessage
    console.log('\n📤 6. Tentando chat/sendMessage...');
    try {
      const resp = await fetch(`${evolutionUrl}/chat/sendMessage/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jid: groupJid, 
          message: { conversation: testMessage }
        })
      });
      const data = await resp.text();
      results.chatSendMessage = { status: resp.status, data };
      console.log('chat/sendMessage:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'chat/sendMessage endpoint',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.chatSendMessage = { error: e.message };
    }

    // 7. Tentar sendMessage genérico
    console.log('\n📤 7. Tentando /message/sendMessage...');
    try {
      const resp = await fetch(`${evolutionUrl}/message/sendMessage/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: groupJid, 
          options: { delay: 1200 },
          textMessage: { text: testMessage }
        })
      });
      const data = await resp.text();
      results.sendMessage = { status: resp.status, data };
      console.log('sendMessage:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'message/sendMessage endpoint',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.sendMessage = { error: e.message };
    }

    // 8. Tentar via group/sendMessage específico para grupos
    console.log('\n📤 8. Tentando group/sendMessage...');
    try {
      const resp = await fetch(`${evolutionUrl}/group/sendMessage/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groupJid: groupJid, 
          message: testMessage
        })
      });
      const data = await resp.text();
      results.groupSendMessage = { status: resp.status, data };
      console.log('group/sendMessage:', resp.status, data);
      
      if (resp.ok) {
        return new Response(JSON.stringify({
          success: true,
          method: 'group/sendMessage endpoint',
          results
        }, null, 2), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch (e: any) {
      results.groupSendMessage = { error: e.message };
    }

    // Nenhum funcionou
    return new Response(JSON.stringify({
      success: false,
      message: 'Todos os métodos falharam',
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
