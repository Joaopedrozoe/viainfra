import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const body = await req.json().catch(() => ({}));
    const instanceName = body.instance_name || 'VIAINFRAOFICIAL';
    const groupJid = body.group_jid || '120363421810878254@g.us';
    const message = body.message || `Teste simples - ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log('=== TESTE SIMPLES ENVIO GRUPO ===');
    console.log('Instance:', instanceName);
    console.log('Group:', groupJid);
    console.log('Message:', message);

    // Tentar método 1: sendText padrão
    console.log('\n📤 Método 1: sendText padrão');
    const resp1 = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid, text: message })
    });
    const text1 = await resp1.text();
    console.log(`Resp1: ${resp1.status} - ${text1}`);
    
    if (resp1.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'sendText', 
        response: text1 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Tentar método 2: sendText com options
    console.log('\n📤 Método 2: sendText com options');
    const resp2 = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: groupJid, 
        text: message,
        options: {
          delay: 1200,
          presence: 'composing'
        }
      })
    });
    const text2 = await resp2.text();
    console.log(`Resp2: ${resp2.status} - ${text2}`);
    
    if (resp2.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'sendText with options', 
        response: text2 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Tentar método 3: usar textMessage ao invés de sendText
    console.log('\n📤 Método 3: textMessage endpoint');
    const resp3 = await fetch(`${evolutionUrl}/message/textMessage/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: groupJid, 
        textMessage: { text: message }
      })
    });
    const text3 = await resp3.text();
    console.log(`Resp3: ${resp3.status} - ${text3}`);
    
    if (resp3.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        method: 'textMessage', 
        response: text3 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Tentar método 4: Verificar estado da instância primeiro
    console.log('\n🔍 Verificando estado da instância...');
    const stateResp = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionKey }
    });
    const stateText = await stateResp.text();
    console.log(`Estado: ${stateResp.status} - ${stateText}`);

    // Listar grupos disponíveis
    console.log('\n🔍 Listando grupos...');
    const groupsResp = await fetch(`${evolutionUrl}/group/fetchAllGroups/${instanceName}`, {
      headers: { 'apikey': evolutionKey }
    });
    const groupsText = await groupsResp.text();
    console.log(`Grupos: ${groupsResp.status}`);
    
    let groupInfo = null;
    try {
      const groups = JSON.parse(groupsText);
      groupInfo = groups?.find((g: any) => g.id === groupJid);
      console.log('Grupo encontrado:', groupInfo ? groupInfo.subject : 'NÃO');
    } catch (e) {
      console.log('Erro ao parsear grupos:', e);
    }

    return new Response(JSON.stringify({
      success: false,
      errors: {
        method1: { status: resp1.status, response: text1 },
        method2: { status: resp2.status, response: text2 },
        method3: { status: resp3.status, response: text3 }
      },
      instanceState: stateText,
      groupFound: groupInfo ? { subject: groupInfo.subject, id: groupInfo.id } : null
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
