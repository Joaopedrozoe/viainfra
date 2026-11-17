import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { buildTasks, occurrenceKey, partKey, retryDelayMinutes, retryJobName, storageItemKey } from "./plan.ts";

Deno.test("tarefas excluem a tabela com a chave interna e seguem a ordem esperada", () => {
  const t = buildTasks(["messages", "backup_internal_config", "contacts"]);
  assertEquals(t.map((x) => x.kind === "table" ? x.name : x.kind),
    ["schema", "contacts", "messages", "storage", "storage_index", "source", "inventory"]);
});

Deno.test("mesmo minuto gera a mesma ocorrência (idempotência)", () => {
  assertEquals(occurrenceKey(new Date("2026-10-27T06:00:03.120Z")), "2026-10-27T06:00Z");
  assertEquals(occurrenceKey(new Date("2026-10-27T06:00:59Z")), occurrenceKey(new Date("2026-10-27T06:00:00Z")));
});

Deno.test("no máximo três tentativas: 5 min, 15 min, depois nenhuma", () => {
  assertEquals(retryDelayMinutes(1), 5);
  assertEquals(retryDelayMinutes(2), 15);
  assertEquals(retryDelayMinutes(3), null);
});

Deno.test("chaves aceitas pelo receptor", () => {
  const re = /^[a-z0-9._/-]{1,512}$/;
  assertEquals(re.test(partKey("messages", 12)), true);
  assertEquals(partKey("messages", 12), "db/data/messages/part-00012.json.gz");
  assertEquals(re.test(storageItemKey("whatsapp-media", "6D611F37-E32D-4E60-A48E-7D5DF689FB68")), true);
  assertEquals(/^backup-retry-[a-z0-9]+$/.test(retryJobName("2026-10-27T06:00Z")), true);
});

Deno.test("orderKeyFor usa a chave primária real", async () => {
  const { orderKeyFor } = await import("./plan.ts");
  if (orderKeyFor("conversation_reads") !== "conversation_id") throw new Error("conversation_reads");
  if (orderKeyFor("user_presence") !== "user_id") throw new Error("user_presence");
  if (orderKeyFor("messages") !== "id") throw new Error("messages");
});
