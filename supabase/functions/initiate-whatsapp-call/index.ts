import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Meta Cloud API — WhatsApp Business Calling API
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/calling
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
    const rawPhone: string = (body.phone || "").toString().replace(/\D/g, "");
    const contactId: string | null = body.contactId ?? null;
    const conversationId: string | null = body.conversationId ?? null;
    const callType: "voice" | "video" = body.callType === "video" ? "video" : "voice";
    if (!rawPhone || rawPhone.length < 10) return json({ error: "Telefone inválido" }, 400);

    // Normalize BR
    let phone = rawPhone;
    if (phone.length <= 11) phone = `55${phone}`;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: company } = await admin.from("companies").select("id, name").ilike("name", "%viainfra%").maybeSingle();
    if (!company) return json({ error: "Empresa VIAINFRA não encontrada" }, 404);

    const token = Deno.env.get("META_ACCESS_TOKEN_VIAINFRA");
    const phoneNumberId = Deno.env.get("META_PHONE_NUMBER_ID_VIAINFRA") || "1221458467717278";
    if (!token) {
      return json({
        error: "META_ACCESS_TOKEN_VIAINFRA não configurado. Salve o token permanente da Meta (System User) nos secrets.",
      }, 500);
    }

    // POST /{PHONE_NUMBER_ID}/calls
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/calls`;
    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      action: "connect",
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const respData = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const errMsg = respData?.error?.message || `HTTP ${resp.status}`;
      // Persist a failed record for visibility
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
      return json({ error: errMsg, details: respData }, resp.status);
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
