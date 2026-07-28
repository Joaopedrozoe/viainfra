import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Resolve credenciais Meta por empresa (VIAINFRA / VIALOGISTIC)
export function resolveMetaCreds(companyName: string) {
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

// Erros da Meta que indicam falta de permissão de ligação do usuário
function isPermissionError(respData: any): boolean {
  const code = respData?.error?.code;
  const sub = respData?.error?.error_subcode;
  const msg = `${respData?.error?.message || ""} ${respData?.error?.error_data?.details || ""}`.toLowerCase();
  return code === 138007 || code === 138010 || sub === 2494100 || msg.includes("permission");
}

async function sendCallPermissionRequest(token: string, phoneNumberId: string, to: string) {
  try {
    const resp = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "call_permission_request",
          action: { name: "call_permission_request" },
        },
      }),
    });
    const data = await resp.json().catch(() => ({}));
    console.log("Call permission request:", resp.status, JSON.stringify(data));
    return resp.ok;
  } catch (e) {
    console.error("Falha ao enviar pedido de permissão:", e);
    return false;
  }
}

// Meta Cloud API — WhatsApp Business Calling API
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log("📞 initiate-whatsapp-call invoked");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized: sessão inválida" }, 401);

    const body = await req.json().catch(() => ({}));
    const rawPhone: string = (body.phone || "").toString().replace(/\D/g, "");
    const contactId: string | null = body.contactId ?? null;
    const conversationId: string | null = body.conversationId ?? null;
    const companyId: string | null = body.companyId ?? null;
    const callType: "voice" | "video" = body.callType === "video" ? "video" : "voice";
    const sdp: string = (body.sdp || "").toString();
    if (!rawPhone || rawPhone.length < 10) return json({ error: "Telefone inválido" }, 400);
    if (!sdp || !sdp.startsWith("v=")) {
      return json({ error: "Sessão de áudio ausente. A ligação precisa ser iniciada pelo discador do app (WebRTC)." }, 400);
    }

    let phone = rawPhone;
    if (phone.length <= 11) phone = `55${phone}`;

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
    if (!creds.token) {
      return json({ error: `META_ACCESS_TOKEN_${creds.key} não configurado nos secrets.` }, 500);
    }
    if (!creds.phoneNumberId) {
      return json({ error: `META_PHONE_NUMBER_ID_${creds.key} não configurado nos secrets.` }, 500);
    }

    const url = `https://graph.facebook.com/v21.0/${creds.phoneNumberId}/calls`;
    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      action: "connect",
      session: { sdp_type: "offer", sdp },
    };
    console.log("Calling Meta:", creds.key, url, "to:", phone, "sdp bytes:", sdp.length);
    const resp = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const respData = await resp.json().catch(() => ({}));
    console.log("Meta response:", resp.status, JSON.stringify(respData));

    if (!resp.ok) {
      let errMsg = respData?.error?.message || `HTTP ${resp.status}`;
      const details = respData?.error?.error_data?.details;
      if (details) errMsg = `${errMsg} — ${details}`;

      let permissionRequested = false;
      if (isPermissionError(respData)) {
        permissionRequested = await sendCallPermissionRequest(creds.token, creds.phoneNumberId, phone);
        errMsg = permissionRequested
          ? "O contato ainda não autorizou ligações. Enviamos o pedido de permissão no WhatsApp — tente novamente após a autorização."
          : "O contato ainda não autorizou ligações e não foi possível enviar o pedido de permissão.";
      }

      await admin.from("calls").insert({
        company_id: company.id,
        contact_id: contactId,
        conversation_id: conversationId,
        agent_id: user.id,
        phone,
        direction: "outgoing",
        status: "failed",
        call_type: callType,
        error: errMsg,
        metadata: respData,
      });
      return json({ error: errMsg, permissionRequested, details: respData }, resp.status);
    }

    const waCallId: string | undefined = respData?.calls?.[0]?.id || respData?.id;

    const { data: inserted } = await admin.from("calls").insert({
      company_id: company.id,
      contact_id: contactId,
      conversation_id: conversationId,
      agent_id: user.id,
      wa_call_id: waCallId ?? null,
      phone,
      direction: "outgoing",
      status: "ringing",
      call_type: callType,
      metadata: respData,
    }).select().single();

    return json({ success: true, call: inserted, meta: respData });
  } catch (e: any) {
    console.error("initiate-whatsapp-call error:", e);
    return json({ error: e?.message || "internal" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
