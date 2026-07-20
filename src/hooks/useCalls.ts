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
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/initiate-whatsapp-call`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(params),
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok || body?.error) {
    throw new Error(body?.error || `HTTP ${resp.status}`);
  }
  return body;
}
