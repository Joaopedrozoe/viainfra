// Regras puras do backup completo (testáveis sem rede/banco).

export const EXCLUDED_TABLES = new Set(["backup_internal_config"]); // contém a chave interna do agendador
export const EXCLUDED_BUCKETS = new Set(["backup-source"]); // o snapshot de código entra como componente "source"
export const MAX_ATTEMPTS = 3;

export type Task =
  | { kind: "schema" }
  | { kind: "table"; name: string }
  | { kind: "storage" }
  | { kind: "storage_index" }
  | { kind: "source" }
  | { kind: "inventory" };

export function buildTasks(tableNames: string[]): Task[] {
  const tables = tableNames.filter((t) => !EXCLUDED_TABLES.has(t) && /^[a-z0-9_]+$/.test(t)).sort();
  return [
    { kind: "schema" },
    ...tables.map((name) => ({ kind: "table" as const, name })),
    { kind: "storage" },
    { kind: "storage_index" },
    { kind: "source" },
    { kind: "inventory" },
  ];
}

export const pageSizeFor = (table: string) => (table === "messages" || table === "webhook_events" ? 500 : 1000);

export const partKey = (table: string, part: number) =>
  `db/data/${table}/part-${String(part).padStart(5, "0")}.json.gz`;

export const storageItemKey = (bucket: string, objectId: string) => {
  const b = bucket.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `storage/${b}/${objectId.toLowerCase()}.bin`;
};

// Chave de ocorrência: minuto UTC em que o agendador disparou.
export function occurrenceKey(firedAt: Date): string {
  const d = new Date(firedAt);
  d.setUTCSeconds(0, 0);
  return d.toISOString().slice(0, 16) + "Z";
}

// Tentativa 1 falhou → nova em 5 min; tentativa 2 → 15 min; tentativa 3 → nenhuma.
export function retryDelayMinutes(failedAttempt: number): number | null {
  if (failedAttempt >= MAX_ATTEMPTS) return null;
  return failedAttempt === 1 ? 5 : 15;
}

export const retryJobName = (key: string) => `backup-retry-${key.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
