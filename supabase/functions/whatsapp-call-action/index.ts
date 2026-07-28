import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function resolveMetaCreds(companyName: string) {
  const isVialogistic = /vialogistic/i.test(companyName || "");
  if (isVialogistic) {
    return {
      key: "VIALOGISTIC",
      token: Deno.env.get("META_ACCESS_TOKEN_VIALOGISTIC") || Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
      phoneNumberId: Deno.env.get("META_PHONE_NUMBER_ID_VIALOGISTIC") || "1157997970738498",
    };
  }
  return {
    key: "VIAINFRA",
    token: Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
    phoneNumberId: Deno.env.get("META_PHONE_NUMBER_ID_VIAINFRA") || "1221458467717278",
  };
}

const VALID_ACTIONS = new Set(["pre_accept", "accept", "reject", "terminate"]);

// Ações de controle de chamada (desligar, atender, recusar) na Calling API da Meta
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

    const body = await req.json().catch(() => ({}));
    const action: string = (body.action || "").toString();
    const waCallId: string = (body.waCallId || "").toString();
    const callId: string | null = body.callId ?? null;
    const companyId: string | null = body.companyId ?? null;
    const sdp: string | null = body.sdp ? body.sdp.toString() : null;

    if (!VALID_ACTIONS.has(action)) return json({ error: "Ação inválida" }, 400);
    if (!waCallId) return json({ error: "waCallId obrigatório" }, 400);

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
    if (!company) return json({ error: "Empresa não encontrada" }, 404);

    const creds = resolveMetaCreds(company.name);
    if (!creds.token) return json({ error: `META_ACCESS_TOKEN_${creds.key} não configurado` }, 500);

    const payload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      call_id: waCallId,
      action,
    };
    if (sdp && (action === "pre_accept" || action === "accept")) {
      payload.session = { sdp_type: "answer", sdp };
    }

    const resp = await fetch(`https://graph.facebook.com/v21.0/${creds.phoneNumberId}/calls`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json().catch(() => ({}));
    console.log(`📞 call action ${action} ${waCallId}:`, resp.status, JSON.stringify(data));

    if (action === "terminate" || action === "reject") {
      const patch: Record<string, unknown> = {
        status: action === "reject" ? "rejected" : "completed",
        ended_at: new Date().toISOString(),
      };
      if (callId) {
        await admin.from("calls").update(patch).eq("id", callId);
      } else {
        await admin.from("calls").update(patch).eq("wa_call_id", waCallId);
      }
    }

    if (!resp.ok) {
      return json({ error: data?.error?.message || `HTTP ${resp.status}`, details: data }, resp.status);
    }
    return json({ success: true, result: data });
  } catch (e: any) {
    console.error("whatsapp-call-action error:", e);
    return json({ error: e?.message || "internal" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
