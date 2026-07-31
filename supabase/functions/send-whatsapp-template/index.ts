import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_TEMPLATE = "aberturadeconversa";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function resolveMetaCreds(companyName: string) {
  const isVialogistic = /vialogistic/i.test(companyName || "");
  if (isVialogistic) {
    return {
      key: "VIALOGISTIC",
      token:
        Deno.env.get("META_ACCESS_TOKEN_VIALOGISTIC") ||
        Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
      phoneNumberId:
        Deno.env.get("META_PHONE_NUMBER_ID_VIALOGISTIC") || "1157997970738498",
    };
  }
  return {
    key: "VIAINFRA",
    token: Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
    phoneNumberId:
      Deno.env.get("META_PHONE_NUMBER_ID_VIAINFRA") || "1221458467717278",
  };
}

function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  return digits;
}

async function sendTemplate(
  token: string,
  phoneNumberId: string,
  to: string,
  templateName: string,
  language: string,
) {
  const resp = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: { name: templateName, language: { code: language } },
      }),
    },
  );
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json().catch(() => ({}));

    // Diagnóstico: lista templates aprovados da WABA da empresa
    if (body?.action === "list") {
      const cname = /vialogistic/i.test(String(body.company || "")) ? "VIALOGISTIC" : "VIAINFRA";
      const c = resolveMetaCreds(cname);
      const out: Record<string, unknown> = { company: c.key };
      const idResp = await fetch(
        `https://graph.facebook.com/v21.0/${c.phoneNumberId}?fields=id,display_phone_number,verified_name,whatsapp_business_account`,
        { headers: { Authorization: `Bearer ${c.token}` } },
      );
      const idData = await idResp.json().catch(() => ({}));
      out.phoneInfo = idData;
      const wabaId = idData?.whatsapp_business_account?.id;
      if (wabaId) {
        const tResp = await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}/message_templates?limit=100&fields=name,language,status,category`,
          { headers: { Authorization: `Bearer ${c.token}` } },
        );
        out.templates = await tResp.json().catch(() => ({}));
      }
      return json(out);
    }
    const {
      conversation_id,
      phone,
      company_id,
      template_name = DEFAULT_TEMPLATE,
      language,
    } = body ?? {};

    let targetPhone: string | null = phone ? normalizePhone(phone) : null;
    let companyId: string | null = company_id ?? null;
    let conversation: any = null;

    if (conversation_id) {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, company_id, channel, contacts(phone, name)")
        .eq("id", conversation_id)
        .maybeSingle();

      if (error || !data) return json({ success: false, error: "Conversa não encontrada" }, 404);
      conversation = data;
      companyId = data.company_id;
      if (!targetPhone && data.contacts?.phone) {
        targetPhone = normalizePhone(data.contacts.phone);
      }
    }

    if (!targetPhone || targetPhone.length < 12) {
      return json({ success: false, error: "Telefone do contato inválido" }, 400);
    }

    let companyName = "";
    if (companyId) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .maybeSingle();
      companyName = company?.name || "";
    }

    const creds = resolveMetaCreds(companyName);
    if (!creds.token) {
      return json(
        { success: false, error: `META_ACCESS_TOKEN_${creds.key} não configurado` },
        500,
      );
    }

    // Tenta os idiomas mais comuns para o template aprovado
    const languages = language ? [language] : ["pt_BR", "pt", "en_US"];
    let result: any = null;
    for (const lang of languages) {
      result = await sendTemplate(
        creds.token,
        creds.phoneNumberId,
        targetPhone,
        template_name,
        lang,
      );
      console.log(
        `[send-template] ${template_name}/${lang} -> ${result.status}`,
        JSON.stringify(result.data).substring(0, 300),
      );
      if (result.ok) {
        result.language = lang;
        break;
      }
      const code = result.data?.error?.code;
      // 132001 = template não existe nesse idioma; segue tentando
      if (code !== 132001 && code !== 132000) break;
    }

    if (!result?.ok) {
      return json(
        {
          success: false,
          error:
            result?.data?.error?.message ||
            "Falha ao enviar template pela Meta",
          details: result?.data?.error || null,
        },
        400,
      );
    }

    const messageId = result.data?.messages?.[0]?.id || null;

    // Registrar no histórico da conversa (aparece no inbox)
    if (conversation_id) {
      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id,
        content: `📨 Template enviado: ${template_name}`,
        sender_type: "agent",
        message_type: "text",
        metadata: {
          template: template_name,
          template_language: result.language,
          external_id: messageId,
          whatsappMessageId: messageId,
          whatsappStatus: "sent",
          whatsappSentAt: new Date().toISOString(),
          isTemplate: true,
        },
      });
      if (insertError) {
        console.error("[send-template] Erro ao registrar mensagem:", insertError);
      }

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation_id);
    }

    return json({
      success: true,
      messageId,
      template: template_name,
      language: result.language,
      to: targetPhone,
      company: creds.key,
    });
  } catch (error) {
    console.error("[send-template] Erro:", error);
    return json({ success: false, error: String(error) }, 500);
  }
});
