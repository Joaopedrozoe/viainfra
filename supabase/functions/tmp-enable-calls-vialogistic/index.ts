import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async () => {
  const token = Deno.env.get("META_ACCESS_TOKEN_VIALOGISTIC") || Deno.env.get("META_ACCESS_TOKEN_VIAINFRA");
  const id = Deno.env.get("META_PHONE_NUMBER_ID_VIALOGISTIC") || "1157997970738498";
  const base = `https://graph.facebook.com/v21.0/${id}/settings`;
  const post = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ calling: { status: "ENABLED", call_icon_visibility: "DEFAULT", callback_permission_status: "ENABLED" } }),
  });
  const postData = await post.json().catch(() => ({}));
  const get = await fetch(base, { headers: { Authorization: `Bearer ${token}` } });
  const getData = await get.json().catch(() => ({}));
  return new Response(JSON.stringify({ usedToken: Deno.env.get("META_ACCESS_TOKEN_VIALOGISTIC") ? "VIALOGISTIC" : "VIAINFRA_FALLBACK", postStatus: post.status, postData, getStatus: get.status, getData }, null, 2), { headers: { "Content-Type": "application/json" } });
});
