import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { initiateCall, terminateCall } from "@/hooks/useCalls";
import { WhatsAppCallSession, describeMicError } from "@/lib/whatsapp-call-webrtc";

type Phase = "preparing" | "ringing" | "connected" | "ended";

interface ActiveCallDialogProps {
  open: boolean;
  phone: string;
  contactName?: string | null;
  contactId?: string | null;
  conversationId?: string | null;
  onClose: () => void;
}

const PHASE_LABEL: Record<Phase, string> = {
  preparing: "Preparando áudio...",
  ringing: "Chamando...",
  connected: "Em chamada",
  ended: "Chamada encerrada",
};

export const ActiveCallDialog = ({
  open,
  phone,
  contactName,
  contactId,
  conversationId,
  onClose,
}: ActiveCallDialogProps) => {
  const { company } = useAuth();
  const [phase, setPhase] = useState<Phase>("preparing");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sessionRef = useRef<WhatsAppCallSession | null>(null);
  const callIdRef = useRef<string | null>(null);
  const waCallIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  // Cronômetro
  useEffect(() => {
    if (phase !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const cleanup = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
  };

  const hangup = async (silent = false) => {
    const waCallId = waCallIdRef.current;
    cleanup();
    setPhase("ended");
    if (waCallId) {
      try {
        await terminateCall({ waCallId, callId: callIdRef.current ?? undefined, companyId: company?.id });
      } catch {
        /* a chamada já pode ter sido encerrada do outro lado */
      }
    }
    if (!silent) onClose();
  };

  // Inicia a chamada quando o diálogo abre
  useEffect(() => {
    if (!open || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      const session = new WhatsAppCallSession();
      sessionRef.current = session;

      let sdp: string;
      try {
        sdp = await session.createOffer();
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(describeMicError(e));
        setPhase("ended");
        return;
      }

      session.onConnectionStateChange = (state) => {
        if (cancelled) return;
        if (state === "connected") setPhase((p) => (p === "ended" ? p : "connected"));
        if (state === "failed" || state === "disconnected" || state === "closed") {
          setPhase((p) => (p === "connected" ? "ended" : p));
        }
      };

      try {
        const result = await initiateCall({
          phone,
          sdp,
          contactId: contactId ?? undefined,
          conversationId: conversationId ?? undefined,
          callType: "voice",
          companyId: company?.id,
        });
        if (cancelled) return;
        callIdRef.current = result?.call?.id ?? null;
        waCallIdRef.current = result?.call?.wa_call_id ?? result?.meta?.calls?.[0]?.id ?? null;
        setPhase("ringing");
      } catch (e: unknown) {
        if (cancelled) return;
        cleanup();
        setErrorMsg((e as Error)?.message || "Falha ao iniciar ligação");
        setPhase("ended");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, phone, contactId, conversationId, company?.id]);

  // Recebe a resposta SDP (answer) e o status via Realtime na tabela calls
  useEffect(() => {
    if (!open || !company?.id) return;
    const channel = supabase
      .channel(`active-call-${company.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls", filter: `company_id=eq.${company.id}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            wa_call_id: string | null;
            status: string;
            metadata: Record<string, unknown> | null;
          };
          if (callIdRef.current && row.id !== callIdRef.current) return;
          if (!callIdRef.current && waCallIdRef.current && row.wa_call_id !== waCallIdRef.current) return;

          const answerSdp = row.metadata?.answer_sdp as string | undefined;
          if (answerSdp) {
            sessionRef.current?.applyAnswer(answerSdp).catch((e) => console.error("applyAnswer", e));
          }
          if (row.status === "connected") setPhase("connected");
          if (["completed", "missed", "no_answer", "rejected", "failed"].includes(row.status)) {
            cleanup();
            setPhase("ended");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, company?.id]);

  // Encerra tudo ao desmontar
  useEffect(() => () => cleanup(), []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sessionRef.current?.setMuted(next);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const displayName = contactName?.trim() || phone;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          if (phase === "ringing" || phase === "connected") hangup(true);
          cleanup();
          startedRef.current = false;
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
              {(phase === "preparing" || phase === "ringing") && <Loader2 className="h-3 w-3 animate-spin" />}
              {phase === "connected" ? mmss : PHASE_LABEL[phase]}
            </p>
          </div>

          {errorMsg && (
            <p className="text-sm text-destructive text-center px-2">{errorMsg}</p>
          )}

          <div className="flex items-center gap-4 mt-2">
            {phase !== "ended" && (
              <Button
                variant={muted ? "default" : "outline"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleMute}
                title={muted ? "Ativar microfone" : "Silenciar microfone"}
              >
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}

            {phase === "ended" ? (
              <Button className="rounded-full px-6" onClick={onClose}>
                Fechar
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={() => hangup()}
                title="Desligar"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            )}
          </div>

          {phase === "ringing" && (
            <p className="text-xs text-muted-foreground text-center px-4">
              O áudio conecta assim que o contato atender no WhatsApp.
            </p>
          )}
          {phase === "preparing" && (
            <p className="text-xs text-muted-foreground text-center px-4 flex items-center gap-1">
              <Phone className="h-3 w-3" /> Autorize o microfone para prosseguir.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
