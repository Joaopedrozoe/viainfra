import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPANIES = [
  {
    key: "VIAINFRA",
    waba: "1223080654224926",
    phoneNumberId: "1221458467717278",
    tokenEnv: "META_ACCESS_TOKEN_VIAINFRA",
  },
  {
    key: "VIALOGISTIC",
    waba: "1367479535322020",
    phoneNumberId: "1157997970738498",
    tokenEnv: "META_ACCESS_TOKEN_VIALOGISTIC",
  },
];

async function g(url: string, token: string) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return await r.json().catch(() => ({ error: "parse" }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const out: Record<string, unknown> = {};
  for (const c of COMPANIES) {
    const token = Deno.env.get(c.tokenEnv) || "";
    if (!token) {
      out[c.key] = { error: `${c.tokenEnv} ausente` };
      continue;
    }
    const waba = await g(
      `https://graph.facebook.com/v21.0/${c.waba}?fields=id,name,account_review_status,business_verification_status,messaging_limit_tier,status,currency,timezone_id`,
      token,
    );
    const number = await g(
      `https://graph.facebook.com/v21.0/${c.phoneNumberId}?fields=id,display_phone_number,verified_name,status,quality_rating,name_status,code_verification_status,platform_type,throughput`,
      token,
    );
    const subs = await g(`https://graph.facebook.com/v21.0/${c.waba}/subscribed_apps`, token);
    out[c.key] = { waba, number, subscribed_apps: subs };
  }

  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
