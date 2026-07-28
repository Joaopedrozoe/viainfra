import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import {
  AlertTriangle,
  Download,
  FolderOpen,
  Loader2,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import {
  ChatAnalysis,
  ChatImportResult,
  ImportJobState,
  ImportProgress,
  analyzeChats,
  buildCsvReport,
  clearResumeState,
  getCompletedFolders,
  getLatestImportJob,
  groupFilesIntoChats,
  markJobInterrupted,
  runImport,
} from "@/lib/backup-import";

type Phase = "idle" | "analyzing" | "review" | "importing" | "done";

const matchBadge = (analysis: ChatAnalysis) => {
  switch (analysis.matchKind) {
    case "conversation":
      return <Badge variant="secondary">Conversa existente</Badge>;
    case "contact":
      return <Badge variant="outline">Contato existente</Badge>;
    default:
      return <Badge>Nova</Badge>;
  }
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

export function BackupImport() {
  const { company } = useAuth();
  const companyId = company?.id || "";

  const inputRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [analyses, setAnalyses] = useState<ChatAnalysis[]>([]);
  const [analyzeProgress, setAnalyzeProgress] = useState({ done: 0, total: 0, current: "" });
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [results, setResults] = useState<ChatImportResult[]>([]);
  const [withMedia, setWithMedia] = useState(true);
  const [limitPilot, setLimitPilot] = useState(true);
  const [lastJob, setLastJob] = useState<ImportJobState | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Recupera o andamento do último lote gravado no banco (sobrevive a recarregar a aba)
  useEffect(() => {
    if (!companyId) return;
    let active = true;

    const load = async () => {
      const job = await getLatestImportJob(companyId);
      if (active) setLastJob(job);
    };

    load();
    const timer = window.setInterval(load, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [companyId]);

  // Se a aba fechar durante a importação, o job fica marcado como interrompido
  useEffect(() => {
    const onUnload = () => {
      if (jobIdRef.current) void markJobInterrupted(jobIdRef.current);
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const totals = useMemo(() => {
    const selected = analyses.filter((a) => a.selected);
    return {
      chats: selected.length,
      messages: selected.reduce((sum, a) => sum + a.chat.messages.length, 0),
      media: selected.reduce((sum, a) => sum + a.chat.mediaCount, 0),
      novas: selected.filter((a) => a.matchKind === "new").length,
    };
  }, [analyses]);

  const handlePickFolder = () => inputRef.current?.click();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !companyId) return;
    const folders = groupFilesIntoChats(Array.from(fileList));

    if (folders.length === 0) {
      toast.error("Nenhuma conversa encontrada", {
        description: "A pasta selecionada precisa conter subpastas com um arquivo .html cada.",
      });
      return;
    }

    setPhase("analyzing");
    setResults([]);
    setAnalyzeProgress({ done: 0, total: folders.length, current: "" });

    try {
      const done = getCompletedFolders(companyId);
      const parsed = await analyzeChats(folders, companyId, (d, total, current) =>
        setAnalyzeProgress({ done: d, total, current }),
      );
      setAnalyses(
        parsed.map((a) => ({
          ...a,
          selected: a.selected && !done.has(a.folder.folderPath),
        })),
      );
      setPhase("review");
    } catch (error) {
      console.error(error);
      toast.error("Falha ao analisar o backup", {
        description: error instanceof Error ? error.message : undefined,
      });
      setPhase("idle");
    }
  };

  const toggleAll = (value: boolean) =>
    setAnalyses((prev) => prev.map((a) => ({ ...a, selected: value && a.chat.messages.length > 0 })));

  const toggleOne = (folderPath: string) =>
    setAnalyses((prev) =>
      prev.map((a) =>
        a.folder.folderPath === folderPath ? { ...a, selected: !a.selected } : a,
      ),
    );

  const handleStart = async () => {
    if (!companyId) return;
    stopRef.current = false;
    setPhase("importing");

    const selected = analyses.filter((a) => a.selected);
    const scoped = limitPilot ? selected.slice(0, 1) : selected;

    setProgress({
      currentIndex: 0,
      total: scoped.length,
      currentChat: "",
      imported: 0,
      skipped: 0,
      mediaUploaded: 0,
      errors: 0,
    });

    try {
      const res = await runImport({
        companyId,
        analyses: scoped,
        uploadMediaFiles: withMedia,
        onProgress: setProgress,
        shouldStop: () => stopRef.current,
        onJobCreated: (id) => {
          jobIdRef.current = id;
        },
      });
      setResults(res);
      setPhase("done");
      jobIdRef.current = null;
      setLastJob(await getLatestImportJob(companyId));
      const totalImported = res.reduce((s, r) => s + r.imported, 0);
      toast.success(`Importação concluída: ${totalImported} mensagens novas`);
    } catch (error) {
      console.error(error);
      jobIdRef.current = null;
      toast.error("Falha na importação", {
        description: error instanceof Error ? error.message : undefined,
      });
      setPhase("review");
    }
  };

  const handleDownloadReport = () => {
    const csv = buildCsvReport(results);
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-importacao-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar backup de conversas</CardTitle>
          <CardDescription>
            Selecione a pasta do backup (a pasta que contém uma subpasta por conversa). A análise é
            feita no seu navegador e nada é gravado antes da sua confirmação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Empresa de destino: {company?.name || "—"}</AlertTitle>
            <AlertDescription>
              Tudo será importado para esta empresa. Troque de empresa no seletor do topo antes de
              importar o backup da outra.
            </AlertDescription>
          </Alert>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            // @ts-expect-error atributo não tipado pelo React
            webkitdirectory=""
            directory=""
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePickFolder} disabled={phase === "analyzing" || phase === "importing"}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Selecionar pasta do backup
            </Button>
            {companyId && (
              <Button
                variant="outline"
                onClick={() => {
                  clearResumeState(companyId);
                  toast.success("Histórico de retomada limpo");
                }}
                disabled={phase === "importing"}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar estado de retomada
              </Button>
            )}
          </div>

          {phase === "analyzing" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando {analyzeProgress.done} de {analyzeProgress.total} —{" "}
                {analyzeProgress.current}
              </div>
              <Progress
                value={
                  analyzeProgress.total
                    ? (analyzeProgress.done / analyzeProgress.total) * 100
                    : 0
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {(phase === "review" || phase === "importing" || phase === "done") && analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisão ({analyses.length} conversas encontradas)</CardTitle>
            <CardDescription>
              {totals.chats} selecionadas · {totals.messages.toLocaleString("pt-BR")} mensagens ·{" "}
              {totals.media.toLocaleString("pt-BR")} mídias · {totals.novas} conversas novas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="media" checked={withMedia} onCheckedChange={setWithMedia} />
                <Label htmlFor="media">Enviar mídias para o Storage</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="pilot" checked={limitPilot} onCheckedChange={setLimitPilot} />
                <Label htmlFor="pilot">Piloto (importar só a 1ª conversa)</Label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                Selecionar todas
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                Limpar seleção
              </Button>
            </div>

            <ScrollArea className="h-[420px] rounded-md border">
              <div className="divide-y">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.folder.folderPath}
                    className="flex items-start gap-3 p-3 text-sm"
                  >
                    <Checkbox
                      checked={analysis.selected}
                      onCheckedChange={() => toggleOne(analysis.folder.folderPath)}
                      disabled={phase === "importing"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">
                          {analysis.chat.htmlTitle || analysis.folder.folderName}
                        </span>
                        {matchBadge(analysis)}
                        {analysis.chat.isGroup && <Badge variant="outline">Grupo</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.chat.messages.length} mensagens ·{" "}
                        {analysis.chat.mediaCount} mídias · {formatDate(analysis.chat.firstMessageAt)}{" "}
                        a {formatDate(analysis.chat.lastMessageAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.matchReason}
                        {analysis.matchedName ? ` → ${analysis.matchedName}` : ""}
                        {analysis.chat.withoutStanzaId > 0
                          ? ` · ${analysis.chat.withoutStanzaId} sem ID (dedupe por texto+horário)`
                          : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex flex-wrap gap-3">
              {phase !== "importing" ? (
                <Button onClick={handleStart} disabled={totals.chats === 0}>
                  <Play className="mr-2 h-4 w-4" />
                  {limitPilot ? "Importar 1 conversa (piloto)" : `Importar ${totals.chats} conversas`}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => {
                    stopRef.current = true;
                    toast.info("Parando após a conversa atual…");
                  }}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Parar
                </Button>
              )}
              {results.length > 0 && (
                <Button variant="outline" onClick={handleDownloadReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar relatório
                </Button>
              )}
            </div>

            {progress && (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {phase === "importing" ? progress.currentChat : "Concluído"}
                  </span>
                  <span className="text-muted-foreground">
                    {progress.currentIndex}/{progress.total}
                  </span>
                </div>
                <Progress
                  value={progress.total ? (progress.currentIndex / progress.total) * 100 : 0}
                />
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{progress.imported} importadas</span>
                  <span>{progress.skipped} duplicadas/ignoradas</span>
                  <span>{progress.mediaUploaded} mídias enviadas</span>
                  <span>{progress.errors} erros</span>
                </div>
              </div>
            )}

            {results.some((r) => r.error) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Algumas conversas falharam</AlertTitle>
                <AlertDescription className="space-y-1">
                  {results
                    .filter((r) => r.error)
                    .slice(0, 5)
                    .map((r) => (
                      <div key={r.folderName} className="text-xs">
                        {r.folderName}: {r.error}
                      </div>
                    ))}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BackupImport;
