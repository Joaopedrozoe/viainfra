import type { BackupStore } from "../_shared/backup-client.ts";

// deno-lint-ignore no-explicit-any
export function makeStore(admin: any, userId: string): BackupStore {
  return {
    async createRun(v) {
      const { data, error } = await admin.from("backup_runs").insert({
        status: "running", trigger_type: "manual", requested_by: userId, started_at: new Date().toISOString(), ...v,
      }).select("id, created_at").single();
      if (error || !data) throw new Error("Falha ao registrar execução");
      return data;
    },
    async insertItems(runId, items) {
      const { error } = await admin.from("backup_items").insert(items.map((i) => ({ run_id: runId, status: "pending", ...i })));
      if (error) throw new Error("Falha ao registrar itens");
    },
    async updateItem(runId, itemKey, patch) {
      await admin.from("backup_items").update(patch).eq("run_id", runId).eq("item_key", itemKey);
    },
    async getRun(runId) {
      const { data } = await admin.from("backup_runs").select("id, status, manifest_sha256, receiver_confirmed_at").eq("id", runId).maybeSingle();
      return data ?? null;
    },
    async updateRunIf(runId, fromStatus, patch) {
      const { data, error } = await admin.from("backup_runs").update(patch).eq("id", runId).eq("status", fromStatus).select("id");
      return !error && Array.isArray(data) && data.length === 1;
    },
  };
}
