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
    const instanceName = 'VIAINFRAOFICIAL';
    
    const groupJid = '120363421810878254@g.us';
    const testMessage = `Mensagem de teste - ${new Date().toLocaleString('pt-BR')}`;

    console.log(`🔧 Testing alternative endpoints for groups`);

    const results: Record<string, any> = {};

    // 1. Tentar endpoint sendWhatsAppAudio (às vezes funciona para grupos)
    console.log('\n1. Testing sendPoll (groups only)...');
    try {
      const pollResp = await fetch(`${evolutionUrl}/message/sendPoll/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: groupJid,
          name: 'Teste',
          selectableCount: 1,
          values: ['Opção 1', 'Opção 2']
        })
      });
      const pollText = await pollResp.text();
      console.log(`Poll: ${pollResp.status} - ${pollText.substring(0, 150)}`);
      results.poll = { status: pollResp.status, ok: pollResp.ok, response: pollText.substring(0, 150) };
    } catch (e: any) {
      results.poll = { error: e.message };
    }

    // 2. Tentar sendReaction (para testar se o grupo aceita qualquer coisa)
    console.log('\n2. Testing sendReaction...');
    try {
      const reactionResp = await fetch(`${evolutionUrl}/message/sendReaction/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: {
            remoteJid: groupJid,
            fromMe: false,
            id: 'test'
          },
          reaction: '👍'
        })
      });
      const reactionText = await reactionResp.text();
      console.log(`Reaction: ${reactionResp.status} - ${reactionText.substring(0, 150)}`);
      results.reaction = { status: reactionResp.status, ok: reactionResp.ok, response: reactionText.substring(0, 150) };
    } catch (e: any) {
      results.reaction = { error: e.message };
    }

    // 3. Tentar sendButtons (funciona em grupos às vezes)
    console.log('\n3. Testing sendButtons...');
    try {
      const buttonsResp = await fetch(`${evolutionUrl}/message/sendButtons/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: groupJid,
          title: 'Teste',
          description: testMessage,
          footer: '',
          buttons: [{ buttonId: '1', buttonText: { displayText: 'OK' } }]
        })
      });
      const buttonsText = await buttonsResp.text();
      console.log(`Buttons: ${buttonsResp.status} - ${buttonsText.substring(0, 150)}`);
      results.buttons = { status: buttonsResp.status, ok: buttonsResp.ok, response: buttonsText.substring(0, 150) };
    } catch (e: any) {
      results.buttons = { error: e.message };
    }

    // 4. Última tentativa: sendContact (para testar o canal)
    console.log('\n4. Testing sendContact...');
    try {
      const contactResp = await fetch(`${evolutionUrl}/message/sendContact/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: groupJid,
          contact: [{
            fullName: 'Teste',
            wuid: '5511999999999',
            phoneNumber: '5511999999999'
          }]
        })
      });
      const contactText = await contactResp.text();
      console.log(`Contact: ${contactResp.status} - ${contactText.substring(0, 150)}`);
      results.contact = { status: contactResp.status, ok: contactResp.ok, response: contactText.substring(0, 150) };
    } catch (e: any) {
      results.contact = { error: e.message };
    }

    // 5. Verificar logs do Baileys para entender o erro real
    console.log('\n5. Getting instance logs...');
    try {
      const logsResp = await fetch(`${evolutionUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
        headers: { 'apikey': evolutionKey }
      });
      const logsData = await logsResp.json();
      if (logsData[0]) {
        results.instanceSettings = {
          groupsIgnore: logsData[0].Setting?.groupsIgnore,
          syncFullHistory: logsData[0].Setting?.syncFullHistory,
          integration: logsData[0].integration,
          disconnectionReasonCode: logsData[0].disconnectionReasonCode
        };
      }
    } catch (e: any) {
      results.logs = { error: e.message };
    }

    // 6. Final: tentar texto simples mais uma vez com delay maior
    console.log('\n6. Final text attempt with longer delay...');
    await new Promise(r => setTimeout(r, 3000));
    
    const finalResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        number: groupJid, 
        text: testMessage,
        delay: 3000
      })
    });
    const finalText = await finalResp.text();
    console.log(`Final: ${finalResp.status} - ${finalText}`);
    results.finalAttempt = { status: finalResp.status, ok: finalResp.ok, response: finalText };

    if (finalResp.ok) {
      results.success = true;
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
