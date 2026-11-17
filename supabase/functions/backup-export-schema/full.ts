// Backup completo em etapas: cada chamada processa partes até o limite de tempo,
// grava o ponto de parada em backup_runs.progress e chama a próxima etapa.
import {
  applyFinalization, buildManifest, finalizeRun, MANIFEST_ITEM_KEY, redact, sha256Hex, uploadItem,
  type ReceiverConfig,
} from "../_shared/backup-client.ts";
import { makeStore } from "./store.ts";
import {
  buildTasks, EXCLUDED_BUCKETS, occurrenceKey, pageSizeFor, partKey, retryDelayMinutes, retryJobName,
  storageItemKey, type Task,
} from "./plan.ts";

// deno-lint-ignore no-explicit-any
type Admin = any;
// deno-lint-ignore no-explicit-any
type Progress = Record<string, any>;

const STEP_BUDGET_MS = 75_000;
const LOCK_SECONDS = 140;
const STORAGE_BATCH = 20;
const enc = new TextEncoder();

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());
}

export async function internalKey(admin: Admin): Promise<string | null> {
  const { data } = await admin.from("backup_internal_config").select("value").eq("key", "internal_key").maybeSingle();
  return data?.value ?? null;
}

async function event(admin: Admin, action: string, details: Record<string, unknown>, actor: string | null = null) {
  await admin.from("backup_events").insert({ actor, action, details });
}

// ------------------------------------------------------------------ início
export async function startFullRun(admin: Admin, opts: { trigger: "manual" | "scheduled"; userId: string | null; occurrence?: string }) {
  const { data: counts, error } = await admin.rpc("backup_table_counts");
  if (error || !counts) throw new Error("Falha ao contar tabelas");
  const tasks = buildTasks(Object.keys(counts));
  const progress: Progress = {
    scope: "full", tasks, idx: 0, cursor: null, part: 0,
    counts_at_start: counts, table_rows: {}, table_windows: {}, storage_files: {}, storage_bytes: {},
    source: null, limitations: [],
  };
  const { data, error: insErr } = await admin.from("backup_runs").insert({
    status: "running", trigger_type: opts.trigger, requested_by: opts.userId, started_at: new Date().toISOString(),
    snapshot_at: new Date().toISOString(), stage: "schema", progress, occurrence_key: opts.occurrence ?? null,
  }).select("id, created_at").single();
  if (insErr || !data) {
    if (insErr?.code === "23505") return { conflict: true as const };
    throw new Error("Falha ao registrar execução");
  }
  await event(admin, opts.trigger === "manual" ? "manual_run_started" : "scheduled_run_started", { run_id: data.id, occurrence: opts.occurrence ?? null }, opts.userId);
  return { conflict: false as const, run_id: data.id as string };
}

// ------------------------------------------------------------------ envio de um item
async function sendItem(admin: Admin, cfg: ReceiverConfig, runId: string, component: string, itemKey: string,
  bytes: Uint8Array, extra: { row_count?: number; metadata?: Record<string, unknown> } = {}) {
  const sha256 = await sha256Hex(bytes);
  const { error } = await admin.from("backup_items").upsert({
    run_id: runId, component, item_key: itemKey, status: "uploading", size_bytes: bytes.length,
    sha256_expected: sha256, row_count: extra.row_count ?? null, metadata: extra.metadata ?? null,
  }, { onConflict: "run_id,item_key" });
  if (error) throw new Error(`Falha ao registrar item ${itemKey}`);
  const r = await uploadItem(cfg, runId, { component, item_key: itemKey, bytes, sha256 });
  const t = new Date().toISOString();
  await admin.from("backup_items").update({
    status: r.status, attempts: r.attempts, last_error: r.error, last_attempt_at: t,
    sha256_received: r.sha256_received, verified_at: r.status === "verified" ? t : null,
  }).eq("run_id", runId).eq("item_key", itemKey);
  if (r.status !== "verified") throw new Error(`Item ${itemKey} não confirmado: ${r.error ?? "erro"}`);
  return { sha256, size: bytes.length };
}

// ------------------------------------------------------------------ unidades de trabalho
type Ctx = { admin: Admin; cfg: ReceiverConfig; runId: string; p: Progress; buildSchema: () => Promise<{ items: { key: string; bytes: Uint8Array }[] }> };

async function doSchema(c: Ctx) {
  const { items } = await c.buildSchema();
  for (const it of items) await sendItem(c.admin, c.cfg, c.runId, "db_schema", it.key, it.bytes);
  return true;
}

async function doTablePage(c: Ctx, table: string) {
  const size = pageSizeFor(table);
  let q = c.admin.from(table).select("*").order("id", { ascending: true }).limit(size);
  if (c.p.cursor) q = q.gt("id", c.p.cursor);
  if (!c.p.table_windows[table]) c.p.table_windows[table] = { started_at: new Date().toISOString() };
  const { data, error } = await q;
  if (error) throw new Error(`Falha ao ler ${table}: ${redact(error.message)}`);
  const rows = data ?? [];
  if (rows.length === 0 && c.p.part > 0) return true;
  const part = c.p.part + 1;
  const body = enc.encode(JSON.stringify({ table, part, order_by: "id", after_id: c.p.cursor, row_count: rows.length, rows }));
  await sendItem(c.admin, c.cfg, c.runId, "db_data", partKey(table, part), await gzip(body), {
    row_count: rows.length, metadata: { table, part, first_id: rows[0]?.id ?? null, last_id: rows.at(-1)?.id ?? null },
  });
  c.p.table_rows[table] = (c.p.table_rows[table] ?? 0) + rows.length;
  c.p.part = part;
  c.p.cursor = rows.at(-1)?.id ?? c.p.cursor;
  if (rows.length < size) {
    const { count } = await c.admin.from(table).select("*", { count: "exact", head: true });
    c.p.table_windows[table].finished_at = new Date().toISOString();
    c.p.table_windows[table].count_at_finish = count ?? null;
    return true;
  }
  return false;
}

async function doStorageBatch(c: Ctx) {
  const { data, error } = await c.admin.rpc("backup_list_storage_objects", { _after: c.p.cursor, _limit: STORAGE_BATCH });
  if (error) throw new Error("Falha ao listar arquivos");
  const objs = (data ?? []) as { id: string; bucket_id: string; name: string; metadata: Record<string, unknown> | null; created_at: string; updated_at: string }[];
  for (const o of objs) {
    c.p.cursor = o.id;
    if (EXCLUDED_BUCKETS.has(o.bucket_id)) continue;
    const { data: blob, error: dErr } = await c.admin.storage.from(o.bucket_id).download(o.name);
    if (dErr || !blob) throw new Error(`Falha ao baixar arquivo ${o.id}`);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await sendItem(c.admin, c.cfg, c.runId, "storage", storageItemKey(o.bucket_id, o.id), bytes, {
      metadata: { bucket: o.bucket_id, path: o.name, object_id: o.id, mimetype: o.metadata?.mimetype ?? null,
        original_size: o.metadata?.size ?? null, cache_control: o.metadata?.cacheControl ?? null,
        created_at: o.created_at, updated_at: o.updated_at },
    });
    c.p.storage_files[o.bucket_id] = (c.p.storage_files[o.bucket_id] ?? 0) + 1;
    c.p.storage_bytes[o.bucket_id] = (c.p.storage_bytes[o.bucket_id] ?? 0) + bytes.length;
  }
  return objs.length < STORAGE_BATCH;
}

async function doStorageIndex(c: Ctx) {
  const entries: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await c.admin.from("backup_items").select("item_key, size_bytes, sha256_expected, metadata")
      .eq("run_id", c.runId).eq("component", "storage").order("item_key").range(from, from + 999);
    if (error) throw new Error("Falha ao montar índice de arquivos");
    entries.push(...(data ?? []).map((d: Progress) => ({ item_key: d.item_key, size_bytes: d.size_bytes, sha256: d.sha256_expected, ...d.metadata })));
    if (!data || data.length < 1000) break;
  }
  const { data: buckets } = await c.admin.storage.listBuckets();
  const body = enc.encode(JSON.stringify({
    note: "Mapa item_key -> bucket/caminho original. Buckets privados devem ser recriados como privados.",
    buckets: (buckets ?? []).filter((b: Progress) => !EXCLUDED_BUCKETS.has(b.id)).map((b: Progress) => ({ id: b.id, public: b.public, file_size_limit: b.file_size_limit, allowed_mime_types: b.allowed_mime_types })),
    objects: entries,
  }));
  await sendItem(c.admin, c.cfg, c.runId, "storage", "storage/index.json.gz", await gzip(body), { row_count: entries.length });
  return true;
}

async function doSource(c: Ctx) {
  const meta = await c.admin.storage.from("backup-source").download("latest/source.json");
  const tar = await c.admin.storage.from("backup-source").download("latest/source.tar.gz");
  if (meta.error || tar.error || !meta.data || !tar.data) {
    c.p.limitations.push("Snapshot de código não encontrado; código-fonte não incluído nesta execução.");
    c.p.source = null;
    return true;
  }
  const info = JSON.parse(await meta.data.text());
  const bytes = new Uint8Array(await tar.data.arrayBuffer());
  if (info.sha256 && info.sha256 !== await sha256Hex(bytes)) throw new Error("Snapshot de código corrompido (hash diferente)");
  await sendItem(c.admin, c.cfg, c.runId, "source", "source/code-snapshot.tar.gz", bytes, { metadata: info });
  await sendItem(c.admin, c.cfg, c.runId, "source", "source/code-snapshot.json", enc.encode(JSON.stringify(info, null, 2)));
  c.p.source = { created_at: info.created_at, files: info.files, functions: info.functions, migrations: info.migrations, bytes: bytes.length };
  return true;
}

const SECRET_INVENTORY = [
  ["BACKUP_RECEIVER_URL", "Endereço do receptor de backup na EC2", "backup-export-schema", true],
  ["BACKUP_RECEIVER_TOKEN", "Token do receptor de backup (mesmo de /etc/backup-receiver/receiver.env)", "backup-export-schema", true],
  ["EVOLUTION_API_URL", "Servidor WhatsApp (Evolution API)", "funções de WhatsApp, campanhas, sync", true],
  ["EVOLUTION_API_KEY", "Chave do servidor WhatsApp", "funções de WhatsApp, campanhas, sync", true],
  ["FIRECRAWL_API_KEY", "Prospecção (busca e leitura de páginas)", "prospectar-empresas, scrape-*, google-search", false],
  ["LOVABLE_API_KEY", "IA (assistente, análise histórica)", "ai-assistant, ai-history-analysis", true],
  ["VIAINFRA_MONITORING_TOKEN", "Monitoramento Radar ViaInfra", "radar-status", false],
  ["SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_DB_URL", "Gerados pela plataforma no novo ambiente", "todas", true],
] as const;

async function doInventory(c: Ctx) {
  const envNames = Object.keys(Deno.env.toObject()).filter((k) => /^[A-Z][A-Z0-9_]+$/.test(k)).sort();
  const body = {
    generated_at: new Date().toISOString(),
    warning: "Somente nomes e finalidade. Nenhum valor de secret está neste arquivo.",
    secrets: SECRET_INVENTORY.map(([name, purpose, used_by, required]) => ({ name, purpose, used_by, required_for_restore: required,
      reconfigure: "Cadastrar novamente pelo painel de secrets do novo ambiente; nunca em arquivo ou código." })),
    env_names_visible_to_function: envNames,
    internal_config: "Tabela backup_internal_config excluída do backup: recriar com nova chave aleatória, URL da função e chave pública.",
    not_exportable: ["Configuração de login (provedores, e-mail, URLs)", "Usuários de login e senhas (schema auth)",
      "Tarefas agendadas (recriadas ao salvar o agendamento na tela)", "Papéis internos do banco"],
  };
  await sendItem(c.admin, c.cfg, c.runId, "functions", "config/secrets-inventory.json", enc.encode(JSON.stringify(body, null, 2)));
  return true;
}

// ------------------------------------------------------------------ laço de etapas
export async function runSteps(admin: Admin, cfg: ReceiverConfig, runId: string, buildSchema: Ctx["buildSchema"]): Promise<"continue" | "done" | "locked"> {
  const lockUntil = new Date(Date.now() + LOCK_SECONDS * 1000).toISOString();
  const { data: claimed } = await admin.from("backup_runs").update({ step_lock_until: lockUntil })
    .eq("id", runId).eq("status", "running").or(`step_lock_until.is.null,step_lock_until.lt."${new Date().toISOString()}"`)
    .select("id, progress");
  if (!claimed || claimed.length !== 1) return "locked";
  const p: Progress = claimed[0].progress;
  const c: Ctx = { admin, cfg, runId, p, buildSchema };
  const deadline = Date.now() + STEP_BUDGET_MS;
  try {
    while (Date.now() < deadline && p.idx < p.tasks.length) {
      const task: Task = p.tasks[p.idx];
      const finished =
        task.kind === "schema" ? await doSchema(c)
        : task.kind === "table" ? await doTablePage(c, task.name)
        : task.kind === "storage" ? await doStorageBatch(c)
        : task.kind === "storage_index" ? await doStorageIndex(c)
        : task.kind === "source" ? await doSource(c)
        : await doInventory(c);
      if (finished) { p.idx += 1; p.cursor = null; p.part = 0; }
      const next = p.tasks[p.idx] as Task | undefined;
      const { count: verified } = await admin.from("backup_items").select("id", { count: "exact", head: true }).eq("run_id", runId).eq("status", "verified");
      await admin.from("backup_runs").update({
        progress: p, stage: next ? (next.kind === "table" ? `table:${next.name}` : next.kind) : "finalizing",
        items_verified: verified ?? 0, step_lock_until: lockUntil,
      }).eq("id", runId).eq("status", "running");
    }
  } catch (e) {
    const msg = redact(e instanceof Error ? e.message : String(e));
    const { count: failed } = await admin.from("backup_items").select("id", { count: "exact", head: true }).eq("run_id", runId).eq("status", "failed");
    await admin.from("backup_runs").update({
      status: "failed", finished_at: new Date().toISOString(), last_error: msg.slice(0, 1900), progress: p,
      items_failed: failed ?? 0, step_lock_until: null,
    }).eq("id", runId).eq("status", "running");
    await afterRun(admin, runId);
    return "done";
  }
  if (p.idx < p.tasks.length) {
    await admin.from("backup_runs").update({ step_lock_until: null }).eq("id", runId);
    return "continue";
  }
  await finalizeFull(admin, cfg, runId, p);
  await afterRun(admin, runId);
  return "done";
}

async function finalizeFull(admin: Admin, cfg: ReceiverConfig, runId: string, p: Progress) {
  const items: { component: string; item_key: string; size_bytes: number; sha256: string; status: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await admin.from("backup_items").select("component, item_key, size_bytes, sha256_expected, status")
      .eq("run_id", runId).neq("item_key", MANIFEST_ITEM_KEY).order("item_key").range(from, from + 999);
    items.push(...(data ?? []).map((d: Progress) => ({ ...d, sha256: d.sha256_expected })));
    if (!data || data.length < 1000) break;
  }
  const notVerified = items.filter((i) => i.status !== "verified");
  const { data: run } = await admin.from("backup_runs").select("created_at, snapshot_at").eq("id", runId).single();
  if (notVerified.length || items.length === 0) {
    await admin.from("backup_runs").update({ status: "failed", finished_at: new Date().toISOString(), items_failed: notVerified.length,
      last_error: "Itens não verificados antes da finalização", step_lock_until: null }).eq("id", runId).eq("status", "running");
    return;
  }
  const manifest = await buildManifest({ project: cfg.project, run_id: runId, created_at: run.created_at, snapshot_at: run.snapshot_at, items });
  await admin.from("backup_items").insert({ run_id: runId, component: "manifest", item_key: MANIFEST_ITEM_KEY, status: "pending", size_bytes: manifest.bytes.length, sha256_expected: manifest.sha256 });
  await admin.from("backup_runs").update({
    status: "finalizing", stage: "finalizing", manifest_sha256: manifest.sha256, items_total: items.length, items_verified: items.length,
    items_failed: 0, bytes_total: items.reduce((n, i) => n + i.size_bytes, 0), step_lock_until: null, progress: p,
  }).eq("id", runId).eq("status", "running");
  const fin = await finalizeRun(cfg, runId, manifest);
  const status = await applyFinalization(makeStore(admin, ""), runId, manifest.sha256, fin);
  await admin.from("backup_runs").update({ stage: status }).eq("id", runId);
}

// ------------------------------------------------------------------ agendamento
export async function afterRun(admin: Admin, runId: string) {
  const { data: run } = await admin.from("backup_runs").select("status, occurrence_key, last_error").eq("id", runId).single();
  if (!run?.occurrence_key) return;
  const { data: occ } = await admin.from("backup_schedule_occurrences").select("attempts").eq("occurrence_key", run.occurrence_key).single();
  const attempts = occ?.attempts ?? 1;
  if (run.status === "complete") {
    await admin.from("backup_schedule_occurrences").update({ status: "complete", last_error: null, updated_at: new Date().toISOString() }).eq("occurrence_key", run.occurrence_key);
    return;
  }
  if (run.status === "finalizing") return; // aguarda reconciliação
  const delay = retryDelayMinutes(attempts);
  await admin.from("backup_schedule_occurrences").update({
    status: "failed", last_error: (run.last_error ?? "falha").slice(0, 500), updated_at: new Date().toISOString(),
  }).eq("occurrence_key", run.occurrence_key);
  if (delay !== null) {
    const at = new Date(Date.now() + delay * 60_000);
    at.setUTCSeconds(0, 0);
    await admin.rpc("backup_schedule_once", { _job: retryJobName(run.occurrence_key), _at: at.toISOString(),
      _body: { mode: "scheduled_run", occurrence: run.occurrence_key, attempt: attempts + 1 } });
    await event(admin, "scheduled_retry_armed", { occurrence: run.occurrence_key, attempt: attempts + 1, at: at.toISOString() });
  } else {
    await event(admin, "scheduled_retries_exhausted", { occurrence: run.occurrence_key });
  }
}

export async function handleScheduled(admin: Admin, body: Progress) {
  if (typeof body.retry_job === "string") await admin.rpc("backup_unschedule_job", { _job: body.retry_job });
  const key = typeof body.occurrence === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/.test(body.occurrence)
    ? body.occurrence : occurrenceKey(body.fired_at ? new Date(body.fired_at) : new Date());
  const attempt = Number.isInteger(body.attempt) ? Math.min(Math.max(body.attempt, 1), 3) : 1;

  // avança a próxima execução exibida
  const { data: sch } = await admin.from("backup_schedules").select("*").eq("id", 1).maybeSingle();
  if (sch?.enabled) {
    const { data: next } = await admin.rpc("backup_compute_next_run", { _freq: sch.frequency, _time: sch.time_of_day, _weekday: sch.weekday, _month_day: sch.month_day });
    await admin.from("backup_schedules").update({ next_run_at: next }).eq("id", 1);
  }

  const { data: existing } = await admin.from("backup_schedule_occurrences").select("*").eq("occurrence_key", key).maybeSingle();
  if (existing && attempt <= existing.attempts) return { outcome: "duplicate", occurrence: key };
  if (existing && ["complete", "running"].includes(existing.status)) return { outcome: "duplicate", occurrence: key };

  const { data: active } = await admin.from("backup_runs").select("id, updated_at").in("status", ["pending", "running", "finalizing"]).maybeSingle();
  if (active) {
    await admin.from("backup_schedule_occurrences").upsert({ occurrence_key: key, scheduled_for: key.replace("Z", ":00Z"), attempts: attempt, status: "skipped_concurrency", run_id: active.id, updated_at: new Date().toISOString() }, { onConflict: "occurrence_key" });
    return { outcome: "skipped_concurrency", occurrence: key, active_run: active.id };
  }
  const row = { occurrence_key: key, scheduled_for: key.replace("Z", ":00Z"), attempts: attempt, status: "running", updated_at: new Date().toISOString() };
  if (existing) {
    const { data: upd } = await admin.from("backup_schedule_occurrences").update(row).eq("occurrence_key", key).eq("attempts", existing.attempts).select("id");
    if (!upd?.length) return { outcome: "duplicate", occurrence: key };
  } else {
    const { error } = await admin.from("backup_schedule_occurrences").insert(row);
    if (error) return { outcome: "duplicate", occurrence: key };
  }
  const started = await startFullRun(admin, { trigger: "scheduled", userId: null, occurrence: key });
  if (started.conflict) {
    await admin.from("backup_schedule_occurrences").update({ status: "skipped_concurrency" }).eq("occurrence_key", key);
    return { outcome: "skipped_concurrency", occurrence: key };
  }
  await admin.from("backup_schedule_occurrences").update({ run_id: started.run_id }).eq("occurrence_key", key);
  return { outcome: "started", occurrence: key, run_id: started.run_id };
}

// Ocorrências que passaram há mais de 10 min sem disparo ficam registradas como "perdidas".
export async function markMissed(admin: Admin) {
  const { data: sch } = await admin.from("backup_schedules").select("*").eq("id", 1).maybeSingle();
  if (!sch?.enabled || !sch.next_run_at) return;
  const due = new Date(sch.next_run_at);
  if (Date.now() - due.getTime() < 10 * 60_000) return;
  const key = occurrenceKey(due);
  await admin.from("backup_schedule_occurrences").upsert({ occurrence_key: key, scheduled_for: due.toISOString(), attempts: 0, status: "missed",
    last_error: "Agendador não disparou no horário" }, { onConflict: "occurrence_key", ignoreDuplicates: true });
  const { data: next } = await admin.rpc("backup_compute_next_run", { _freq: sch.frequency, _time: sch.time_of_day, _weekday: sch.weekday, _month_day: sch.month_day });
  await admin.from("backup_schedules").update({ next_run_at: next }).eq("id", 1);
}
