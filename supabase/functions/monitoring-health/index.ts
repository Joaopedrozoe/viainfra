import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-monitoring-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CheckStatus = "healthy" | "warning" | "error";

interface ServiceCheck {
  name: string;
  status: CheckStatus;
  message: string;
  details?: Record<string, unknown>;
  responseTimeMs?: number;
}

const HEALTHY_PENDING_THRESHOLD = 20;
const WARNING_PENDING_THRESHOLD = 100;
const WARNING_SYNC_MINUTES = 15;
const ERROR_SYNC_MINUTES = 60;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  const headerToken = req.headers.get("x-monitoring-token");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return headerToken?.trim() ?? "";
}

function diffMinutes(dateString?: string | null) {
  if (!dateString) return null;
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.round((Date.now() - timestamp) / 60000);
}

function statusFromQueueSize(count: number): CheckStatus {
  if (count >= WARNING_PENDING_THRESHOLD) return "error";
  if (count >= HEALTHY_PENDING_THRESHOLD) return "warning";
  return "healthy";
}

function statusFromSyncDelay(minutes: number | null): CheckStatus {
  if (minutes === null) return "warning";
  if (minutes >= ERROR_SYNC_MINUTES) return "error";
  if (minutes >= WARNING_SYNC_MINUTES) return "warning";
  return "healthy";
}

function deriveOverallStatus(checks: ServiceCheck[]): CheckStatus {
  if (checks.some((check) => check.status === "error")) return "error";
  if (checks.some((check) => check.status === "warning")) return "warning";
  return "healthy";
}

async function timedCheck<T>(fn: () => Promise<T>) {
  const start = performance.now();
  const result = await fn();
  return {
    result,
    responseTimeMs: Math.round(performance.now() - start),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const expectedToken = Deno.env.get("MONITORING_API_TOKEN");
  const providedToken = getTokenFromRequest(req);

  if (!expectedToken) {
    return jsonResponse({ success: false, error: "Monitoring token is not configured" }, 500);
  }

  if (!providedToken || providedToken !== expectedToken) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const checks: ServiceCheck[] = [];

    const { result: databaseResult, responseTimeMs: databaseTime } = await timedCheck(async () => {
      const { count, error } = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true });

      return { count, error };
    });

    checks.push({
      name: "database",
      status: databaseResult.error ? "error" : "healthy",
      message: databaseResult.error ? "Falha ao consultar Supabase" : "Supabase respondendo normalmente",
      responseTimeMs: databaseTime,
      details: databaseResult.error
        ? { error: databaseResult.error.message }
        : { companiesCount: databaseResult.count ?? 0 },
    });

    const { result: authResult, responseTimeMs: authTime } = await timedCheck(async () => {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      return { data, error };
    });

    checks.push({
      name: "auth",
      status: authResult.error ? "error" : "healthy",
      message: authResult.error ? "Falha ao consultar Auth" : "Auth operacional",
      responseTimeMs: authTime,
      details: authResult.error
        ? { error: authResult.error.message }
        : { sampledUsers: authResult.data?.users?.length ?? 0 },
    });

    const [
      instancesQuery,
      pendingQueueQuery,
      oldestPendingQuery,
      openConversationsQuery,
      recentMessagesQuery,
      recentUpdatedConversationsQuery,
    ] = await Promise.all([
      supabase
        .from("whatsapp_instances")
        .select("id, company_id, instance_name, status, connection_state, last_sync, updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("message_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("message_queue")
        .select("id, created_at, scheduled_at, updated_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("channel", "whatsapp")
        .in("status", ["open", "pending"]),
      supabase
        .from("messages")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("conversations")
        .select("id, updated_at")
        .eq("channel", "whatsapp")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const instances = instancesQuery.data ?? [];
    const connectedInstances = instances.filter((instance) => instance.connection_state === "open");
    const disconnectedInstances = instances.filter((instance) => instance.connection_state !== "open");
    const oldestPendingAt = oldestPendingQuery.data?.scheduled_at || oldestPendingQuery.data?.created_at || oldestPendingQuery.data?.updated_at;
    const oldestPendingMinutes = diffMinutes(oldestPendingAt);
    const queueStatus = pendingQueueQuery.error
      ? "error"
      : statusFromQueueSize(pendingQueueQuery.count ?? 0);

    checks.push({
      name: "message_queue",
      status: queueStatus,
      message: pendingQueueQuery.error
        ? "Falha ao consultar fila de mensagens"
        : `${pendingQueueQuery.count ?? 0} mensagem(ns) pendente(s)`,
      details: pendingQueueQuery.error
        ? { error: pendingQueueQuery.error.message }
        : {
            pendingCount: pendingQueueQuery.count ?? 0,
            oldestPendingAt,
            oldestPendingMinutes,
          },
    });

    const latestConversationMinutes = diffMinutes(recentUpdatedConversationsQuery.data?.updated_at);
    const latestMessageMinutes = diffMinutes(recentMessagesQuery.data?.created_at);
    const inboxError = openConversationsQuery.error || recentMessagesQuery.error || recentUpdatedConversationsQuery.error;
    const inboxStatus = inboxError
      ? "error"
      : (openConversationsQuery.count ?? 0) === 0
        ? "warning"
        : statusFromSyncDelay(
            latestConversationMinutes !== null
              ? latestConversationMinutes
              : latestMessageMinutes,
          );

    checks.push({
      name: "inbox",
      status: inboxStatus,
      message: inboxError
        ? "Falha ao consultar indicadores do inbox"
        : "Inbox consultável e com atividade monitorada",
      details: inboxError
        ? {
            conversationsError: openConversationsQuery.error?.message,
            messagesError: recentMessagesQuery.error?.message,
            updatedError: recentUpdatedConversationsQuery.error?.message,
          }
        : {
            openConversations: openConversationsQuery.count ?? 0,
            lastMessageAt: recentMessagesQuery.data?.created_at ?? null,
            lastMessageMinutesAgo: latestMessageMinutes,
            lastConversationUpdateAt: recentUpdatedConversationsQuery.data?.updated_at ?? null,
            lastConversationUpdateMinutesAgo: latestConversationMinutes,
          },
    });

    const staleInstances = instances
      .map((instance) => {
        const lastSeenAt = instance.last_sync || instance.updated_at;
        return {
          ...instance,
          minutesSinceSync: diffMinutes(lastSeenAt),
          lastSeenAt,
        };
      })
      .filter((instance) => (instance.minutesSinceSync ?? 0) >= WARNING_SYNC_MINUTES);

    const whatsappStatus: CheckStatus = instancesQuery.error
      ? "error"
      : instances.length === 0
        ? "warning"
        : connectedInstances.length === 0
          ? "error"
          : staleInstances.some((instance) => (instance.minutesSinceSync ?? 0) >= ERROR_SYNC_MINUTES)
            ? "error"
            : disconnectedInstances.length > 0 || staleInstances.length > 0
              ? "warning"
              : "healthy";

    checks.push({
      name: "whatsapp_instances",
      status: whatsappStatus,
      message: instancesQuery.error
        ? "Falha ao consultar instâncias WhatsApp"
        : `${connectedInstances.length}/${instances.length} instância(s) conectada(s)`,
      details: instancesQuery.error
        ? { error: instancesQuery.error.message }
        : {
            totalInstances: instances.length,
            connectedInstances: connectedInstances.length,
            disconnectedInstances: disconnectedInstances.length,
            staleInstances: staleInstances.map((instance) => ({
              instanceName: instance.instance_name,
              connectionState: instance.connection_state,
              minutesSinceSync: instance.minutesSinceSync,
              lastSeenAt: instance.lastSeenAt,
            })),
            instances: instances.slice(0, 20).map((instance) => ({
              instanceName: instance.instance_name,
              companyId: instance.company_id,
              status: instance.status,
              connectionState: instance.connection_state,
              lastSync: instance.last_sync,
              updatedAt: instance.updated_at,
            })),
          },
    });

    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");

    if (!evolutionApiUrl || !evolutionApiKey) {
      checks.push({
        name: "evolution_api",
        status: "error",
        message: "Secrets da Evolution API não configuradas",
      });
    } else {
      const { result: evolutionResult, responseTimeMs: evolutionTime } = await timedCheck(async () => {
        const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionApiKey,
          },
        });

        const text = await response.text();
        let parsed: unknown = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = text;
        }

        return {
          ok: response.ok,
          status: response.status,
          parsed,
        };
      });

      checks.push({
        name: "evolution_api",
        status: evolutionResult.ok ? "healthy" : "error",
        message: evolutionResult.ok ? "Evolution API acessível" : "Falha ao consultar Evolution API",
        responseTimeMs: evolutionTime,
        details: {
          statusCode: evolutionResult.status,
          sample: Array.isArray(evolutionResult.parsed)
            ? { instancesReturned: evolutionResult.parsed.length }
            : { response: evolutionResult.parsed },
        },
      });
    }

    const overallStatus = deriveOverallStatus(checks);
    const generatedAt = new Date().toISOString();

    return jsonResponse({
      success: true,
      status: overallStatus,
      service: "monitoring-health",
      generatedAt,
      summary: {
        totalChecks: checks.length,
        healthy: checks.filter((check) => check.status === "healthy").length,
        warning: checks.filter((check) => check.status === "warning").length,
        error: checks.filter((check) => check.status === "error").length,
      },
      checks,
      metrics: {
        openWhatsappConversations: openConversationsQuery.count ?? 0,
        pendingQueueMessages: pendingQueueQuery.count ?? 0,
        connectedWhatsappInstances: connectedInstances.length,
        totalWhatsappInstances: instances.length,
        lastInboxMessageAt: recentMessagesQuery.data?.created_at ?? null,
        oldestPendingQueueAt: oldestPendingAt ?? null,
      },
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      generatedAt: new Date().toISOString(),
    }, 500);
  }
});