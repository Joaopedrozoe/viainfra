import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const b = await req.json().catch(() => ({}));
  const waba = String(b?.waba || "1367479535322020");
  const key = /vialog/i.test(String(b?.company || "")) ? "VIALOGISTIC" : "VIAINFRA";
  const token = Deno.env.get(`META_ACCESS_TOKEN_${key}`) || Deno.env.get("META_ACCESS_TOKEN_VIAINFRA") || "";
  const r = await fetch(`https://graph.facebook.com/v21.0/${waba}/message_templates?limit=200&fields=name,status,language,quality_score,rejected_reason`, { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json().catch(() => ({}));
  return new Response(JSON.stringify(d, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
});
