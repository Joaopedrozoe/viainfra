import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { acceptCall, preAcceptCall, rejectCall, terminateCall } from "@/hooks/useCalls";
import { WhatsAppCallSession, describeMicError } from "@/lib/whatsapp-call-webrtc";
import type { IncomingCall } from "@/hooks/useIncomingCalls";

interface IncomingCallDialogProps {
  call: IncomingCall;
  onDismiss: () => void;
}

type Phase = "ringing" | "accepting" | "connected" | "ended";

function fmt(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export const IncomingCallDialog = ({ call, onDismiss }: IncomingCallDialogProps) => {
  const { company } = useAuth();
  const [phase, setPhase] = useState<Phase>("ringing");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const sessionRef = useRef<WhatsAppCallSession | null>(null);

  const label = call.contactName || call.phone;

  // Cronômetro
  useEffect(() => {
    if (phase !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Toque simples (WebAudio, sem depender de arquivo de áudio)
  useEffect(() => {
    if (phase !== "ringing") return;
    let ctx: AudioContext | null = null;
    let stopped = false;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    } catch {
      return;
    }
    const beep = () => {
      if (!ctx || stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 480;
      gain.gain.value = 0.06;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    };
    beep();
    const t = setInterval(beep, 2000);
    return () => {
      stopped = true;
      clearInterval(t);
      ctx?.close().catch(() => { /* noop */ });
    };
  }, [phase]);

  // Encerramento pelo outro lado
  useEffect(() => {
    if (["completed", "missed", "no_answer", "rejected", "failed"].includes(call.status)) {
      sessionRef.current?.close();
      sessionRef.current = null;
      setPhase("ended");
      const t = setTimeout(onDismiss, 1200);
      return () => clearTimeout(t);
    }
    if (call.status === "connected" && phase === "accepting") setPhase("connected");
  }, [call.status, phase, onDismiss]);

  const handleAccept = async () => {
    if (!call.offerSdp) {
      toast.error("Chamada sem dados de áudio da Meta. Não é possível atender.");
      return;
    }
    setPhase("accepting");
    const session = new WhatsAppCallSession();
    sessionRef.current = session;
    session.onConnectionStateChange = (state) => {
      if (state === "connected") setPhase((p) => (p === "ended" ? p : "connected"));
      if (state === "failed" || state === "closed") setPhase((p) => (p === "connected" ? "ended" : p));
    };

    let answer: string;
    try {
      answer = await session.createAnswer(call.offerSdp);
    } catch (e) {
      toast.error(describeMicError(e));
      session.close();
      sessionRef.current = null;
      setPhase("ringing");
      return;
    }

    try {
      await preAcceptCall({ waCallId: call.waCallId, sdp: answer, callId: call.id, companyId: company?.id });
    } catch {
      /* pre_accept é opcional; segue para accept */
    }

    try {
      await acceptCall({ waCallId: call.waCallId, sdp: answer, callId: call.id, companyId: company?.id });
      setPhase("connected");
    } catch (e) {
      toast.error((e as Error)?.message || "Não foi possível atender a chamada.");
      session.close();
      sessionRef.current = null;
      setPhase("ringing");
    }
  };

  const handleReject = async () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setPhase("ended");
    try {
      await rejectCall({ waCallId: call.waCallId, callId: call.id, companyId: company?.id });
    } catch {
      /* já pode ter encerrado */
    }
    onDismiss();
  };

  const handleHangup = async () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setPhase("ended");
    try {
      await terminateCall({ waCallId: call.waCallId, callId: call.id, companyId: company?.id });
    } catch {
      /* noop */
    }
    onDismiss();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sessionRef.current?.setMuted(next);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { if (phase === "connected") handleHangup(); else handleReject(); } }}>
      <DialogContent className="sm:max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="h-20 w-20 shadow-lg">
            <AvatarFallback className="text-2xl">{label.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{label}</h2>
            <p className="text-sm text-muted-foreground">
              {phase === "ringing" && "Chamada recebida no WhatsApp"}
              {phase === "accepting" && "Conectando áudio..."}
              {phase === "connected" && `Em chamada · ${fmt(seconds)}`}
              {phase === "ended" && "Chamada encerrada"}
            </p>
          </div>

          {phase === "ringing" && (
            <div className="flex items-center gap-4 pt-2">
              <Button variant="destructive" size="lg" className="rounded-full h-14 w-14 p-0" onClick={handleReject} aria-label="Recusar">
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button size="lg" className="rounded-full h-14 w-14 p-0 bg-green-600 hover:bg-green-700" onClick={handleAccept} aria-label="Atender">
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          )}

          {phase === "accepting" && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}

          {phase === "connected" && (
            <div className="flex items-center gap-4 pt-2">
              <Button variant="outline" size="lg" className="rounded-full h-14 w-14 p-0" onClick={toggleMute} aria-label={muted ? "Ativar microfone" : "Silenciar microfone"}>
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <Button variant="destructive" size="lg" className="rounded-full h-14 w-14 p-0" onClick={handleHangup} aria-label="Encerrar">
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
