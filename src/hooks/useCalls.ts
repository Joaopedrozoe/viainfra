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
  answered_by: string | null;
  answered_by_name: string | null;
  ring_deadline: string | null;
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

async function callFunction(name: string, params: Record<string, unknown>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada. Faça login novamente.");
  const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${name}`;
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

export async function initiateCall(params: {
  phone: string;
  sdp: string;
  contactId?: string;
  conversationId?: string;
  callType?: "voice" | "video";
  companyId?: string;
}) {
  return callFunction("initiate-whatsapp-call", params);
}

export async function terminateCall(params: { waCallId: string; callId?: string; companyId?: string }) {
  return callFunction("whatsapp-call-action", { ...params, action: "terminate" });
}

export async function preAcceptCall(params: { waCallId: string; sdp: string; callId?: string; companyId?: string }) {
  return callFunction("whatsapp-call-action", { ...params, action: "pre_accept" });
}

export async function acceptCall(params: { waCallId: string; sdp: string; callId?: string; companyId?: string }) {
  return callFunction("whatsapp-call-action", { ...params, action: "accept" });
}

export async function rejectCall(params: { waCallId: string; callId?: string; companyId?: string }) {
  return callFunction("whatsapp-call-action", { ...params, action: "reject" });
}

export interface ClaimCallResult {
  ok: boolean;
  reason?: "already_claimed" | "not_ringing" | "not_found" | "forbidden";
  answered_by?: string;
  answered_by_name?: string;
}

/** Reivindica uma chamada tocando para o usuário atual (atender ou recusar), de forma atômica. */
export async function claimCall(callId: string, action: "accept" | "reject"): Promise<ClaimCallResult> {
  const { data, error } = await supabase.rpc("claim_call", { _call_id: callId, _action: action });
  if (error) throw error;
  return data as unknown as ClaimCallResult;
}


