/**
 * Regras oficiais de mídia da WhatsApp Cloud API (Meta).
 * Fonte: limites e mime-types suportados pela API oficial.
 * Centralizado aqui para que inbox, importação e qualquer outro ponto
 * usem exatamente a mesma validação (evita divergência e erros na Meta).
 */

export type WhatsAppMediaKind = "image" | "video" | "audio" | "document" | "sticker";

const MB = 1024 * 1024;

export const WHATSAPP_MEDIA_RULES: Record<
  WhatsAppMediaKind,
  { maxSize: number; mimeTypes: string[]; label: string }
> = {
  image: {
    label: "Imagem",
    maxSize: 5 * MB,
    mimeTypes: ["image/jpeg", "image/jpg", "image/png"],
  },
  sticker: {
    label: "Sticker",
    maxSize: 500 * 1024,
    mimeTypes: ["image/webp"],
  },
  video: {
    label: "Vídeo",
    maxSize: 16 * MB,
    mimeTypes: ["video/mp4", "video/3gp", "video/3gpp"],
  },
  audio: {
    label: "Áudio",
    maxSize: 16 * MB,
    mimeTypes: [
      "audio/aac",
      "audio/mp4",
      "audio/mpeg",
      "audio/amr",
      "audio/ogg",
      "audio/opus",
      "audio/wav",
      "audio/x-wav",
      "audio/webm",
    ],
  },
  document: {
    label: "Documento",
    maxSize: 100 * MB,
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ],
  },
};

/** Atributo accept do input de arquivo, derivado das regras oficiais. */
export const WHATSAPP_ACCEPT_ATTRIBUTE = [
  ...WHATSAPP_MEDIA_RULES.image.mimeTypes,
  ...WHATSAPP_MEDIA_RULES.sticker.mimeTypes,
  ...WHATSAPP_MEDIA_RULES.video.mimeTypes,
  ...WHATSAPP_MEDIA_RULES.audio.mimeTypes,
  ...WHATSAPP_MEDIA_RULES.document.mimeTypes,
].join(",");

const EXTENSION_FALLBACK: Record<string, WhatsAppMediaKind> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "sticker",
  mp4: "video",
  "3gp": "video",
  mp3: "audio",
  m4a: "audio",
  aac: "audio",
  amr: "audio",
  ogg: "audio",
  opus: "audio",
  wav: "audio",
  pdf: "document",
  doc: "document",
  docx: "document",
  xls: "document",
  xlsx: "document",
  ppt: "document",
  pptx: "document",
  txt: "document",
  csv: "document",
};

function inferKind(file: File): WhatsAppMediaKind | null {
  const mime = (file.type || "").toLowerCase();
  if (mime) {
    for (const kind of Object.keys(WHATSAPP_MEDIA_RULES) as WhatsAppMediaKind[]) {
      if (WHATSAPP_MEDIA_RULES[kind].mimeTypes.includes(mime)) return kind;
    }
    // Tipos genéricos da família não listados explicitamente pela Meta
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXTENSION_FALLBACK[ext]) return EXTENSION_FALLBACK[ext];
  return null;
}

export interface MediaValidationResult {
  ok: boolean;
  kind: WhatsAppMediaKind;
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes >= MB) return `${Math.round(bytes / MB)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}

/**
 * Classifica e valida um arquivo para envio pela API oficial.
 * Arquivos de tipo desconhecido são tratados como documento (permitido pela Meta).
 */
export function validateWhatsAppFile(file: File): MediaValidationResult {
  const inferred = inferKind(file);
  const kind: WhatsAppMediaKind = inferred ?? "document";
  const rule = WHATSAPP_MEDIA_RULES[kind];

  if (file.size === 0) {
    return { ok: false, kind, error: "Arquivo vazio." };
  }

  if (file.size > rule.maxSize) {
    return {
      ok: false,
      kind,
      error: `${rule.label} excede o limite da API oficial do WhatsApp (${formatSize(rule.maxSize)}).`,
    };
  }

  return { ok: true, kind };
}

/** Tipo de anexo usado pelo app (sticker é enviado como sticker na API oficial). */
export function getWhatsAppAttachmentType(file: File): WhatsAppMediaKind {
  return validateWhatsAppFile(file).kind;
}
