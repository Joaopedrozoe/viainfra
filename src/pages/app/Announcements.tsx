import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowLeft, Check, Loader2, Megaphone, Pencil, Plus, Radio, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAnnouncementAdmin, useAnnouncements } from "@/hooks/useAnnouncements";
import { announcementKind, announcementKinds, type Announcement, type AnnouncementKind } from "@/lib/announcements";
import { AnnouncementStrip } from "@/components/app/announcements/AnnouncementStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Draft = Pick<Announcement, "title" | "summary" | "details" | "release_version" | "dismissible"> & { kind: AnnouncementKind };
const emptyDraft: Draft = { title: "", summary: "", details: "", release_version: "", dismissible: true, kind: "update" };
const statuses: Record<string, string> = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" };

function AnnouncementManager({ companyId, companyName, userId }: { companyId: string; companyName: string; userId: string }) {
  const queryClient = useQueryClient();
  const notices = useAnnouncements(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [filter, setFilter] = useState("all");
  const [publishTarget, setPublishTarget] = useState<Announcement | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["announcements", companyId, userId] });
  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...draft, title: draft.title.trim(), summary: draft.summary.trim(), release_version: draft.release_version.trim(), company_id: companyId };
      if (!payload.title || !payload.summary) throw new Error("Preencha o título e o resumo.");
      if (editing) {
        const { data, error } = await supabase.from("company_announcements").update(payload).eq("id", editing.id).eq("company_id", companyId).select("id").single();
        if (error) throw error;
        if (!data) throw new Error("Aviso não encontrado.");
      } else {
        const { error } = await supabase.from("company_announcements").insert({ ...payload, status: "draft" });
        if (error) throw error;
      }
    },
    onSuccess: () => { void refresh(); setEditorOpen(false); setEditing(null); toast.success("Aviso salvo."); },
    onError: error => toast.error(error.message),
  });
  const changeStatus = useMutation({
    mutationFn: async ({ row, status }: { row: Announcement; status: "published" | "draft" | "archived" }) => {
      if (status === "published") {
        const { error } = await supabase.rpc("publish_company_announcement", { _announcement_id: row.id, _company_id: companyId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_announcements").update({ status }).eq("id", row.id).eq("company_id", companyId).select("id").single();
        if (error) throw error;
      }
    },
    onSuccess: (_, { status }) => { void refresh(); setPublishTarget(null); toast.success(status === "published" ? "Aviso publicado para esta empresa." : status === "archived" ? "Aviso arquivado." : "Aviso retirado da faixa."); },
    onError: error => toast.error(error.message),
  });
  const edit = (row: Announcement | null) => {
    setEditing(row);
    setDraft(row ? { title: row.title, summary: row.summary, details: row.details, release_version: row.release_version, dismissible: row.dismissible, kind: announcementKind(row.kind) } : { ...emptyDraft });
    setEditorOpen(true);
  };
  const rows = (notices.data || []).filter(row => row.company_id === companyId);
  const active = rows.find(row => row.status === "published");
  const filtered = rows.filter(row => filter === "all" || row.status === filter);
  const busy = save.isPending || changeStatus.isPending;

  return <div className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Button asChild variant="link" className="mb-2 h-auto p-0"><Link to="/settings"><ArrowLeft />Configurações</Link></Button>
        <h1 className="flex items-center gap-3 text-2xl font-bold"><Megaphone className="h-6 w-6 text-primary" />Avisos e atualizações</h1>
        <p className="mt-1 text-sm text-muted-foreground">{companyName}</p>
      </div>
      <Button onClick={() => edit(null)} disabled={busy}><Plus />Novo aviso</Button>
    </header>

    {notices.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><p>Não foi possível carregar os avisos.</p><Button variant="outline" onClick={() => void notices.refetch()}>Tentar novamente</Button></div>}

    {editorOpen && <section className="border-y py-6" aria-label="Edição do aviso">
      <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{editing ? "Editar aviso" : "Novo aviso"}</h2><Button variant="ghost" size="icon" aria-label="Cancelar edição" title="Cancelar edição" disabled={busy} onClick={() => setEditorOpen(false)}><X /></Button></div>
      {editing?.status === "published" && <p className="mb-5 text-sm text-primary">Publicado · As alterações salvas serão exibidas na faixa.</p>}
      <form onSubmit={event => { event.preventDefault(); save.mutate(); }} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="notice-kind">Tipo</Label><Select value={draft.kind} onValueChange={value => setDraft({ ...draft, kind: announcementKind(value) })}><SelectTrigger id="notice-kind"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(announcementKinds).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="notice-version">Versão / release (opcional)</Label><Input id="notice-version" maxLength={40} value={draft.release_version} onChange={event => setDraft({ ...draft, release_version: event.target.value })} placeholder="Ex.: 2.4.0" /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="notice-title">Título</Label><Input id="notice-title" required maxLength={120} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></div>
        <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="notice-summary">Resumo da faixa</Label><span className="text-xs text-muted-foreground">{draft.summary.length}/280</span></div><Textarea id="notice-summary" required maxLength={280} value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })} className="min-h-24" /></div>
        <div className="space-y-2"><Label htmlFor="notice-details">Detalhes / notas da atualização (opcional)</Label><Textarea id="notice-details" maxLength={10000} value={draft.details} onChange={event => setDraft({ ...draft, details: event.target.value })} className="min-h-40" /></div>
        <div className="flex items-center justify-between gap-4 border-y py-4"><Label htmlFor="notice-dismissible">Exibir X para fechar a faixa</Label><Switch id="notice-dismissible" checked={draft.dismissible} onCheckedChange={value => setDraft({ ...draft, dismissible: value })} /></div>
        <div className="space-y-3"><h3 className="text-sm font-semibold">Prévia da faixa</h3><AnnouncementStrip notice={draft} /></div>
        <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" disabled={busy} onClick={() => setEditorOpen(false)}>Cancelar</Button><Button type="submit" disabled={busy || !draft.title.trim() || !draft.summary.trim()}>{save.isPending ? <Loader2 className="animate-spin" /> : <Save />}{editing ? "Salvar alterações" : "Salvar rascunho"}</Button></div>
      </form>
    </section>}

    <section className="space-y-4" aria-label="Histórico de avisos">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Avisos da empresa</h2><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-44" aria-label="Filtrar avisos"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="published">Publicados</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="archived">Arquivados</SelectItem></SelectContent></Select></div>
      {notices.isLoading ? <div className="flex justify-center py-12" aria-label="Carregando avisos"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : !notices.isError && filtered.length === 0 ? <div className="border-y py-12 text-center"><Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Nenhum aviso {filter === "all" ? "cadastrado" : statuses[filter]?.toLowerCase()}.</p></div> : <div className="divide-y border-y">{filtered.map(row => <article key={row.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
        <div className="min-w-0 flex-1 basis-64 space-y-2"><div className="flex flex-wrap items-center gap-2"><Badge variant={row.status === "published" ? "default" : "secondary"}>{row.status === "published" && <Check className="mr-1 h-3 w-3" />}{statuses[row.status] || row.status}</Badge><span className="text-xs text-muted-foreground">{announcementKinds[announcementKind(row.kind)]}{row.release_version ? ` · ${row.release_version}` : ""}</span></div><h3 className="break-words font-semibold [overflow-wrap:anywhere]">{row.title}</h3><p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{row.summary}</p><p className="text-xs text-muted-foreground">{new Date(row.updated_at).toLocaleString("pt-BR")} · {row.dismissible ? "Fechamento permitido" : "Sem X para fechar"}</p></div>
        <div className="flex shrink-0 flex-wrap items-center gap-2"><Button variant="outline" size="icon" title="Editar aviso" aria-label={`Editar ${row.title}`} onClick={() => edit(row)} disabled={busy}><Pencil /></Button>{row.status === "published" ? <Button variant="outline" size="sm" disabled={busy} onClick={() => changeStatus.mutate({ row, status: "draft" })}><X />Retirar da faixa</Button> : <Button size="sm" disabled={busy} onClick={() => setPublishTarget(row)}><Radio />Publicar</Button>}{row.status === "draft" && <Button variant="ghost" size="icon" title="Arquivar aviso" aria-label={`Arquivar ${row.title}`} disabled={busy} onClick={() => changeStatus.mutate({ row, status: "archived" })}><Archive /></Button>}</div>
      </article>)}</div>}
      {rows.length === 100 && <p className="text-xs text-muted-foreground">Últimos 100 avisos.</p>}
    </section>

    <AlertDialog open={!!publishTarget} onOpenChange={open => { if (!open && !busy) setPublishTarget(null); }}><AlertDialogContent className="w-[calc(100%-2rem)]"><AlertDialogHeader><AlertDialogTitle>Publicar aviso em {companyName}?</AlertDialogTitle><AlertDialogDescription>{publishTarget?.title} será exibido nas telas internas desta empresa.{active && active.id !== publishTarget?.id ? ` O aviso atual “${active.title}” será arquivado.` : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><Button disabled={busy} onClick={() => { if (publishTarget) changeStatus.mutate({ row: publishTarget, status: "published" }); }}>{changeStatus.isPending ? <Loader2 className="animate-spin" /> : <Radio />}Publicar aviso</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

export default function Announcements() {
  const { company, user } = useAuth();
  const admin = useAnnouncementAdmin();
  if (admin.isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (admin.isError) return <div role="alert" className="p-8 text-center"><p>Não foi possível verificar seu acesso.</p><Button variant="outline" className="mt-4" onClick={() => void admin.refetch()}>Tentar novamente</Button></div>;
  if (!admin.data || !company || !user) return <div className="p-8 text-center text-muted-foreground">Acesso restrito a administradores da empresa.</div>;
  return <AnnouncementManager key={`${company.id}:${user.id}`} companyId={company.id} companyName={company.name} userId={user.id} />;
}