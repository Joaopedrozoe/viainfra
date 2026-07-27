import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// READ-ONLY: lista instâncias na Evolution API. Nunca altera webhooks.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = Deno.env.get('EVOLUTION_API_URL')!;
  const key = Deno.env.get('EVOLUTION_API_KEY')!;

  try {
    const res = await fetch(`${url}/instance/fetchInstances`, {
      headers: { apikey: key },
    });
    const data = await res.json();

    const list = (Array.isArray(data) ? data : data?.instances || []).map((i: any) => {
      const inst = i.instance || i;
      return {
        name: inst.instanceName || inst.name,
        state: inst.state || inst.connectionStatus || inst.status,
        integration: inst.integration,
        number: inst.number || inst.ownerJid || inst.owner,
        token: undefined,
      };
    });

    return new Response(JSON.stringify({ success: true, count: list.length, instances: list }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
