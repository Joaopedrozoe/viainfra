import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export interface CallRow {
  id: string;
  company_id: string;
  contact_id: string | null;
  conversation_id: string | null;
  wa_call_id: string | null;
  phone: string;
  contact_name: string | null;
  direction: "incoming" | "outgoing";
  status: string;
  call_type: "voice" | "video";
  duration: number;
  started_at: string;
  connected_at: string | null;
  ended_at: string | null;
  error: string | null;
  metadata: any;
}

export function useCalls() {
  const { company } = useAuth();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("calls")
      .select("*")
      .eq("company_id", company.id)
      .order("started_at", { ascending: false })
      .limit(200);
    setCalls((data as CallRow[]) || []);
    setLoading(false);
  }, [company?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!company?.id) return;
    const ch = supabase
      .channel(`calls-${company.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "calls", filter: `company_id=eq.${company.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [company?.id, load]);

  const stats = {
    incoming: calls.filter(c => c.direction === "incoming" && c.status !== "missed").length,
    outgoing: calls.filter(c => c.direction === "outgoing" && c.status !== "missed" && c.status !== "no_answer").length,
    missed: calls.filter(c => c.status === "missed" || c.status === "no_answer").length,
  };

  return { calls, loading, stats, reload: load };
}

export async function initiateCall(params: { phone: string; contactId?: string; conversationId?: string; callType?: "voice" | "video" }) {
  const { data, error } = await supabase.functions.invoke("initiate-whatsapp-call", { body: params });
  const payload = (data as any) || {};
  if (payload?.error) throw new Error(payload.error);
  if (error) {
    // Try to extract underlying edge error body
    const ctx: any = (error as any).context;
    try {
      const body = ctx?.body ? await new Response(ctx.body).json() : null;
      if (body?.error) throw new Error(body.error);
    } catch (_) { /* ignore */ }
    throw error;
  }
  return data;
}
