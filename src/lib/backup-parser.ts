/**
 * Parser do backup de conversas em HTML.
 *
 * Cada conversa exportada é uma pasta contendo:
 *  - um arquivo .html com `window.CHAT_MESSAGES_HTML = [...]`
 *  - style.css / script.js (ignorados)
 *  - uma subpasta com as mídias referenciadas pelas mensagens
 */

export type BackupMediaType = "image" | "video" | "audio" | "document";

export interface ParsedBackupMessage {
  /** data-stanza-id — id da mensagem no WhatsApp (chave de deduplicação) */
  stanzaId: string | null;
  fromMe: boolean;
  content: string;
  /** ISO string; null quando não foi possível determinar data/hora */
  timestamp: string | null;
  senderName?: string;
  quotedContent?: string;
  quotedSender?: string;
  /** caminho relativo do arquivo de mídia dentro da pasta da conversa */
  mediaPath?: string;
  mediaType?: BackupMediaType;
  mediaFilename?: string;
}

export interface ParsedBackupChat {
  /** nome da pasta (usado como nome da conversa/contato) */
  folderName: string;
  /** título extraído do <title> do HTML, quando disponível */
  htmlTitle?: string;
  messages: ParsedBackupMessage[];
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  mediaCount: number;
  withoutStanzaId: number;
  /** telefone detectado no nome da pasta / título, se houver */
  phone?: string;
  isGroup: boolean;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|svg)$/i;
const VIDEO_EXT = /\.(mp4|mov|3gp|mkv|avi|webm)$/i;
const AUDIO_EXT = /\.(ogg|opus|mp3|m4a|aac|wav|amr)$/i;

export function mediaTypeFromPath(path: string): BackupMediaType {
  if (IMAGE_EXT.test(path)) return "image";
  if (VIDEO_EXT.test(path)) return "video";
  if (AUDIO_EXT.test(path)) return "audio";
  return "document";
}

/** Extrai o array window.CHAT_MESSAGES_HTML do HTML exportado. */
export function extractMessagesArray(html: string): string[] {
  const marker = "window.CHAT_MESSAGES_HTML";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return [];

  const start = html.indexOf("[", markerIdx);
  if (start === -1) return [];

  // varredura respeitando strings e escapes para achar o ] correspondente
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "[") {
      depth++;
    } else if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) return [];

  const raw = html.slice(start, end + 1);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!match) return undefined;
  return match[1].replace(/\s*-\s*Historial de conversas\s*$/i, "").trim() || undefined;
}

function parseDateDivider(text: string): { y: number; m: number; d: number } | null {
  // formatos: 2026/5/22 ou 22/05/2026
  const slash = text.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (slash) {
    return { y: Number(slash[1]), m: Number(slash[2]), d: Number(slash[3]) };
  }
  const br = text.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (br) {
    return { y: Number(br[3]), m: Number(br[2]), d: Number(br[1]) };
  }
  return null;
}

function buildTimestamp(
  date: { y: number; m: number; d: number } | null,
  time: string | null,
): string | null {
  if (!date) return null;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (time) {
    const parts = time.trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (parts) {
      hours = Number(parts[1]);
      minutes = Number(parts[2]);
      seconds = parts[3] ? Number(parts[3]) : 0;
      if (/pm/i.test(time) && hours < 12) hours += 12;
      if (/am/i.test(time) && hours === 12) hours = 0;
    }
  }
  const dt = new Date(date.y, date.m - 1, date.d, hours, minutes, seconds);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
}

function findMedia(row: Element): { path: string; type: BackupMediaType } | null {
  const candidates: Array<{ el: Element | null; attr: string }> = [
    { el: row.querySelector(".content img, .bubble > img, img.media"), attr: "src" },
    { el: row.querySelector("video source"), attr: "src" },
    { el: row.querySelector("video"), attr: "src" },
    { el: row.querySelector("audio source"), attr: "src" },
    { el: row.querySelector("audio"), attr: "src" },
    { el: row.querySelector("a[href]"), attr: "href" },
  ];

  for (const candidate of candidates) {
    const value = candidate.el?.getAttribute(candidate.attr);
    if (!value) continue;
    if (/^(https?:|data:|mailto:|tel:|#)/i.test(value)) continue;
    const path = decodeURIComponent(value.replace(/^\.\//, ""));
    if (!path) continue;
    return { path, type: mediaTypeFromPath(path) };
  }
  return null;
}

/** Faz o parse de um HTML exportado em mensagens estruturadas. */
export function parseBackupHtml(html: string, folderName: string): ParsedBackupChat {
  const chunks = extractMessagesArray(html);
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<div id="root">${chunks.join("")}</div>`,
    "text/html",
  );
  const root = doc.getElementById("root");

  const messages: ParsedBackupMessage[] = [];
  let currentDate: { y: number; m: number; d: number } | null = null;
  let mediaCount = 0;
  let withoutStanzaId = 0;
  const senderNames = new Set<string>();

  const nodes = root ? Array.from(root.children) : [];

  for (const node of nodes) {
    if (node.classList.contains("date-divider")) {
      currentDate = parseDateDivider(node.textContent || "");
      continue;
    }
    if (!node.classList.contains("message-row")) {
      // alguns exports embrulham o divisor dentro de outro nó
      const divider = node.querySelector?.(".date-divider");
      if (divider) currentDate = parseDateDivider(divider.textContent || "");
      if (!node.querySelector?.(".message-row")) continue;
    }

    const rows = node.classList.contains("message-row")
      ? [node]
      : Array.from(node.querySelectorAll(".message-row"));

    for (const row of rows) {
      const stanzaId = row.getAttribute("data-stanza-id");
      const fromMe = row.classList.contains("me");

      const quoted = row.querySelector(".quoted-msg, .quoted, blockquote");
      const quotedSender = cleanText(
        quoted?.querySelector(".quoted-sender, .sender")?.textContent,
      );
      const quotedContent = cleanText(
        quoted?.querySelector(".quoted-text, .text-content")?.textContent ||
          quoted?.textContent,
      );

      const senderEl = row.querySelector(".sender-name, .participant, .bubble > .sender");
      const senderName = cleanText(senderEl?.textContent);
      if (senderName) senderNames.add(senderName);

      const textEl = row.querySelector(".text-content");
      let content = cleanText(textEl?.textContent);
      if (!content) {
        const contentEl = row.querySelector(".content");
        const clone = contentEl?.cloneNode(true) as Element | undefined;
        clone?.querySelectorAll(".quoted-msg, .quoted, blockquote").forEach((n) => n.remove());
        content = cleanText(clone?.textContent);
      }

      const time = cleanText(row.querySelector(".meta .time, .time")?.textContent) || null;
      const media = findMedia(row);
      if (media) mediaCount++;

      if (!stanzaId) withoutStanzaId++;

      if (!content && !media) continue;

      messages.push({
        stanzaId,
        fromMe,
        content,
        timestamp: buildTimestamp(currentDate, time),
        senderName: senderName || undefined,
        quotedContent: quotedContent || undefined,
        quotedSender: quotedSender || undefined,
        mediaPath: media?.path,
        mediaType: media?.type,
        mediaFilename: media ? media.path.split("/").pop() : undefined,
      });
    }
  }

  const timestamps = messages
    .map((m) => m.timestamp)
    .filter((t): t is string => Boolean(t))
    .sort();

  const htmlTitle = extractTitle(html);
  const phoneMatch = folderName.match(/(\+?\d[\d\s().-]{7,})/);
  const digits = phoneMatch ? phoneMatch[1].replace(/\D/g, "") : "";

  return {
    folderName,
    htmlTitle,
    messages,
    firstMessageAt: timestamps[0] ?? null,
    lastMessageAt: timestamps[timestamps.length - 1] ?? null,
    mediaCount,
    withoutStanzaId,
    phone: digits.length >= 10 ? digits : undefined,
    // grupos costumam ter vários remetentes distintos do lado "other"
    isGroup: senderNames.size > 1,
  };
}

/** Normaliza nomes para casamento (sem acento, emoji, caixa e espaços extras). */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Normaliza telefone brasileiro para apenas dígitos com DDI 55. */
export function normalizePhone(value?: string | null): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 11 && !digits.startsWith("55")) digits = `55${digits}`;
  return digits;
}
