import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DatabaseBackup, Loader2, ShieldCheck, ShieldAlert, CalendarClock, History } from "lucide-react";
import { Link } from "react-router-dom";

const TZ = "America/Sao_Paulo";
const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }) : "—";
const bytes = (n?: number | null) => {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"]; let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i ? 1 : 0)} ${u[i]}`;
};
const duration = (a?: string | null, b?: string | null) => {
  if (!a || !b) return "—";
  const s = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}min ${s % 60}s`;
};

// deno-lint-ignore no-explicit-any
type Run = any;

function statusInfo(r: Run): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (r.status === "complete") return { label: "Concluído com integridade verificada", variant: "default" };
  if (r.status === "finalizing") return { label: r.last_error ? "Validação pendente" : "Finalizando no receptor", variant: "secondary" };
  if (r.status === "running") return { label: "Em andamento", variant: "secondary" };
  if (r.status === "pending") return { label: "Aguardando execução", variant: "outline" };
  if (r.status === "incomplete") return { label: "Incompleto · integridade não confirmada", variant: "destructive" };
  if (r.status === "failed") return { label: "Falhou", variant: "destructive" };
  return { label: r.status, variant: "outline" };
}

const isFull = (r: Run) => r?.progress?.scope === "full";
const sumValues = (o: Record<string, unknown> | undefined): number => Object.values(o ?? {}).reduce<number>((n, v) => n + Number(v), 0);
const totalRows = (r: Run): number => sumValues(r?.progress?.table_rows);
const totalFiles = (r: Run): number => sumValues(r?.progress?.storage_files);

function stageLabel(r: Run) {
  const s: string = r.stage ?? "";
  if (s.startsWith("table:")) return `Exportando tabela ${s.slice(6)}`;
  return ({ schema: "Estrutura do banco", storage: "Arquivos (imagens e comprovantes)", storage_index: "Índice dos arquivos",
    source: "Código-fonte", inventory: "Inventário de configurações", finalizing: "Finalizando no receptor",
    complete: "Concluído", failed: "Falhou" } as Record<string, string>)[s] ?? (s || "—");
}

export default function Backups() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detail, setDetail] = useState<Run | null>(null);

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["backup-is-admin", profile?.user_id],
    enabled: !!profile?.user_id,
    queryFn: async () => {
      const { data } = await supabase.rpc("is_admin", { _user_id: profile!.user_id });
      return data === true;
    },
  });

  const runs = useQuery({
    queryKey: ["backup-runs"],
    enabled: isAdmin === true,
    refetchInterval: (q) => ((q.state.data as Run[] | undefined)?.some((r) => ["running", "finalizing", "pending"].includes(r.status)) ? 4000 : 30000),
    queryFn: async () => {
      const { data, error } = await supabase.from("backup_runs").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as Run[];
    },
  });

  // Mantém a execução viva: se ficou parada, o servidor retoma; também marca horários perdidos.
  const status = useQuery({
    queryKey: ["backup-status"],
    enabled: isAdmin === true,
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("backup-export-schema", { body: { mode: "status" } });
      if (error) throw error;
      return data as { cron_jobs: { jobname: string; schedule: string; active: boolean }[]; cron_history: { jobname: string; status: string; start_time: string }[] };
    },
  });

  const schedule = useQuery({
    queryKey: ["backup-schedule"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data } = await supabase.from("backup_schedules").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });
  const occurrences = useQuery({
    queryKey: ["backup-occurrences"],
    enabled: isAdmin === true,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase.from("backup_schedule_occurrences").select("*").order("scheduled_for", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const start = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("backup-export-schema", { body: { mode: "start" } });
      if (error) throw new Error((await (error as { context?: Response }).context?.json?.().catch(() => null))?.error ?? error.message);
      return data as { run_id: string };
    },
    onSuccess: (d) => { toast.success(`Backup iniciado (${d.run_id.slice(0, 8)})`); qc.invalidateQueries({ queryKey: ["backup-runs"] }); },
    onError: (e: Error) => toast.error(e.message || "Não foi possível iniciar"),
  });

  const active = runs.data?.find((r) => ["running", "finalizing", "pending"].includes(r.status));

  if (roleLoading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Acesso restrito a administradores.</div>;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-4 pb-16 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <Link to="/settings" className="text-sm text-muted-foreground hover:underline">← Configurações</Link>
            <h1 className="text-2xl font-bold flex items-center gap-2"><DatabaseBackup className="h-6 w-6" /> Backups e Recuperação</h1>
            <p className="text-sm text-muted-foreground">Cópia externa na EC2: dados, arquivos, estrutura e código. Fuso: {TZ}.</p>
          </div>
          <Button size="lg" disabled={!!active || start.isPending} onClick={() => setConfirmOpen(true)}>
            {start.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DatabaseBackup className="h-4 w-4 mr-2" />}
            Executar backup agora
          </Button>
        </div>

        {active && <ActiveRun run={active} />}

        <ScheduleCard schedule={schedule.data} occurrences={occurrences.data ?? []} cronJobs={status.data?.cron_jobs ?? []}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["backup-schedule"] }); qc.invalidateQueries({ queryKey: ["backup-status"] }); }} />

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {runs.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : runs.error ? (
              <p className="text-destructive text-sm">Erro ao carregar o histórico.</p>
            ) : !runs.data?.length ? <p className="text-sm text-muted-foreground">Nenhum backup ainda.</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>ID</TableHead><TableHead>Origem</TableHead><TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead><TableHead>Duração</TableHead><TableHead>Tamanho</TableHead>
                  <TableHead>Registros</TableHead><TableHead>Arquivos</TableHead><TableHead>Restauração</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {runs.data.map((r) => {
                    const s = statusInfo(r);
                    return (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setDetail(r)}>
                        <TableCell className="whitespace-nowrap">{fmt(r.started_at ?? r.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                        <TableCell>{r.trigger_type === "scheduled" ? "Agendada" : "Manual"}</TableCell>
                        <TableCell>{isFull(r) ? "Completo" : "Só estrutura"}</TableCell>
                        <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                        <TableCell>{duration(r.started_at, r.finished_at)}</TableCell>
                        <TableCell>{bytes(r.bytes_total)}</TableCell>
                        <TableCell>{isFull(r) ? totalRows(r).toLocaleString("pt-BR") : "—"}</TableCell>
                        <TableCell>{isFull(r) ? totalFiles(r) : "—"}</TableCell>
                        <TableCell className="text-xs">{r.restore_tested_at ? `Testada ${fmt(r.restore_tested_at)}` : "Não testada"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Executar backup completo agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Envia para a EC2 a estrutura, os dados de todas as tabelas, os arquivos e o código. Leva alguns minutos e continua mesmo se você fechar esta página.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => start.mutate()}>Iniciar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RunDetail run={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function ActiveRun({ run }: { run: Run }) {
  const tasks = run.progress?.tasks?.length ?? 0;
  const done = Math.min(run.progress?.idx ?? 0, tasks);
  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> {statusInfo(run).label}</CardTitle>
        <CardDescription>Execução {run.id} · iniciada {fmt(run.started_at)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
        <div><span className="text-muted-foreground">Etapa atual:</span> {stageLabel(run)}</div>
        <div><span className="text-muted-foreground">Etapas concluídas:</span> {done} de {tasks}</div>
        <div><span className="text-muted-foreground">Itens confirmados pela EC2:</span> {run.items_verified}</div>
        <div><span className="text-muted-foreground">Registros exportados:</span> {totalRows(run).toLocaleString("pt-BR")} · Arquivos: {totalFiles(run)}</div>
      </CardContent>
    </Card>
  );
}

function ScheduleCard({ schedule, occurrences, cronJobs, onSaved }: {
  // deno-lint-ignore no-explicit-any
  schedule: any; occurrences: any[]; cronJobs: { jobname: string; schedule: string }[]; onSaved: () => void;
}) {
  const [form, setForm] = useState<{ enabled: boolean; frequency: string; time: string; weekday: number; monthDay: number } | null>(null);
  const f = form ?? {
    enabled: schedule?.enabled ?? false, frequency: schedule?.frequency ?? "daily",
    time: (schedule?.time_of_day ?? "03:00").slice(0, 5), weekday: schedule?.weekday ?? 0, monthDay: schedule?.month_day ?? 1,
  };
  const set = (p: Partial<typeof f>) => setForm({ ...f, ...p });
  const save = useMutation({
    mutationFn: async (v: typeof f) => {
      const { error } = await supabase.rpc("apply_backup_schedule", {
        _enabled: v.enabled, _frequency: v.frequency, _time: v.time, _weekday: v.weekday, _month_day: v.monthDay,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Agendamento salvo"); setForm(null); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const last = occurrences[0];
  const job = cronJobs.find((j) => j.jobname === "backup-scheduled");
  const occLabel: Record<string, string> = { complete: "Concluída", failed: "Falhou", running: "Em andamento", pending: "Pendente",
    skipped_concurrency: "Ignorada (outro backup em andamento)", missed: "Perdida (não disparou)" };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Agendamento automático</CardTitle>
        <CardDescription>Roda no servidor no horário escolhido, mesmo sem ninguém conectado. Horário de Brasília ({TZ}).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch id="sched-on" checked={f.enabled} onCheckedChange={(v) => set({ enabled: v })} />
          <Label htmlFor="sched-on">{f.enabled ? "Ativado" : "Desativado"}</Label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Frequência</Label>
            <Select value={f.frequency} onValueChange={(v) => set({ frequency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sched-time">Horário</Label>
            <Input id="sched-time" type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} />
          </div>
          {f.frequency === "weekly" && (
            <div className="space-y-1">
              <Label>Dia da semana</Label>
              <Select value={String(f.weekday)} onValueChange={(v) => set({ weekday: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WEEKDAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {f.frequency === "monthly" && (
            <div className="space-y-1">
              <Label htmlFor="sched-day">Dia do mês (1 a 28)</Label>
              <Input id="sched-day" type="number" min={1} max={28} value={f.monthDay} onChange={(e) => set({ monthDay: Number(e.target.value) })} />
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => save.mutate(f)} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar agendamento
          </Button>
          {schedule?.enabled && (
            <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate({ ...f, enabled: false })}>Cancelar agendamento</Button>
          )}
        </div>
        <div className="grid gap-1 text-sm">
          <div><span className="text-muted-foreground">Próxima execução:</span> {schedule?.enabled ? fmt(schedule?.next_run_at) : "nenhuma"}</div>
          <div><span className="text-muted-foreground">Tarefa no servidor:</span> {job ? "ativa" : "nenhuma"}</div>
          <div><span className="text-muted-foreground">Última ocorrência:</span> {last ? `${fmt(last.scheduled_for)} · ${occLabel[last.status] ?? last.status} · tentativa ${last.attempts} de 3` : "nenhuma"}</div>
        </div>
        <p className="text-xs text-muted-foreground">
          Precisão: dispara no minuto programado, geralmente com poucos segundos de atraso. Se o servidor estiver indisponível naquele minuto, a ocorrência é registrada como perdida. Falhas são repetidas até 3 vezes (após 5 e 15 minutos).
        </p>
      </CardContent>
    </Card>
  );
}

function RunDetail({ run, onClose }: { run: Run | null; onClose: () => void }) {
  const items = useQuery({
    queryKey: ["backup-items", run?.id],
    enabled: !!run,
    queryFn: async () => {
      const all: Run[] = [];
      for (let from = 0; ; from += 1000) {
        const { data } = await supabase.from("backup_items").select("component, item_key, status, size_bytes, sha256_expected, sha256_received, row_count, attempts, last_error")
          .eq("run_id", run!.id).order("item_key").range(from, from + 999);
        all.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      return all;
    },
  });
  if (!run) return null;
  const p = run.progress ?? {};
  const comp = (items.data ?? []).reduce<Record<string, { n: number; b: number; ok: number }>>((m, i) => {
    const c = (m[i.component] ??= { n: 0, b: 0, ok: 0 }); c.n++; c.b += Number(i.size_bytes); if (i.status === "verified") c.ok++; return m;
  }, {});
  const pending = (items.data ?? []).filter((i) => i.status !== "verified");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Execução {run.id}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              {run.status === "complete" ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldAlert className="h-4 w-4 text-destructive" />}
              <Badge variant={statusInfo(run).variant}>{statusInfo(run).label}</Badge>
            </div>
            <div>Recebido pela EC2: {run.receiver_confirmed_at ? fmt(run.receiver_confirmed_at) : "não confirmado"}</div>
            <div>Integridade (hash de cada item e manifesto): {run.status === "complete" ? "verificada" : "não verificada"}</div>
            <div>Restauração: {run.restore_tested_at ? `${fmt(run.restore_tested_at)} — ${run.restore_result ?? ""}` : "ainda não testada"}</div>
            <div className="break-all">Hash do manifesto: <span className="font-mono text-xs">{run.manifest_sha256 ?? "—"}</span></div>
            {run.last_error && <div className="text-destructive">Erro: {run.last_error}</div>}
          </div>
          <div>
            <h3 className="font-semibold mb-1">Componentes</h3>
            {Object.entries(comp).map(([k, v]) => <div key={k}>{k}: {v.ok}/{v.n} confirmados · {bytes(v.b)}</div>)}
          </div>
          {isFull(run) && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-1">Registros por tabela</h3>
                {Object.entries(p.table_rows ?? {}).map(([t, n]) => (
                  <div key={t} className="flex justify-between gap-2"><span>{t}</span><span>{Number(n).toLocaleString("pt-BR")}
                    {p.counts_at_start?.[t] !== undefined && <span className="text-muted-foreground"> (banco: {p.counts_at_start[t]})</span>}</span></div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-1">Arquivos por bucket</h3>
                {Object.entries(p.storage_files ?? {}).map(([b, n]) => <div key={b}>{b}: {String(n)} · {bytes(p.storage_bytes?.[b])}</div>)}
                <h3 className="font-semibold mt-3 mb-1">Código</h3>
                <div>{p.source ? `${p.source.files} arquivos · ${p.source.functions} funções · ${p.source.migrations} migrações · snapshot de ${fmt(p.source.created_at)}` : "não incluído"}</div>
                {(p.limitations ?? []).map((l: string) => <div key={l} className="text-muted-foreground">{l}</div>)}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-semibold mb-1">Itens ({items.data?.length ?? "…"}) {pending.length > 0 && <span className="text-destructive">· {pending.length} pendentes</span>}</h3>
            <div className="max-h-64 overflow-y-auto font-mono text-xs space-y-0.5">
              {(items.data ?? []).map((i) => (
                <div key={i.item_key} className={i.status === "verified" ? "" : "text-destructive"}>
                  {i.status === "verified" ? "✓" : "✗"} {i.item_key} · {bytes(i.size_bytes)} · {i.sha256_expected?.slice(0, 12)}{i.row_count != null ? ` · ${i.row_count} reg.` : ""}{i.last_error ? ` · ${i.last_error}` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
