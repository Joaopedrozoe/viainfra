/**
 * Camada WebRTC para a WhatsApp Business Calling API (Meta Cloud).
 *
 * A Meta exige, para chamadas iniciadas pela empresa (action: "connect"),
 * um objeto `session` com uma oferta SDP (RFC 8866) gerada pelo dispositivo
 * que vai falar — aqui, o navegador do atendente. A resposta SDP volta pelo
 * webhook e precisa ser aplicada com setRemoteDescription.
 */

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export class WhatsAppCallSession {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private closed = false;

  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  /**
   * Captura o microfone, cria a oferta e espera o ICE gathering completar.
   * A Meta não suporta trickle ICE: o SDP precisa já conter os candidatos.
   */
  async createOffer(): Promise<string> {
    const pc = await this.setup();

    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    await this.waitForIceGathering(pc);

    return pc.localDescription?.sdp || offer.sdp || "";
  }

  /**
   * Chamada entrante: aplica a oferta SDP do cliente e devolve a resposta
   * SDP (com candidatos ICE já coletados) para enviar em pre_accept/accept.
   */
  async createAnswer(offerSdp: string): Promise<string> {
    const pc = await this.setup();

    await pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await this.waitForIceGathering(pc);

    return pc.localDescription?.sdp || answer.sdp || "";
  }

  private async setup(): Promise<RTCPeerConnection> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;

    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream);
    }

    // Áudio remoto
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.style.display = "none";
    document.body.appendChild(audio);
    this.audioEl = audio;

    pc.ontrack = (ev) => {
      if (this.audioEl && ev.streams[0]) {
        this.audioEl.srcObject = ev.streams[0];
        this.audioEl.play().catch(() => {/* autoplay bloqueado */});
      }
    };

    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(pc.connectionState);
    };

    return pc;
  }


  private waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 3000): Promise<void> {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        pc.removeEventListener("icegatheringstatechange", check);
        clearTimeout(timer);
        resolve();
      };
      const check = () => {
        if (pc.iceGatheringState === "complete") done();
      };
      const timer = setTimeout(done, timeoutMs);
      pc.addEventListener("icegatheringstatechange", check);
    });
  }

  /** Aplica a resposta SDP devolvida pela Meta (via webhook). */
  async applyAnswer(sdp: string): Promise<void> {
    if (!this.pc || this.closed) return;
    if (this.pc.currentRemoteDescription) return; // já aplicada
    await this.pc.setRemoteDescription({ type: "answer", sdp });
  }

  setMuted(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => { t.enabled = !muted; });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try { this.pc?.getSenders().forEach((s) => s.track?.stop()); } catch { /* noop */ }
    try { this.localStream?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
    try { this.pc?.close(); } catch { /* noop */ }
    if (this.audioEl) {
      this.audioEl.srcObject = null;
      this.audioEl.remove();
      this.audioEl = null;
    }
    this.pc = null;
    this.localStream = null;
  }
}

export function describeMicError(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Permissão de microfone negada. Libere o microfone nas configurações do navegador para poder ligar.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Nenhum microfone encontrado neste dispositivo.";
  }
  if (name === "NotReadableError") {
    return "O microfone está em uso por outro aplicativo.";
  }
  return (e as Error)?.message || "Não foi possível acessar o microfone.";
}
