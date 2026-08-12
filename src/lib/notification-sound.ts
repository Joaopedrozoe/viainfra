/**
 * Engine de som de notificação compartilhada (singleton de módulo).
 *
 * Motivo: cada `useNotifications()` criava seu próprio <audio> e seu próprio
 * "unlock" de autoplay; quando o componente que recebeu o gesto do usuário era
 * desmontado, o áudio ficava travado pela política de autoplay do navegador e
 * o alerta sonoro simplesmente não tocava.
 *
 * Aqui o unlock é global, persiste entre remounts e usa WebAudio (mais confiável
 * que <audio> em abas em segundo plano), com fallback para <audio> e, em último
 * caso, um bipe sintetizado — assim sempre há som audível.
 */

const SOUND_URL = "/notification.mp3";

let audioCtx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let bufferPromise: Promise<AudioBuffer | null> | null = null;
let unlocked = false;
let listenersAttached = false;
let lastPlayedAt = 0;
let fallbackAudio: HTMLAudioElement | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      audioCtx = null;
    }
  }
  return audioCtx;
};

const loadBuffer = async (): Promise<AudioBuffer | null> => {
  if (buffer) return buffer;
  const ctx = getCtx();
  if (!ctx) return null;
  if (!bufferPromise) {
    bufferPromise = (async () => {
      try {
        const res = await fetch(SOUND_URL, { cache: "force-cache" });
        const arr = await res.arrayBuffer();
        buffer = await ctx.decodeAudioData(arr);
        return buffer;
      } catch {
        return null;
      }
    })();
  }
  return bufferPromise;
};

const getFallbackAudio = () => {
  if (typeof window === "undefined") return null;
  if (!fallbackAudio) {
    fallbackAudio = new Audio(SOUND_URL);
    fallbackAudio.preload = "auto";
    fallbackAudio.volume = 0.7;
  }
  return fallbackAudio;
};

/** Libera o áudio — precisa acontecer dentro de um gesto do usuário. */
export const unlockNotificationSound = () => {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  const audio = getFallbackAudio();
  if (audio) {
    const wasMuted = audio.muted;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = wasMuted;
      })
      .catch(() => {
        audio.muted = wasMuted;
      });
  }
  void loadBuffer();
  unlocked = !!ctx && ctx.state === "running";
};

/** Instala listeners globais de gesto (idempotente). */
export const initNotificationSound = () => {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  const handler = () => {
    unlockNotificationSound();
    if (unlocked) {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("touchstart", handler);
    }
  };

  window.addEventListener("pointerdown", handler);
  window.addEventListener("keydown", handler);
  window.addEventListener("touchstart", handler);

  // Se a aba voltar ao foco com o contexto suspenso, retoma.
  document.addEventListener("visibilitychange", () => {
    const ctx = audioCtx;
    if (ctx && ctx.state === "suspended" && document.visibilityState === "visible") {
      ctx.resume().catch(() => {});
    }
  });
};

export const isNotificationSoundReady = () => {
  const ctx = audioCtx;
  return !!ctx && ctx.state === "running";
};

const beep = () => {
  const ctx = getCtx();
  if (!ctx || ctx.state !== "running") return false;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
    return true;
  } catch {
    return false;
  }
};

/** Toca o alerta sonoro (com debounce de 900ms). */
export const playNotificationSound = (force = false) => {
  const now = Date.now();
  if (!force && now - lastPlayedAt < 900) return;
  lastPlayedAt = now;

  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});

  void (async () => {
    const buf = await loadBuffer();
    if (ctx && ctx.state === "running" && buf) {
      try {
        const src = ctx.createBufferSource();
        const gain = ctx.createGain();
        gain.gain.value = 0.7;
        src.buffer = buf;
        src.connect(gain).connect(ctx.destination);
        src.start();
        return;
      } catch {
        /* segue para fallback */
      }
    }

    const audio = getFallbackAudio();
    if (audio) {
      try {
        audio.currentTime = 0;
        await audio.play();
        return;
      } catch {
        /* segue para o bipe */
      }
    }

    beep();
  })();
};
