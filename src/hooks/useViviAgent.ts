import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface ViviAgent {
  id: string;
  company_id: string;
  name: string;
  avatar_url: string | null;
  primary_color: string;
  secondary_color: string;
  tone: string;
  personality: string;
  mode: string;
  status: string;
  continuous_enabled: boolean;
  continuous_interval_minutes: number;
  backfill_status: string;
  backfill_total: number;
  backfill_processed: number;
  backfill_cursor: string | null;
  last_run_at: string | null;
  last_error: string | null;
  daily_requests: number;
  daily_requests_date: string;
  daily_request_limit: number;
  config: Json;
}

export interface ViviInsight {
  id: string;
  company_id: string;
  agent_id: string | null;
  conversation_id: string | null;
  insight_type: string;
  title: string;
  summary: string;
  sentiment: string | null;
  department: string | null;
  topics: string[];
  score: number | null;
  data: Json;
  source_message_count: number;
  analyzed_until: string | null;
  created_at: string;
  updated_at: string;
}

export function useViviAgent() {
  const { company } = useAuth();
  const companyId = company?.id;

  const [agent, setAgent] = useState<ViviAgent | null>(null);
  const [insights, setInsights] = useState<ViviInsight[]>([]);
  const [jobCounts, setJobCounts] = useState({ pending: 0, running: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadAgent = useCallback(async () => {
    if (!companyId) return;
    const { data, error } = await supabase.from("ai_agents").select("*").eq("company_id", companyId).maybeSingle();
    if (error) {
      console.error("Erro ao carregar agente Vivi:", error);
      return;
    }
    setAgent(data as ViviAgent | null);
  }, [companyId]);

  const loadInsights = useCallback(async () => {
    if (!companyId) return;
    const { data, error } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("Erro ao carregar insights Vivi:", error);
      return;
    }
    setInsights((data || []) as ViviInsight[]);
  }, [companyId]);

  const loadJobCounts = useCallback(async () => {
    if (!companyId) return;
    const { count: pending } = await supabase
      .from("ai_learning_jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "pending");
    const { count: running } = await supabase
      .from("ai_learning_jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "running");
    setJobCounts({ pending: pending || 0, running: running || 0 });
  }, [companyId]);

  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadAgent(), loadInsights(), loadJobCounts()]);
    setIsLoading(false);
  }, [loadAgent, loadInsights, loadJobCounts]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel(`vivi-agent-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_agents", filter: `company_id=eq.${companyId}` },
        () => loadAgent(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_insights", filter: `company_id=eq.${companyId}` },
        () => loadInsights(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_learning_jobs", filter: `company_id=eq.${companyId}` },
        () => loadJobCounts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, loadAgent, loadInsights, loadJobCounts]);

  const updateAgent = useCallback(
    async (patch: Partial<ViviAgent>) => {
      if (!agent) return;
      const { error } = await supabase.from("ai_agents").update(patch).eq("id", agent.id);
      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        throw error;
      }
      await loadAgent();
    },
    [agent, loadAgent],
  );

  const toggleStatus = useCallback(async () => {
    if (!agent) return;
    await updateAgent({ status: agent.status === "active" ? "paused" : "active" });
  }, [agent, updateAgent]);

  const runAnalyzeNow = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("vivi-analyze-conversation", {
      body: { mode: "queue", limit: 20 },
    });
    if (error) {
      toast.error("Erro ao executar análise: " + error.message);
      return null;
    }
    if (data?.missingKey) {
      toast.error("Chave do Gemini não configurada. Contate o administrador.");
    } else {
      toast.success(`Análise concluída: ${data?.processed ?? 0} processadas, ${data?.skipped ?? 0} puladas.`);
    }
    await refetchAll();
    return data;
  }, [refetchAll]);

  const backfillAction = useCallback(
    async (action: "start" | "pause" | "resume" | "reset" | "tick") => {
      if (!companyId) return;
      const { data, error } = await supabase.functions.invoke("vivi-backfill", {
        body: { companyId, action },
      });
      if (error) {
        toast.error("Erro no aprendizado: " + error.message);
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      await loadAgent();
    },
    [companyId, loadAgent],
  );

  return {
    agent,
    insights,
    jobCounts,
    isLoading,
    updateAgent,
    toggleStatus,
    runAnalyzeNow,
    backfillAction,
    refetchAll,
  };
}
