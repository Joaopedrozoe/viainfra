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
    
    // Número de teste individual (seu número - Flávio)
    const individualNumber = '5511975696283@s.whatsapp.net';
    const groupJid = '120363421810878254@g.us';
    
    const results: any = {};

    // Teste 1: Enviar para contato individual
    console.log(`📤 Test 1: Individual contact`);
    const resp1 = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: individualNumber, text: `Teste individual ${Date.now()}` })
    });
    const text1 = await resp1.text();
    console.log(`Individual: ${resp1.status} - ${text1.substring(0, 200)}`);
    results.individual = { status: resp1.status, ok: resp1.ok, response: text1.substring(0, 200) };

    // Teste 2: Enviar para grupo
    console.log(`📤 Test 2: Group`);
    const resp2 = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: groupJid, text: `Teste grupo ${Date.now()}` })
    });
    const text2 = await resp2.text();
    console.log(`Group: ${resp2.status} - ${text2.substring(0, 200)}`);
    results.group = { status: resp2.status, ok: resp2.ok, response: text2.substring(0, 200) };

    // Conclusão
    results.conclusion = {
      individualWorks: resp1.ok,
      groupWorks: resp2.ok,
      issue: resp1.ok && !resp2.ok ? 'EVOLUTION_API_BLOCKS_GROUPS' : 'UNKNOWN'
    };

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
