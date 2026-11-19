// Cliente compartilhado de backup (EM PREPARAÇÃO — não publicado).
// Não depende do Supabase: o acesso ao banco é feito por um "store" injetado,
// e o acesso à rede por um "fetch" injetado (facilita testes locais).

export const MANIFEST_VERSION = "1.0";
const SHA_RE = /^[0-9a-f]{64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface ReceiverConfig {
  baseUrl: string;
  token: string;
  project: string;
  timeoutMs?: number;
  maxAttempts?: number;
  backoffMs?: number;
  fetch?: typeof fetch;
}

export interface Artifact {
  component: string;
  item_key: string;
  bytes: Uint8Array;
  sha256: string;
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const redact = (s: string) => String(s).replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 300);

// JSON canônico: chaves ordenadas, sem espaços — mesmo conteúdo = mesmo hash.
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
}

export interface ManifestInput {
  project: string;
  run_id: string;
  created_at: string;
  snapshot_at: string | null;
  items: { component: string; item_key: string; size_bytes: number; sha256: string }[];
}

export async function buildManifest(input: ManifestInput) {
  const items = [...input.items]
    .map((i) => ({ component: i.component, item_key: i.item_key, sha256: i.sha256, size_bytes: i.size_bytes }))
    .sort((a, b) => (a.item_key < b.item_key ? -1 : a.item_key > b.item_key ? 1 : 0));
  const obj = {
    manifest_version: MANIFEST_VERSION,
    project: input.project,
    run_id: input.run_id,
    created_at: input.created_at,
    snapshot_at: input.snapshot_at,
    items_total: items.length,
    bytes_total: items.reduce((n, i) => n + i.size_bytes, 0),
    items,
  };
  const bytes = new TextEncoder().encode(canonicalJson(obj));
  return { obj, bytes, sha256: await sha256Hex(bytes) };
}

async function call(cfg: ReceiverConfig, path: string, init: RequestInit) {
  const f = cfg.fetch ?? fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 20000);
  try {
    const resp = await f(`${cfg.baseUrl.replace(/\/+$/, "")}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${cfg.token}`, "X-Project-Name": cfg.project, ...(init.headers ?? {}) },
      signal: ctrl.signal,
    });
    const txt = (await resp.text()).slice(0, 20000);
    // deno-lint-ignore no-explicit-any
    let body: any = {};
    try { body = JSON.parse(txt); } catch { /* corpo não-JSON */ }
    return { status: resp.status, body, txt };
  } finally {
    clearTimeout(timer);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface UploadResult {
  status: "verified" | "failed";
  duplicate: boolean;
  attempts: number;
  sha256_received: string | null;
  error: string | null;
}

// 200 com hash igual → verified (inclusive duplicate). 422 → reenvia (corrompido em trânsito).
// 409 e outros 4xx → falha sem reenvio. 5xx/timeout/rede → reenvia com backoff.
export async function uploadItem(cfg: ReceiverConfig, runId: string, a: Artifact): Promise<UploadResult> {
  const max = cfg.maxAttempts ?? 3;
  let lastError: string | null = null, received: string | null = null;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const r = await call(cfg, "/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Backup-Run": runId,
          "X-Backup-Item": a.item_key,
          "X-Content-SHA256": a.sha256,
          "X-Backup-Filename": `${runId}__${a.item_key.replace(/\//g, "__")}`,
        },
        body: a.bytes as BodyInit,
      });
      received = typeof r.body?.sha256 === "string" && SHA_RE.test(r.body.sha256.toLowerCase())
        ? r.body.sha256.toLowerCase() : null;
      if (r.status === 200) {
        if (received === a.sha256) {
          return { status: "verified", duplicate: r.body?.duplicate === true, attempts: attempt, sha256_received: received, error: null };
        }
        lastError = "Hash recebido difere do esperado";
      } else {
        lastError = `HTTP ${r.status}: ${redact(r.body?.error ?? r.txt)}`;
        if (r.status === 409 || (r.status >= 400 && r.status < 500 && r.status !== 422 && r.status !== 429)) {
          return { status: "failed", duplicate: false, attempts: attempt, sha256_received: null, error: lastError };
        }
      }
    } catch (e) {
      lastError = e instanceof Error ? (e.name === "AbortError" ? "Timeout" : e.name) : "Erro de rede";
    }
    if (attempt < max) await sleep((cfg.backoffMs ?? 1000) * 2 ** attempt);
  }
  return { status: "failed", duplicate: false, attempts: max, sha256_received: null, error: lastError };
}

export type FinalizeResult =
  | { state: "confirmed"; manifest_sha256: string; confirmed_at: string }
  | { state: "rejected"; error: string }
  | { state: "unknown"; error: string };

export async function finalizeRun(cfg: ReceiverConfig, runId: string, manifest: { bytes: Uint8Array; sha256: string }): Promise<FinalizeResult> {
  try {
    const r = await call(cfg, "/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Backup-Run": runId, "X-Content-SHA256": manifest.sha256 },
      body: manifest.bytes as BodyInit,
    });
    if (r.status === 200) {
      if (r.body?.complete === true && r.body?.run_id === runId && r.body?.manifest_sha256 === manifest.sha256) {
        return { state: "confirmed", manifest_sha256: manifest.sha256, confirmed_at: new Date().toISOString() };
      }
      return { state: "unknown", error: "Resposta de finalização não confere" };
    }
    if (r.status >= 500 || r.status === 429) return { state: "unknown", error: `HTTP ${r.status}` };
    return { state: "rejected", error: `HTTP ${r.status}: ${redact(r.body?.error ?? r.txt)}` };
  } catch (e) {
    return { state: "unknown", error: e instanceof Error && e.name === "AbortError" ? "Timeout" : "Erro de rede" };
  }
}

export type StatusResult =
  | { state: "complete"; manifest_sha256: string }
  | { state: "open" }
  | { state: "not_found" }
  | { state: "unknown"; error: string };

export async function getRunStatus(cfg: ReceiverConfig, runId: string): Promise<StatusResult> {
  try {
    const r = await call(cfg, `/runs/${runId}/status`, { method: "GET" });
    if (r.status === 404) return { state: "not_found" };
    if (r.status !== 200 || r.body?.run_id !== runId) return { state: "unknown", error: `HTTP ${r.status}` };
    if (r.body.state === "COMPLETE" && SHA_RE.test(r.body.manifest_sha256 ?? "")) {
      return { state: "complete", manifest_sha256: r.body.manifest_sha256 };
    }
    if (r.body.state === "OPEN") return { state: "open" };
    return { state: "unknown", error: `estado ${String(r.body.state).slice(0, 20)}` };
  } catch (e) {
    return { state: "unknown", error: e instanceof Error && e.name === "AbortError" ? "Timeout" : "Erro de rede" };
  }
}

// ---------------- Orquestração (banco via store) ----------------
export interface RunRow {
  id: string;
  status: string;
  manifest_sha256: string | null;
  receiver_confirmed_at: string | null;
  updated_at?: string;
}

export interface BackupStore {
  createRun(v: { snapshot_at: string | null; items_total: number; bytes_total: number }): Promise<{ id: string; created_at: string }>;
  insertItems(runId: string, items: { component: string; item_key: string; size_bytes: number; sha256_expected: string }[]): Promise<void>;
  updateItem(runId: string, itemKey: string, patch: Record<string, unknown>): Promise<void>;
  getRun(runId: string): Promise<RunRow | null>;
  // Atualiza só se o status atual for `fromStatus`; devolve true se alterou (controle de concorrência).
  updateRunIf(runId: string, fromStatus: string, patch: Record<string, unknown>): Promise<boolean>;
}

export const MANIFEST_ITEM_KEY = "manifest.json";

export async function executeBackupRun(store: BackupStore, cfg: ReceiverConfig, artifacts: Artifact[], snapshotAt: string | null) {
  const run = await store.createRun({
    snapshot_at: snapshotAt,
    items_total: artifacts.length,
    bytes_total: artifacts.reduce((n, a) => n + a.bytes.length, 0),
  });
  // Todos os itens esperados registrados antes de qualquer envio.
  await store.insertItems(run.id, artifacts.map((a) => ({ component: a.component, item_key: a.item_key, size_bytes: a.bytes.length, sha256_expected: a.sha256 })));

  const results = [];
  for (const a of artifacts) {
    const r = await uploadItem(cfg, run.id, a);
    await store.updateItem(run.id, a.item_key, {
      status: r.status, attempts: r.attempts, last_error: r.error, last_attempt_at: new Date().toISOString(),
      sha256_received: r.sha256_received, verified_at: r.status === "verified" ? new Date().toISOString() : null,
    });
    results.push({ item_key: a.item_key, ...r });
  }
  const verified = results.filter((r) => r.status === "verified").length;
  const failed = results.length - verified;
  if (failed) {
    await store.updateRunIf(run.id, "running", {
      status: "failed", items_verified: verified, items_failed: failed, finished_at: new Date().toISOString(),
      last_error: "Falha no envio de itens",
    });
    return { run_id: run.id, status: "failed", items: results };
  }

  const manifest = await buildManifest({
    project: cfg.project, run_id: run.id, created_at: run.created_at, snapshot_at: snapshotAt,
    items: artifacts.map((a) => ({ component: a.component, item_key: a.item_key, size_bytes: a.bytes.length, sha256: a.sha256 })),
  });
  // Guarda o hash esperado antes de finalizar: é o que a reconciliação vai exigir.
  await store.insertItems(run.id, [{ component: "manifest", item_key: MANIFEST_ITEM_KEY, size_bytes: manifest.bytes.length, sha256_expected: manifest.sha256 }]);
  await store.updateRunIf(run.id, "running", { status: "finalizing", items_verified: verified, items_failed: 0, manifest_sha256: manifest.sha256 });

  const fin = await finalizeRun(cfg, run.id, manifest);
  const status = await applyFinalization(store, run.id, manifest.sha256, fin);
  return { run_id: run.id, status, manifest_sha256: manifest.sha256, finalize: fin.state, items: results };
}

export async function applyFinalization(store: BackupStore, runId: string, expected: string, fin: FinalizeResult): Promise<string> {
  const t = new Date().toISOString();
  if (fin.state === "confirmed" && fin.manifest_sha256 === expected) {
    await store.updateItem(runId, MANIFEST_ITEM_KEY, { status: "verified", attempts: 1, sha256_received: expected, verified_at: t, last_attempt_at: t });
    const ok = await store.updateRunIf(runId, "finalizing", {
      status: "complete", receiver_confirmed_at: fin.confirmed_at, finished_at: t, last_error: null,
    });
    return ok ? "complete" : (await store.getRun(runId))?.status ?? "unknown";
  }
  if (fin.state === "rejected") {
    await store.updateItem(runId, MANIFEST_ITEM_KEY, { status: "failed", attempts: 1, last_error: fin.error, last_attempt_at: t });
    await store.updateRunIf(runId, "finalizing", { status: "failed", finished_at: t, last_error: `Finalização rejeitada: ${fin.error}` });
    return "failed";
  }
  // Resposta perdida/timeout: continua "finalizing" até a reconciliação.
  await store.updateRunIf(runId, "finalizing", { last_error: `Finalização sem confirmação: ${fin.state === "unknown" ? fin.error : ""}` });
  return "finalizing";
}

export type ReconcileOutcome =
  | "promoted" | "already_complete" | "still_open" | "receiver_unknown"
  | "hash_mismatch" | "not_eligible" | "not_found" | "invalid_run_id" | "expired";

// Uncertainty must not monopolize the single active-run slot indefinitely.
export const FINALIZATION_GRACE_MS = 60 * 60_000;

// Só execuções em "finalizing" com manifest_sha256 registrado podem ser promovidas,
// e somente se a EC2 reportar COMPLETE com exatamente o mesmo hash.
export async function reconcileRun(store: BackupStore, cfg: ReceiverConfig, runId: string): Promise<ReconcileOutcome> {
  if (!UUID_RE.test(runId)) return "invalid_run_id";
  const run = await store.getRun(runId);
  if (!run) return "not_found";
  if (run.status === "complete") return "already_complete";
  if (run.status !== "finalizing" || !run.manifest_sha256 || !SHA_RE.test(run.manifest_sha256)) return "not_eligible";
  const st = await getRunStatus(cfg, runId);
  if (st.state !== "complete") {
    if (run.updated_at && Date.now() - new Date(run.updated_at).getTime() >= FINALIZATION_GRACE_MS) {
      const changed = await store.updateRunIf(runId, "finalizing", {
        status: "incomplete", stage: "incomplete", finished_at: new Date().toISOString(),
        last_error: "Validação do manifesto não confirmada pelo receptor em 1 hora; arquivos preservados, integridade não confirmada.",
      });
      return changed ? "expired" : "not_eligible";
    }
    return st.state === "unknown" ? "receiver_unknown" : "still_open";
  }
  if (st.manifest_sha256 !== run.manifest_sha256) {
    await store.updateRunIf(runId, "finalizing", { status: "failed", finished_at: new Date().toISOString(), last_error: "Manifesto confirmado pela EC2 difere do esperado" });
    return "hash_mismatch";
  }
  const status = await applyFinalization(store, runId, run.manifest_sha256, {
    state: "confirmed", manifest_sha256: st.manifest_sha256, confirmed_at: new Date().toISOString(),
  });
  return status === "complete" ? "promoted" : "not_eligible";
}
