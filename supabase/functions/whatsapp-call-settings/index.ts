import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function resolveMetaCreds(companyName: string) {
  const isVialogistic = /vialogistic/i.test(companyName || "");
  if (isVialogistic) {
    return {
      key: "VIALOGISTIC",
      token: Deno.env.get("META_ACCESS_TOKEN_VIALOGISTIC") || Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
      phoneNumberId: Deno.env.get("META_PHONE_NUMBER_ID_VIALOGISTIC"),
    };
  }
  return {
    key: "VIAINFRA",
    token: Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
    phoneNumberId: Deno.env.get("META_PHONE_NUMBER_ID_VIAINFRA") || "1221458467717278",
  };
}

// Meta WhatsApp Business Calling API — Call Settings
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    let companyId = url.searchParams.get("companyId");

    let body: any = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
      companyId = body.companyId || companyId;
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let company: { id: string; name: string } | null = null;
    if (companyId) {
      const { data } = await admin.from("companies").select("id, name").eq("id", companyId).maybeSingle();
      company = data as any;
    }
    if (!company) {
      const { data } = await admin.from("companies").select("id, name").ilike("name", "%viainfra%").maybeSingle();
      company = data as any;
    }

    const creds = resolveMetaCreds(company?.name || "");
    if (!creds.token) return json({ error: `META_ACCESS_TOKEN_${creds.key} não configurado` }, 500);
    if (!creds.phoneNumberId) return json({ error: `META_PHONE_NUMBER_ID_${creds.key} não configurado` }, 500);

    const base = `https://graph.facebook.com/v21.0/${creds.phoneNumberId}/settings`;

    if (req.method === "GET") {
      const resp = await fetch(base, { headers: { Authorization: `Bearer ${creds.token}` } });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return json({ error: data?.error?.message || `HTTP ${resp.status}`, details: data }, resp.status);
      return json({ success: true, settings: data });
    }

    if (req.method === "POST") {
      if (!body?.calling) return json({ error: "Payload deve conter { calling: {...} }" }, 400);

      const resp = await fetch(base, {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ calling: body.calling }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return json({ error: data?.error?.message || `HTTP ${resp.status}`, details: data }, resp.status);
      return json({ success: true, result: data });
    }

    return json({ error: "Método não suportado" }, 405);
  } catch (e: any) {
    console.error("whatsapp-call-settings error:", e);
    return json({ error: e?.message || "internal" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
