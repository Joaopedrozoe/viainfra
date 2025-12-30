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
    const testMessage = `Teste final ${new Date().toLocaleTimeString('pt-BR')}`;

    console.log('=== FINAL GROUP SEND TEST ===');

    // Evolution API v2 usa /chat/sendPresence ao invés de /chat/updatePresence
    console.log('1. Enviando presença via v2 endpoint...');
    const presenceResp = await fetch(`${evolutionUrl}/chat/sendPresence/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid, delay: 1200, presence: 'composing' })
    });
    console.log('Presence:', presenceResp.status, await presenceResp.text());

    await new Promise(r => setTimeout(r, 2000));

    // Tentar envio
    console.log('2. Enviando mensagem...');
    const sendResp = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid, text: testMessage, delay: 1200 })
    });
    const sendData = await sendResp.text();
    console.log('Send:', sendResp.status, sendData);

    if (sendResp.ok) {
      return new Response(JSON.stringify({ success: true, data: sendData }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Último recurso: testar se mensagens para contatos individuais funcionam
    // (para confirmar se o problema é específico de grupos)
    console.log('3. Testando envio para contato individual para diagnóstico...');
    // Usar um número de teste interno (o próprio número da instância se disponível)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'not-acceptable persiste',
      presenceStatus: presenceResp.status,
      sendStatus: sendResp.status,
      sendData,
      note: 'O erro "not-acceptable" da Evolution API v2.2.3 para grupos pode indicar: 1) Bug na API, 2) Problema de sincronização do grupo, 3) Configuração da instância. Recomendação: Verificar se o envio para contatos individuais funciona normalmente.'
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
