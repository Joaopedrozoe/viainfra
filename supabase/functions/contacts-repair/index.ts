import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "phones" | "names" | "merge" | "audit";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action: Action = body.action ?? "audit";
    const companyId: string | null = body.companyId ?? null;
    const dryRun: boolean = body.dryRun !== false;
    const limit: number = Math.min(Number(body.limit ?? 20000), 50000);

    // Caller must be an authenticated admin (unless invoked with the service key)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    const isServiceKey = token === (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "___");

    if (!isServiceKey) {
      const { data: userData } = await admin.auth.getUser(token);
      const uid = userData?.user?.id;
      if (!uid) {
        return json({ error: "Não autenticado" }, 401);
      }
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();
      if (profile?.role !== "admin") {
        return json({ error: "Apenas administradores podem executar esta rotina" }, 403);
      }
    }

    if (action === "audit") {
      const { data, error } = await admin.rpc("contacts_audit_summary", { _company_id: companyId });
      if (error) throw error;
      return json({ audit: data });
    }

    if (action === "phones") {
      const { data, error } = await admin.rpc("repair_contact_phones", {
        _company_id: companyId,
        _dry_run: dryRun,
        _limit: limit,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{ pass: string; proposed_phone: string }>;
      const byPass: Record<string, number> = {};
      for (const r of rows) byPass[r.pass] = (byPass[r.pass] ?? 0) + 1;
      return json({ dryRun, total: rows.length, byPass, sample: rows.slice(0, 25) });
    }

    if (action === "names") {
      const { data, error } = await admin.rpc("repair_contact_names", {
        _company_id: companyId,
        _dry_run: dryRun,
        _limit: limit,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{ source: string }>;
      const bySource: Record<string, number> = {};
      for (const r of rows) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
      return json({ dryRun, total: rows.length, bySource, sample: rows.slice(0, 25) });
    }

    if (action === "merge") {
      const { data, error } = await admin.rpc("merge_duplicate_contacts", {
        _company_id: companyId,
        _dry_run: dryRun,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<{ moved_messages: number; removed_duplicates: number }>;
      return json({
        dryRun,
        pairs: rows.length,
        movedMessages: rows.reduce((a, r) => a + (r.moved_messages ?? 0), 0),
        removedDuplicates: rows.reduce((a, r) => a + (r.removed_duplicates ?? 0), 0),
        sample: rows.slice(0, 25),
      });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    console.error("contacts-repair error:", error);
    return json({ error: String((error as Error)?.message ?? error) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
