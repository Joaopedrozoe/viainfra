import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function creds(companyName: string) {
  const isVialogistic = /vialogistic/i.test(companyName || "");
  return isVialogistic
    ? {
      key: "VIALOGISTIC",
      token:
        Deno.env.get("META_ACCESS_TOKEN_VIALOGISTIC") ||
        Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
    }
    : { key: "VIAINFRA", token: Deno.env.get("META_ACCESS_TOKEN_VIAINFRA") };
}

async function wabaOf(supabase: any, nameLike: string) {
  const { data } = await supabase
    .from("companies")
    .select("name, settings")
    .ilike("name", `%${nameLike}%`)
    .limit(1)
    .maybeSingle();
  return {
    name: data?.name || nameLike,
    waba: String((data?.settings as any)?.meta_waba_id || ""),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json().catch(() => ({}));
    const source = String(body?.source || "viainfra");
    const target = String(body?.target || "vialogistic");
    const only: string[] = Array.isArray(body?.templates) ? body.templates.map(String) : [];

    const src = await wabaOf(supabase, source);
    const tgt = await wabaOf(supabase, target);
    const srcCreds = creds(src.name);
    const tgtCreds = creds(tgt.name);

    if (!src.waba || !tgt.waba) return json({ success: false, error: "WABA ID não encontrado" }, 400);
    if (!srcCreds.token || !tgtCreds.token) return json({ success: false, error: "Token Meta ausente" }, 500);

    const fetchTemplates = async (waba: string, token: string) => {
      const r = await fetch(
        `https://graph.facebook.com/v21.0/${waba}/message_templates?limit=200&fields=name,language,status,category,components`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error?.message || "Falha ao listar templates");
      return (d?.data || []) as any[];
    };

    const srcTemplates = await fetchTemplates(src.waba, srcCreds.token);
    const tgtTemplates = await fetchTemplates(tgt.waba, tgtCreds.token);
    const existing = new Set(tgtTemplates.map((t) => `${t.name}|${t.language}`));

    const results: any[] = [];
    for (const t of srcTemplates) {
      if (only.length && !only.includes(t.name)) continue;
      if (existing.has(`${t.name}|${t.language}`)) {
        results.push({ name: t.name, language: t.language, skipped: "já existe" });
        continue;
      }
      const components = (t.components || []).filter((c: any) =>
        ["BODY", "HEADER", "FOOTER", "BUTTONS"].includes(String(c.type).toUpperCase())
      );
      const r = await fetch(`https://graph.facebook.com/v21.0/${tgt.waba}/message_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tgtCreds.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: t.name,
          language: t.language,
          category: t.category,
          components,
        }),
      });
      const d = await r.json().catch(() => ({}));
      results.push({
        name: t.name,
        language: t.language,
        ok: r.ok,
        status: d?.status || null,
        error: d?.error?.message || null,
      });
    }

    return json({ success: true, source: src.name, target: tgt.name, results });
  } catch (error) {
    console.error("[sync-templates]", error);
    return json({ success: false, error: String(error) }, 500);
  }
});
