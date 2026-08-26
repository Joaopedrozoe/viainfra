const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ marker: 'probe-2026-08-26T15:40Z' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
