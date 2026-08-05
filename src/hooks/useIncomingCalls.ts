import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export interface IncomingCall {
  id: string;
  waCallId: string;
  phone: string;
  contactName: string | null;
  status: string;
  offerSdp: string | null;
  conversationId: string | null;
}

const ACTIVE_STATUSES = ["ringing", "connected", "permission_pending"];
const CLOSED_STATUSES = ["completed", "missed", "no_answer", "rejected", "failed"];

function toIncoming(row: Record<string, any>): IncomingCall | null {
  if (row.direction !== "incoming") return null;
  if (!row.wa_call_id) return null;
  const meta = (row.metadata || {}) as Record<string, unknown>;
  return {
    id: row.id,
    waCallId: row.wa_call_id,
    phone: row.phone,
    contactName: row.contact_name ?? null,
    status: row.status,
    offerSdp: (meta.offer_sdp as string | undefined) ?? null,
    conversationId: row.conversation_id ?? null,
  };
}

/**
 * Escuta chamadas entrantes da empresa ativa em tempo real.
 * Retorna apenas a chamada corrente (toque ou em andamento).
 */
export function useIncomingCalls() {
  const { company } = useAuth();
  const [call, setCall] = useState<IncomingCall | null>(null);

  const dismiss = useCallback(() => setCall(null), []);

  // Chamada já em toque quando o app abre (últimos 60s)
  useEffect(() => {
    if (!company?.id) { setCall(null); return; }
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { data } = await supabase
        .from("calls")
        .select("*")
        .eq("company_id", company.id)
        .eq("direction", "incoming")
        .eq("status", "ringing")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      const incoming = toIncoming(data as Record<string, any>);
      if (incoming?.offerSdp) setCall(incoming);
    })();
    return () => { cancelled = true; };
  }, [company?.id]);

  useEffect(() => {
    if (!company?.id) return;
    const channel = supabase
      .channel(`incoming-calls-${company.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calls", filter: `company_id=eq.${company.id}` },
        (payload) => {
          const row = payload.new as Record<string, any> | null;
          if (!row) return;
          const incoming = toIncoming(row);
          if (!incoming) return;

          setCall((current) => {
            if (current && current.waCallId !== incoming.waCallId) return current;
            if (CLOSED_STATUSES.includes(incoming.status)) {
              return current ? { ...current, status: incoming.status } : null;
            }
            if (!ACTIVE_STATUSES.includes(incoming.status)) return current;
            // só abre o diálogo quando há oferta SDP para responder
            if (!current && !incoming.offerSdp) return current;
            return { ...(current || incoming), ...incoming, offerSdp: incoming.offerSdp || current?.offerSdp || null };
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [company?.id]);

  return { incomingCall: call, dismissIncomingCall: dismiss };
}
