import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 BLOQUEIO PERMANENTE
// Endpoints da Evolution são controlados MANUALMENTE pelo administrador.
// É estritamente proibido que qualquer função deste projeto altere webhooks
// via /webhook/set/{instance}. Esta função está desativada intencionalmente.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.warn('⛔ setup-webhooks foi chamada, mas está DESATIVADA por política de segurança.');

  return new Response(
    JSON.stringify({
      success: false,
      disabled: true,
      error: 'Alteração de webhook da Evolution está desativada. Endpoints são gerenciados manualmente.',
    }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
