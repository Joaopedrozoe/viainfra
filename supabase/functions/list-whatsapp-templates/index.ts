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
      wabaId: Deno.env.get("META_WABA_ID_VIALOGISTIC") || "",
    };
  }
  return {
    key: "VIAINFRA",
    token: Deno.env.get("META_ACCESS_TOKEN_VIAINFRA"),
    phoneNumberId:
      Deno.env.get("META_PHONE_NUMBER_ID_VIAINFRA") || "1221458467717278",
    wabaId: Deno.env.get("META_WABA_ID_VIAINFRA") || "",
  };
}

/** Descobre o WABA ID a partir do token / phone number id. */
async function resolveWabaId(token: string, phoneNumberId: string, hint: string) {
  if (hint) return hint;
  const get = async (url: string) => {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    return await r.json().catch(() => ({}));
  };

  // 1) debug_token expõe os WABAs autorizados (granular_scopes)
  try {
    const d = await get(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}`,
    );
    const scopes = d?.data?.granular_scopes || [];
    for (const s of scopes) {
      if (String(s?.scope || "").includes("whatsapp_business_messag") && s?.target_ids?.length) {
        for (const id of s.target_ids) {
          const check = await get(
            `https://graph.facebook.com/v21.0/${id}/phone_numbers?fields=id&limit=50`,
          );
          if ((check?.data || []).some((p: any) => String(p.id) === String(phoneNumberId))) {
            return String(id);
          }
        }
        return String(s.target_ids[0]);
      }
    }
    for (const s of scopes) {
      if (String(s?.scope || "").includes("whatsapp_business_manage") && s?.target_ids?.length) {
        return String(s.target_ids[0]);
      }
    }
  } catch (_) { /* ignore */ }

  // 2) campo direto no phone number (alguns tokens expõem)
  const direct = await get(
    `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=whatsapp_business_account`,
  );
  if (direct?.whatsapp_business_account?.id) return String(direct.whatsapp_business_account.id);

  // 3) WABAs do usuário/system user do token
  const me = await get(`https://graph.facebook.com/v21.0/me?fields=id`);
  if (me?.id) {
    for (const edge of ["assigned_whatsapp_business_accounts", "owned_whatsapp_business_accounts"]) {
      const wd = await get(`https://graph.facebook.com/v21.0/${me.id}/${edge}?limit=25`);
      const first = wd?.data?.[0]?.id;
      if (first) return String(first);
    }
  }
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json().catch(() => ({}));
    const { company_id, conversation_id, company_name } = body ?? {};

    let companyId: string | null = company_id ?? null;
    if (!companyId && conversation_id) {
      const { data } = await supabase
        .from("conversations")
        .select("company_id")
        .eq("id", conversation_id)
        .maybeSingle();
      companyId = data?.company_id ?? null;
    }

    let name = String(company_name || "");
    if (!name && companyId) {
      const { data } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .maybeSingle();
      name = data?.name || "";
    }

    const creds = resolveMetaCreds(name);
    if (!creds.token) {
      return json({ success: false, error: `META_ACCESS_TOKEN_${creds.key} não configurado` }, 500);
    }

    const wabaId = await resolveWabaId(creds.token, creds.phoneNumberId, creds.wabaId);
    if (!wabaId) {
      const dbg = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(creds.token)}`,
        { headers: { Authorization: `Bearer ${creds.token}` } },
      ).then((r) => r.json()).catch((e) => ({ err: String(e) }));
      const pn = await fetch(
        `https://graph.facebook.com/v21.0/${creds.phoneNumberId}?fields=whatsapp_business_account,display_phone_number`,
        { headers: { Authorization: `Bearer ${creds.token}` } },
      ).then((r) => r.json()).catch((e) => ({ err: String(e) }));
      return json(
        {
          success: false,
          error: "Não foi possível descobrir o WABA ID desta empresa",
          debug: { debug_token: dbg, phone_number: pn },
        },
        400,
      );
    }

    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/message_templates?limit=200&fields=name,language,status,category,components`,
      { headers: { Authorization: `Bearer ${creds.token}` } },
    );
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return json(
        { success: false, error: data?.error?.message || "Falha ao listar templates da Meta" },
        400,
      );
    }

    const allowed = new Set(["APPROVED", "PENDING", "IN_APPEAL", "PENDING_DELETION"]);
    const templates = (data?.data || [])
      .filter((t: any) => allowed.has(String(t.status).toUpperCase()))
      .map((t: any) => {
        const body = (t.components || []).find((c: any) => c.type === "BODY");
        const text: string = body?.text || "";
        const vars = Array.from(new Set((text.match(/\{\{\s*\d+\s*\}\}/g) || [])))
          .map((v: string) => Number(v.replace(/\D/g, "")))
          .sort((a, b) => a - b);
        return {
          name: t.name,
          language: t.language,
          status: String(t.status).toUpperCase(),
          category: t.category,
          body: text,
          variables: vars,
        };
      })
      .sort((a: any, b: any) =>
        a.status === b.status ? a.name.localeCompare(b.name) : a.status === "APPROVED" ? -1 : 1,
      );

    return json({ success: true, company: creds.key, wabaId, templates });
  } catch (error) {
    console.error("[list-templates] Erro:", error);
    return json({ success: false, error: String(error) }, 500);
  }
});
