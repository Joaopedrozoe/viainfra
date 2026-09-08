import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Bot, RefreshCw, Sparkles } from "lucide-react";
import { PlanGate } from "@/components/ui/plan-gate";
import { PLAN_FEATURES } from "@/types/plans";
import { useViviAgent, type ViviInsight } from "@/hooks/useViviAgent";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import viviVialogistic from "@/assets/vivi-vialogistic.jpg";
import viviViainfra from "@/assets/vivi-viainfra.jpg";

const SENTIMENT_LABEL: Record<string, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

const SENTIMENT_BADGE_VARIANT: Record<string, string> = {
  positivo: "bg-green-100 text-green-800",
  neutro: "bg-gray-100 text-gray-800",
  negativo: "bg-red-100 text-red-800",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const Agents = () => {
  const navigate = useNavigate();
  const { agent, insights, jobCounts, isLoading, updateAgent, toggleStatus, runAnalyzeNow, backfillAction } = useViviAgent();
  const [isRunningNow, setIsRunningNow] = useState(false);

  const [periodFilter, setPeriodFilter] = useState<"all" | "7" | "30">("30");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [formName, setFormName] = useState<string | null>(null);
  const [formTone, setFormTone] = useState<string | null>(null);
  const [formPersonality, setFormPersonality] = useState<string | null>(null);
  const [formPrimary, setFormPrimary] = useState<string | null>(null);
  const [formSecondary, setFormSecondary] = useState<string | null>(null);
  const [formModel, setFormModel] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredInsights = useMemo(() => {
    const now = Date.now();
    return insights.filter((insight: ViviInsight) => {
      if (periodFilter !== "all") {
        const days = Number(periodFilter);
        const created = new Date(insight.created_at).getTime();
        if (now - created > days * 24 * 60 * 60 * 1000) return false;
      }
      if (sentimentFilter !== "all" && insight.sentiment !== sentimentFilter) return false;
      if (departmentFilter !== "all" && insight.department !== departmentFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${insight.title} ${insight.summary} ${(insight.topics || []).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [insights, periodFilter, sentimentFilter, departmentFilter, search]);

  const kpis = useMemo(() => {
    const total = filteredInsights.length;
    const sentimentCounts = { positivo: 0, neutro: 0, negativo: 0 } as Record<string, number>;
    let scoreSum = 0;
    let scoreCount = 0;
    const topicFreq = new Map<string, number>();
    const departmentFreq = new Map<string, number>();
    const unresolvedQuestions: string[] = [];
    const quickReplies = new Set<string>();

    for (const insight of filteredInsights) {
      if (insight.sentiment && sentimentCounts[insight.sentiment] !== undefined) {
        sentimentCounts[insight.sentiment]++;
      }
      if (typeof insight.score === "number") {
        scoreSum += insight.score;
        scoreCount++;
      }
      for (const topic of insight.topics || []) {
        topicFreq.set(topic, (topicFreq.get(topic) || 0) + 1);
      }
      if (insight.department) {
        departmentFreq.set(insight.department, (departmentFreq.get(insight.department) || 0) + 1);
      }
      const data = (insight.data || {}) as any;
      for (const q of data.unresolved_questions || []) unresolvedQuestions.push(q);
      for (const r of data.suggested_quick_replies || []) quickReplies.add(r);
    }

    const topTopics = Array.from(topicFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const topDepartments = Array.from(departmentFreq.entries()).sort((a, b) => b[1] - a[1]);

    return {
      total,
      sentimentCounts,
      avgScore: scoreCount ? Math.round((scoreSum / scoreCount) * 10) / 10 : null,
      topTopics,
      topDepartments,
      unresolvedQuestions: unresolvedQuestions.slice(0, 10),
      quickReplies: Array.from(quickReplies).slice(0, 10),
    };
  }, [filteredInsights]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando Vivi...</div>;
  }

  if (!agent) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Vivi ainda não foi configurada</h3>
        <p className="text-muted-foreground">Fale com o administrador para provisionar o agente de IA desta empresa.</p>
      </div>
    );
  }

  const cssVars = {
    ["--vivi-primary" as any]: agent.primary_color,
    ["--vivi-secondary" as any]: agent.secondary_color,
  };

  const showGeminiAlert = !!agent.last_error && agent.last_error.toLowerCase().includes("gemini");

  const dailyPct = agent.daily_request_limit > 0 ? Math.min(100, Math.round((agent.daily_requests / agent.daily_request_limit) * 100)) : 0;
  const backfillPct = agent.backfill_total > 0 ? Math.min(100, Math.round((agent.backfill_processed / agent.backfill_total) * 100)) : 0;

  const handleSavePersonality = async () => {
    setIsSaving(true);
    try {
      const config = { ...(agent.config as any), model: formModel ?? (agent.config as any)?.model ?? "gemini-2.0-flash" };
      await updateAgent({
        name: formName ?? agent.name,
        tone: formTone ?? agent.tone,
        personality: formPersonality ?? agent.personality,
        primary_color: formPrimary ?? agent.primary_color,
        secondary_color: formSecondary ?? agent.secondary_color,
        config,
      });
      toast.success("Personalidade da Vivi atualizada!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunNow = async () => {
    setIsRunningNow(true);
    try {
      await runAnalyzeNow();
    } finally {
      setIsRunningNow(false);
    }
  };

  return (
    <PlanGate feature={PLAN_FEATURES.AI_AGENTS}>
      <div className="flex h-full overflow-hidden">
        <main className="h-full overflow-auto w-full" style={cssVars}>
          <div className="p-4 space-y-4">
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-semibold overflow-hidden shrink-0"
                  style={{ backgroundColor: "var(--vivi-primary)" }}
                >
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt={agent.name} className="h-full w-full object-cover" />
                  ) : (
                    initials(agent.name || "Vivi")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold truncate">{agent.name}</h1>
                    <Badge variant="secondary" style={{ backgroundColor: "var(--vivi-secondary)", color: "white" }}>
                      Modo aprendizado
                    </Badge>
                    <Badge variant={agent.status === "active" ? "default" : "outline"}>
                      {agent.status === "active" ? "Ativa" : "Pausada"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {agent.tone ? `Tom: ${agent.tone}` : "Assistente de IA em modo aprendizado"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground">{agent.status === "active" ? "Ativa" : "Pausada"}</span>
                  <Switch checked={agent.status === "active"} onCheckedChange={() => toggleStatus()} />
                </div>
              </CardContent>
            </Card>

            {showGeminiAlert && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Chave do Gemini não configurada</AlertTitle>
                <AlertDescription>
                  A Vivi não consegue analisar conversas porque a chave do Gemini precisa ser configurada pelo
                  administrador do sistema.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="insights" className="space-y-4">
              <TabsList className="grid w-full max-w-xl grid-cols-3">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="aprendizado">Aprendizado</TabsTrigger>
                <TabsTrigger value="personalidade">Personalidade</TabsTrigger>
              </TabsList>

              <TabsContent value="insights" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Conversas analisadas</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">{kpis.total}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Sentimento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      {(["positivo", "neutro", "negativo"] as const).map((s) => {
                        const pct = kpis.total ? Math.round(((kpis.sentimentCounts[s] || 0) / kpis.total) * 100) : 0;
                        return (
                          <div key={s} className="flex items-center gap-2">
                            <span className="w-16 shrink-0">{SENTIMENT_LABEL[s]}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{ width: `${pct}%`, backgroundColor: "var(--vivi-primary)" }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Nota média de atendimento</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">
                      {kpis.avgScore !== null ? kpis.avgScore.toFixed(1) : "—"}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Tópicos mais frequentes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {kpis.topTopics.length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
                    {kpis.topTopics.map(([topic, count]) => {
                      const max = kpis.topTopics[0]?.[1] || 1;
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={topic} className="flex items-center gap-2 text-sm">
                          <span className="w-40 truncate">{topic}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full" style={{ width: `${pct}%`, backgroundColor: "var(--vivi-secondary)" }} />
                          </div>
                          <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Perguntas não resolvidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {kpis.unresolvedQuestions.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhuma identificada.</p>
                      )}
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {kpis.unresolvedQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">Respostas rápidas sugeridas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {kpis.quickReplies.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhuma sugestão ainda.</p>
                      )}
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {kpis.quickReplies.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-sm text-muted-foreground">Conversas analisadas</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Últimos 7 dias</SelectItem>
                          <SelectItem value="30">Últimos 30 dias</SelectItem>
                          <SelectItem value="all">Todo período</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue placeholder="Sentimento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Sentimento</SelectItem>
                          <SelectItem value="positivo">Positivo</SelectItem>
                          <SelectItem value="neutro">Neutro</SelectItem>
                          <SelectItem value="negativo">Negativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue placeholder="Setor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Setor</SelectItem>
                          {kpis.topDepartments.map(([dep]) => (
                            <SelectItem key={dep} value={dep}>
                              {dep}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 w-40 text-xs"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {filteredInsights.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum insight encontrado com os filtros atuais.</p>
                    )}
                    {filteredInsights.slice(0, 50).map((insight) => (
                      <button
                        key={insight.id}
                        onClick={() => insight.conversation_id && navigate(`/inbox?conversation=${insight.conversation_id}`)}
                        className="w-full text-left border rounded-md p-3 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{insight.title}</span>
                          {insight.sentiment && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${SENTIMENT_BADGE_VARIANT[insight.sentiment] || ""}`}>
                              {SENTIMENT_LABEL[insight.sentiment] || insight.sentiment}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.summary}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {insight.department && <Badge variant="outline" className="text-xs">{insight.department}</Badge>}
                          {typeof insight.score === "number" && (
                            <Badge variant="outline" className="text-xs">Nota: {insight.score}</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="aprendizado" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Backfill (análise do histórico)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          {agent.backfill_processed} / {agent.backfill_total} conversas
                        </span>
                        <span className="text-muted-foreground">Status: {agent.backfill_status}</span>
                      </div>
                      <Progress value={backfillPct} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => backfillAction("start")} disabled={agent.backfill_status === "running"}>
                        Iniciar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => backfillAction("pause")} disabled={agent.backfill_status !== "running"}>
                        Pausar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => backfillAction("resume")} disabled={agent.backfill_status !== "paused"}>
                        Retomar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => backfillAction("reset")}>
                        Reiniciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Aprendizado contínuo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="continuous-switch">Analisar novas conversas automaticamente</Label>
                      <Switch
                        id="continuous-switch"
                        checked={agent.continuous_enabled}
                        onCheckedChange={(checked) => updateAgent({ continuous_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="whitespace-nowrap">Intervalo (min)</Label>
                      <Input
                        type="number"
                        min={5}
                        className="w-24"
                        defaultValue={agent.continuous_interval_minutes}
                        onBlur={(e) => {
                          const value = Number(e.target.value);
                          if (value && value !== agent.continuous_interval_minutes) {
                            updateAgent({ continuous_interval_minutes: value });
                          }
                        }}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Uso diário do Gemini</span>
                        <span className="text-muted-foreground">
                          {agent.daily_requests} / {agent.daily_request_limit}
                        </span>
                      </div>
                      <Progress value={dailyPct} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Última execução: </span>
                        {agent.last_run_at ? new Date(agent.last_run_at).toLocaleString("pt-BR") : "Nunca"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Jobs pendentes/rodando: </span>
                        {jobCounts.pending} / {jobCounts.running}
                      </div>
                    </div>

                    {agent.last_error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{agent.last_error}</AlertDescription>
                      </Alert>
                    )}

                    <Button onClick={handleRunNow} disabled={isRunningNow} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${isRunningNow ? "animate-spin" : ""}`} />
                      Analisar agora
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personalidade">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Personalidade da Vivi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-xl">
                    <div>
                      <Label>Nome</Label>
                      <Input defaultValue={agent.name} onChange={(e) => setFormName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Tom de voz</Label>
                      <Input
                        defaultValue={agent.tone}
                        placeholder="Ex: cordial e objetivo"
                        onChange={(e) => setFormTone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Personalidade</Label>
                      <Textarea
                        defaultValue={agent.personality}
                        placeholder="Descreva como a Vivi deve interpretar as conversas"
                        onChange={(e) => setFormPersonality(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cor primária</Label>
                        <Input
                          type="color"
                          defaultValue={agent.primary_color}
                          className="h-10 p-1"
                          onChange={(e) => setFormPrimary(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Cor secundária</Label>
                        <Input
                          type="color"
                          defaultValue={agent.secondary_color}
                          className="h-10 p-1"
                          onChange={(e) => setFormSecondary(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Modelo Gemini</Label>
                      <Select
                        defaultValue={(agent.config as any)?.model || "gemini-2.0-flash"}
                        onValueChange={(v) => setFormModel(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                          <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSavePersonality} disabled={isSaving} className="gap-2">
                      <Bot className="h-4 w-4" />
                      Salvar
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </PlanGate>
  );
};

export default Agents;
