import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const b = await req.json().catch(() => ({}));
  const key = /vialog/i.test(String(b?.company || "")) ? "VIALOGISTIC" : "VIAINFRA";
  const token = Deno.env.get(`META_ACCESS_TOKEN_${key}`) || Deno.env.get("META_ACCESS_TOKEN_VIAINFRA") || "";
  const get = async (u: string) => (await fetch(u, { headers: { Authorization: `Bearer ${token}` } })).json().catch(() => ({}));
  const d = await get(`https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}`);
  const ids = new Set<string>();
  for (const s of d?.data?.granular_scopes || []) for (const t of s?.target_ids || []) if (String(s.scope).includes("whatsapp")) ids.add(String(t));
  const out: any = {};
  for (const id of ids) {
    const t = await get(`https://graph.facebook.com/v21.0/${id}/message_templates?limit=200&fields=name,status,language`);
    out[id] = (t?.data || []).map((x: any) => `${x.name}:${x.status}:${x.language}`);
  }
  return new Response(JSON.stringify({ key, wabas: [...ids], out }, null, 2), { headers: { ...cors, "Content-Type": "application/json" } });
});
