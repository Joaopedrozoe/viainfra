import { useCallback, useEffect, useRef, useState } from "react";
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
  answeredBy: string | null;
  ringDeadline: string | null;
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
    answeredBy: row.answered_by ?? null,
    ringDeadline: row.ring_deadline ?? null,
  };
}

/**
 * Escuta chamadas entrantes da empresa ativa em tempo real.
 * Retorna apenas a chamada corrente (toque ou em andamento).
 * Sincroniza entre agentes: some da tela se outro agente atender/recusar.
 */
export function useIncomingCalls() {
  const { company, user } = useAuth();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const callRef = useRef<IncomingCall | null>(null);
  callRef.current = call;

  const dismiss = useCallback(() => setCall(null), []);

  const applyIncoming = useCallback((incoming: IncomingCall | null) => {
    if (!incoming) return;
    setCall((current) => {
      if (current && current.waCallId !== incoming.waCallId) return current;

      // Se um outro agente já reivindicou a chamada, tira o diálogo da tela.
      if (incoming.answeredBy && incoming.answeredBy !== user?.id) {
        return null;
      }

      // Passou do prazo de toque sem resposta: esconde.
      if (incoming.ringDeadline && incoming.status === "ringing" && new Date(incoming.ringDeadline).getTime() < Date.now()) {
        return null;
      }

      if (CLOSED_STATUSES.includes(incoming.status)) {
        return current ? { ...current, status: incoming.status } : null;
      }
      if (!ACTIVE_STATUSES.includes(incoming.status)) return current;
      // só abre o diálogo quando há oferta SDP para responder
      if (!current && !incoming.offerSdp) return current;
      return { ...(current || incoming), ...incoming, offerSdp: incoming.offerSdp || current?.offerSdp || null };
    });
  }, [user?.id]);

  const fetchRinging = useCallback(async () => {
    if (!company?.id) return;
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
    if (!data) return;
    const incoming = toIncoming(data as Record<string, any>);
    if (!incoming) return;
    if (incoming.answeredBy && incoming.answeredBy !== user?.id) return;
    if (incoming.ringDeadline && new Date(incoming.ringDeadline).getTime() < Date.now()) return;
    if (incoming.offerSdp) setCall((current) => current || incoming);
  }, [company?.id, user?.id]);

  // Chamada já em toque quando o app abre (últimos 60s)
  useEffect(() => {
    if (!company?.id) { setCall(null); return; }
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchRinging();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // Vencimento local do prazo de toque
  useEffect(() => {
    if (!call?.ringDeadline || call.status !== "ringing") return;
    const ms = new Date(call.ringDeadline).getTime() - Date.now();
    if (ms <= 0) { setCall(null); return; }
    const t = setTimeout(() => {
      setCall((current) => (current && current.status === "ringing" ? null : current));
    }, ms);
    return () => clearTimeout(t);
  }, [call?.ringDeadline, call?.status]);

  useEffect(() => {
    if (!company?.id) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = () => {
      if (channel) supabase.removeChannel(channel);
      channel = supabase
        .channel(`incoming-calls-${company.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "calls", filter: `company_id=eq.${company.id}` },
          (payload) => {
            const row = payload.new as Record<string, any> | null;
            if (!row) return;
            const incoming = toIncoming(row);
            applyIncoming(incoming);
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            setTimeout(() => { subscribe(); fetchRinging(); }, 1500);
          }
        });
    };

    subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        subscribe();
        fetchRinging();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, applyIncoming, fetchRinging]);

  return { incomingCall: call, dismissIncomingCall: dismiss };
}
