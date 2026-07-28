import { supabase } from "@/integrations/supabase/client";
import {
  ParsedBackupChat,
  ParsedBackupMessage,
  normalizeName,
  normalizePhone,
  parseBackupHtml,
} from "@/lib/backup-parser";

export type MatchKind = "conversation" | "contact" | "new";

export interface ChatFolder {
  folderName: string;
  /** caminho completo da pasta dentro da seleção */
  folderPath: string;
  htmlFile: File;
  mediaFiles: Map<string, File>;
}

export interface ChatAnalysis {
  folder: ChatFolder;
  chat: ParsedBackupChat;
  matchKind: MatchKind;
  matchReason: string;
  conversationId?: string;
  contactId?: string;
  matchedName?: string;
  /** desmarcado = pular esta conversa */
  selected: boolean;
}

export interface ImportProgress {
  currentIndex: number;
  total: number;
  currentChat: string;
  imported: number;
  skipped: number;
  mediaUploaded: number;
  errors: number;
}

export interface ChatImportResult {
  folderName: string;
  conversationId?: string;
  imported: number;
  skipped: number;
  mediaUploaded: number;
  error?: string;
}

const HTML_RE = /\.html?$/i;
const RESUME_PREFIX = "backup-import-done:";

/** Agrupa os arquivos selecionados (webkitdirectory) em pastas de conversa. */
export function groupFilesIntoChats(files: File[]): ChatFolder[] {
  const byFolder = new Map<string, { html?: File; media: Map<string, File> }>();

  for (const file of files) {
    const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const parts = relPath.split("/");
    if (parts.length < 2) continue;

    if (HTML_RE.test(file.name)) {
      const folderPath = parts.slice(0, -1).join("/");
      const entry: { html?: File; media: Map<string, File> } =
        byFolder.get(folderPath) || { media: new Map<string, File>() };
      // mantém o maior html caso existam vários
      if (!entry.html || file.size > entry.html.size) entry.html = file;
      byFolder.set(folderPath, entry);
    }
  }

  // associa mídias à pasta de conversa mais específica
  const folderPaths = Array.from(byFolder.keys()).sort((a, b) => b.length - a.length);
  for (const file of files) {
    if (HTML_RE.test(file.name)) continue;
    if (/\.(css|js)$/i.test(file.name)) continue;
    const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const owner = folderPaths.find((fp) => relPath.startsWith(`${fp}/`));
    if (!owner) continue;
    const entry = byFolder.get(owner)!;
    const inner = relPath.slice(owner.length + 1);
    entry.media.set(inner, file);
    entry.media.set(inner.split("/").pop()!, file);
  }

  const result: ChatFolder[] = [];
  for (const [folderPath, entry] of byFolder) {
    if (!entry.html) continue;
    result.push({
      folderPath,
      folderName: folderPath.split("/").pop() || folderPath,
      htmlFile: entry.html,
      mediaFiles: entry.media,
    });
  }
  return result.sort((a, b) => a.folderName.localeCompare(b.folderName));
}

interface ExistingIndex {
  byPhone: Map<string, { conversationId: string; contactId: string; name: string }>;
  byName: Map<string, { conversationId: string; contactId: string; name: string }>;
  contactsByPhone: Map<string, { id: string; name: string }>;
  contactsByName: Map<string, { id: string; name: string }>;
}

async function buildExistingIndex(companyId: string): Promise<ExistingIndex> {
  const index: ExistingIndex = {
    byPhone: new Map(),
    byName: new Map(),
    contactsByPhone: new Map(),
    contactsByName: new Map(),
  };

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, contact_id, metadata, contacts(id, name, phone)")
    .eq("company_id", companyId)
    .limit(3000);

  for (const conv of conversations || []) {
    const contact = (conv as { contacts?: { id: string; name: string; phone: string | null } })
      .contacts;
    if (!contact) continue;
    const entry = { conversationId: conv.id, contactId: contact.id, name: contact.name };
    const phone = normalizePhone(contact.phone);
    if (phone) index.byPhone.set(phone, entry);
    const name = normalizeName(contact.name || "");
    if (name && !index.byName.has(name)) index.byName.set(name, entry);
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, phone")
    .eq("company_id", companyId)
    .limit(6000);

  for (const contact of contacts || []) {
    const phone = normalizePhone(contact.phone);
    if (phone && !index.contactsByPhone.has(phone)) {
      index.contactsByPhone.set(phone, { id: contact.id, name: contact.name });
    }
    const name = normalizeName(contact.name || "");
    if (name && !index.contactsByName.has(name)) {
      index.contactsByName.set(name, { id: contact.id, name: contact.name });
    }
  }

  return index;
}

/** Fase 1: lê os HTMLs e casa cada conversa com o que já existe no banco (somente leitura). */
export async function analyzeChats(
  folders: ChatFolder[],
  companyId: string,
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<ChatAnalysis[]> {
  const index = await buildExistingIndex(companyId);
  const analyses: ChatAnalysis[] = [];

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    onProgress?.(i, folders.length, folder.folderName);

    const html = await folder.htmlFile.text();
    const chat = parseBackupHtml(html, folder.folderName);

    const displayName = chat.htmlTitle || chat.folderName;
    const phone = normalizePhone(chat.phone);
    const nameKey = normalizeName(displayName);

    let analysis: ChatAnalysis = {
      folder,
      chat,
      matchKind: "new",
      matchReason: "Nova conversa (nenhuma correspondência encontrada)",
      selected: chat.messages.length > 0,
    };

    const byPhone = phone ? index.byPhone.get(phone) : undefined;
    const byName = index.byName.get(nameKey);
    const contactByPhone = phone ? index.contactsByPhone.get(phone) : undefined;
    const contactByName = index.contactsByName.get(nameKey);

    if (byPhone) {
      analysis = {
        ...analysis,
        matchKind: "conversation",
        matchReason: "Conversa existente (telefone)",
        conversationId: byPhone.conversationId,
        contactId: byPhone.contactId,
        matchedName: byPhone.name,
      };
    } else if (byName) {
      analysis = {
        ...analysis,
        matchKind: "conversation",
        matchReason: "Conversa existente (nome)",
        conversationId: byName.conversationId,
        contactId: byName.contactId,
        matchedName: byName.name,
      };
    } else if (contactByPhone || contactByName) {
      const contact = (contactByPhone || contactByName)!;
      analysis = {
        ...analysis,
        matchKind: "contact",
        matchReason: `Contato existente sem conversa (${contactByPhone ? "telefone" : "nome"})`,
        contactId: contact.id,
        matchedName: contact.name,
      };
    }

    analyses.push(analysis);
  }

  onProgress?.(folders.length, folders.length, "");
  return analyses.sort((a, b) => (b.chat.lastMessageAt || "").localeCompare(a.chat.lastMessageAt || ""));
}

async function invoke<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("import-chat-backup", {
    body: { action, ...payload },
  });
  if (error) {
    const details =
      typeof (error as { context?: { text?: () => Promise<string> } }).context?.text === "function"
        ? await (error as { context: { text: () => Promise<string> } }).context.text()
        : error.message;
    throw new Error(details || error.message);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

async function sha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-80);
}

async function uploadMedia(
  file: File,
  companyId: string,
  conversationId: string,
): Promise<string | null> {
  const hash = await sha256(file);
  const path = `import/${companyId}/${conversationId}/${hash}-${sanitizeFilename(file.name)}`;

  const { error } = await supabase.storage
    .from("chat-attachments")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error && !/exists/i.test(error.message)) return null;

  const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
  return data.publicUrl;
}

function resumeKey(companyId: string) {
  return `${RESUME_PREFIX}${companyId}`;
}

export function getCompletedFolders(companyId: string): Set<string> {
  try {
    const raw = localStorage.getItem(resumeKey(companyId));
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markFolderDone(companyId: string, folderPath: string) {
  const done = getCompletedFolders(companyId);
  done.add(folderPath);
  try {
    localStorage.setItem(resumeKey(companyId), JSON.stringify(Array.from(done)));
  } catch {
    /* quota */
  }
}

export function clearResumeState(companyId: string) {
  localStorage.removeItem(resumeKey(companyId));
}

const MESSAGE_BATCH = 400;
const MEDIA_CONCURRENCY = 3;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

/* ---------- Progresso persistido no banco (import_jobs) ---------- */

export interface ImportJobState {
  id: string;
  status: string;
  phase: string;
  total: number;
  processed: number;
  currentChat: string;
  imported: number;
  skipped: number;
  mediaUploaded: number;
  errors: number;
  updatedAt: string;
}

const JOB_INSTANCE = "backup-import";

function mapJob(row: {
  id: string;
  status: string;
  phase: string;
  total_items: number | null;
  processed_items: number | null;
  last_cursor: string | null;
  metadata: unknown;
  updated_at: string;
}): ImportJobState {
  const meta = (row.metadata || {}) as Record<string, number>;
  return {
    id: row.id,
    status: row.status,
    phase: row.phase,
    total: row.total_items ?? 0,
    processed: row.processed_items ?? 0,
    currentChat: row.last_cursor || "",
    imported: Number(meta.imported ?? 0),
    skipped: Number(meta.skipped ?? 0),
    mediaUploaded: Number(meta.mediaUploaded ?? 0),
    errors: Number(meta.errors ?? 0),
    updatedAt: row.updated_at,
  };
}

/** Último job de importação de backup da empresa (para retomar a visão do progresso). */
export async function getLatestImportJob(companyId: string): Promise<ImportJobState | null> {
  const { data } = await supabase
    .from("import_jobs")
    .select("id, status, phase, total_items, processed_items, last_cursor, metadata, updated_at")
    .eq("company_id", companyId)
    .eq("instance_name", JOB_INSTANCE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapJob(data) : null;
}

async function createImportJob(companyId: string, total: number): Promise<string | null> {
  const { data, error } = await supabase
    .from("import_jobs")
    .insert({
      company_id: companyId,
      instance_name: JOB_INSTANCE,
      phase: "messages",
      status: "running",
      total_items: total,
      processed_items: 0,
      metadata: { imported: 0, skipped: 0, mediaUploaded: 0, errors: 0 },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[backup-import] não foi possível registrar o job:", error.message);
    return null;
  }
  return data?.id ?? null;
}

async function updateImportJob(
  jobId: string | null,
  progress: ImportProgress,
  status: string,
  errorMessage?: string,
) {
  if (!jobId) return;
  await supabase
    .from("import_jobs")
    .update({
      status,
      processed_items: progress.currentIndex,
      total_items: progress.total,
      last_cursor: progress.currentChat,
      error_message: errorMessage ?? null,
      metadata: {
        imported: progress.imported,
        skipped: progress.skipped,
        mediaUploaded: progress.mediaUploaded,
        errors: progress.errors,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/** Marca um job travado (aba fechada) como interrompido. */
export async function markJobInterrupted(jobId: string) {
  await supabase
    .from("import_jobs")
    .update({ status: "interrupted", updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "running");
}

export interface RunImportOptions {
  companyId: string;
  analyses: ChatAnalysis[];
  uploadMediaFiles: boolean;
  onProgress: (progress: ImportProgress) => void;
  shouldStop: () => boolean;
  onJobCreated?: (jobId: string | null) => void;
}

export async function runImport({
  companyId,
  analyses,
  uploadMediaFiles,
  onProgress,
  shouldStop,
  onJobCreated,
}: RunImportOptions): Promise<ChatImportResult[]> {
  const selected = analyses.filter((a) => a.selected && a.chat.messages.length > 0);
  const done = getCompletedFolders(companyId);
  const results: ChatImportResult[] = [];

  const progress: ImportProgress = {
    currentIndex: 0,
    total: selected.length,
    currentChat: "",
    imported: 0,
    skipped: 0,
    mediaUploaded: 0,
    errors: 0,
  };

  const jobId = await createImportJob(companyId, selected.length);
  onJobCreated?.(jobId);

  for (let i = 0; i < selected.length; i++) {
    if (shouldStop()) break;
    const analysis = selected[i];
    progress.currentIndex = i + 1;
    progress.currentChat = analysis.chat.htmlTitle || analysis.folder.folderName;
    onProgress({ ...progress });
    await updateImportJob(jobId, progress, "running");

    if (done.has(analysis.folder.folderPath)) {
      results.push({
        folderName: analysis.folder.folderName,
        conversationId: analysis.conversationId,
        imported: 0,
        skipped: analysis.chat.messages.length,
        mediaUploaded: 0,
      });
      continue;
    }

    try {
      const resolved = await invoke<{ conversationId: string; contactId: string }>("resolve", {
        companyId,
        conversationId: analysis.conversationId ?? null,
        contactId: analysis.contactId ?? null,
        name: analysis.chat.htmlTitle || analysis.folder.folderName,
        phone: analysis.chat.phone ?? null,
        isGroup: analysis.chat.isGroup,
      });

      const conversationId = resolved.conversationId;

      // Upload das mídias referenciadas
      const mediaUrls = new Map<string, string>();
      if (uploadMediaFiles) {
        const withMedia = analysis.chat.messages.filter((m) => m.mediaPath);
        const uniquePaths = Array.from(new Set(withMedia.map((m) => m.mediaPath!)));
        await mapWithConcurrency(uniquePaths, MEDIA_CONCURRENCY, async (mediaPath) => {
          const file =
            analysis.folder.mediaFiles.get(mediaPath) ||
            analysis.folder.mediaFiles.get(mediaPath.split("/").pop() || "");
          if (!file) return;
          const url = await uploadMedia(file, companyId, conversationId);
          if (url) {
            mediaUrls.set(mediaPath, url);
            progress.mediaUploaded++;
          }
        });
        onProgress({ ...progress });
      }

      const payloadMessages = analysis.chat.messages.map((message) =>
        toPayload(message, mediaUrls),
      );

      let imported = 0;
      let skipped = 0;

      for (let start = 0; start < payloadMessages.length; start += MESSAGE_BATCH) {
        if (shouldStop()) break;
        const batch = payloadMessages.slice(start, start + MESSAGE_BATCH);
        const res = await invoke<{ imported: number; skipped: number }>("import", {
          companyId,
          conversationId,
          messages: batch,
        });
        imported += res.imported;
        skipped += res.skipped;
        progress.imported += res.imported;
        progress.skipped += res.skipped;
        onProgress({ ...progress });
      }

      await invoke("finalize", { companyId, conversationId });
      markFolderDone(companyId, analysis.folder.folderPath);

      results.push({
        folderName: analysis.folder.folderName,
        conversationId,
        imported,
        skipped,
        mediaUploaded: mediaUrls.size,
      });
    } catch (err) {
      progress.errors++;
      onProgress({ ...progress });
      results.push({
        folderName: analysis.folder.folderName,
        imported: 0,
        skipped: 0,
        mediaUploaded: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

function toPayload(message: ParsedBackupMessage, mediaUrls: Map<string, string>) {
  const url = message.mediaPath ? mediaUrls.get(message.mediaPath) : undefined;
  return {
    stanzaId: message.stanzaId,
    fromMe: message.fromMe,
    content: message.content,
    timestamp: message.timestamp,
    senderName: message.senderName,
    quotedContent: message.quotedContent,
    quotedSender: message.quotedSender,
    attachment: url
      ? {
          type: message.mediaType,
          url,
          filename: message.mediaFilename,
        }
      : undefined,
  };
}

export function buildCsvReport(results: ChatImportResult[]): string {
  const rows = [["conversa", "importadas", "duplicadas", "midias", "erro"]];
  for (const r of results) {
    rows.push([
      r.folderName,
      String(r.imported),
      String(r.skipped),
      String(r.mediaUploaded),
      r.error || "",
    ]);
  }
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}
