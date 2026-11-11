import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { FunctionsHttpError } from '@supabase/supabase-js';
import { broadcastMedia, broadcastMediaIndexForTemplate } from '@/lib/broadcast-media';
import { useAuth } from '@/contexts/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface MetaTemplate {
  name: string;
  language: string;
  status: string;
  category: string;
  body: string;
  variables: number;
  header_format?: string;
}

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onSent: (templateName: string) => void;
}

const statusLabel = (status: string) => {
  const s = status.toUpperCase();
  if (s === "APPROVED") return { text: "Aprovado", variant: "default" as const };
  if (s === "PENDING" || s === "IN_APPEAL") return { text: "Em análise", variant: "secondary" as const };
  return { text: status, variant: "outline" as const };
};

export const TemplatePickerDialog = ({ open, onOpenChange, conversationId, onSent }: TemplatePickerDialogProps) => {
  const { company } = useAuth();
  const [mediaIndex, setMediaIndex] = useState('');
  const [templates, setTemplates] = useState<MetaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MetaTemplate | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const mappedIndex = selected ? broadcastMediaIndexForTemplate(selected.name) : null;
  const imageIndex = mappedIndex ?? (mediaIndex === '' ? null : Number(mediaIndex));
  const selectedMedia = imageIndex === null ? undefined : broadcastMedia[imageIndex];
  const needsImage = selected?.header_format === 'IMAGE' && company?.name?.toUpperCase() === 'VIALOGISTIC';

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("list-whatsapp-templates", {
        body: { conversation_id: conversationId },
      });
      if (fnError || !data?.success) {
        const details = fnError instanceof FunctionsHttpError ? await fnError.context.json().catch(() => ({})) : null;
        setError(details?.error || (data as any)?.error || fnError?.message || "Não foi possível carregar os templates");
        setTemplates([]);
        return;
      }
      setTemplates((data.templates || []) as MetaTemplate[]);
    } catch (e) {
      setError("Erro ao consultar os templates na Meta");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setMediaIndex('');
      setVariables([]);
      void load();
    }
  }, [open, load]);

  const preview = useMemo(() => {
    if (!selected) return "";
    let text = selected.body || "";
    variables.forEach((v, i) => {
      if (v) text = text.split(`{{${i + 1}}}`).join(v);
    });
    return text;
  }, [selected, variables]);

  const handleSelect = (t: MetaTemplate) => {
    if (t.status.toUpperCase() !== "APPROVED") return;
    // Erro de uma tentativa anterior nunca permanece ao escolher outro envio
    setError(null);
    setSelected(t);
    setMediaIndex('');
    setVariables(Array.from({ length: t.variables }, () => ""));
  };

  const handleSend = async () => {
    if (!selected || sending || (needsImage && !selectedMedia)) return;
    // Cada envio começa limpo: o app não trava no erro da tentativa anterior
    setError(null);
    setSending(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-whatsapp-template", {
        body: {
          conversation_id: conversationId,
          template_name: selected.name,
          language: selected.language,
          variables,
          body_preview: selected.body,
          ...(needsImage && selectedMedia ? { image_url: new URL(selectedMedia.image, window.location.origin).href } : {}),
        },
      });
      if (fnError || !data?.success) {
        const details = fnError instanceof FunctionsHttpError ? await fnError.context.json().catch(() => ({})) : null;
        setError(`${details?.error || (data as any)?.error || fnError?.message || "Falha ao enviar o template"}. Se persistir, reporte ao suporte com print, horário, empresa e telefone.`);
        return;
      }
      onSent(selected.name);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar o template");
    } finally {
      setSending(false);
    }
  };

  const missingVars = selected ? variables.some((v, i) => i < selected.variables && !v.trim()) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar template do WhatsApp</DialogTitle>
          <DialogDescription>
            Escolha um template aprovado pela Meta para iniciar ou reabrir a conversa.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates da Meta...
          </div>
        ) : (
          <ScrollArea className="h-[min(60vh,20rem)] w-full pr-3">
            <div className="space-y-2">
              {templates.length === 0 && !error && (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum template disponível.</p>
              )}
              {templates.map((t) => {
                const label = statusLabel(t.status);
                const canSend = t.status.toUpperCase() === "APPROVED";
                const isActive = selected?.name === t.name && selected?.language === t.language;
                return (
                  <button
                    key={`${t.name}-${t.language}`}
                    type="button"
                    onClick={() => handleSelect(t)}
                    disabled={!canSend}
                    title={canSend ? "Selecionar template" : "Aguardando aprovação da Meta"}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                      !canSend && "cursor-not-allowed opacity-60 hover:bg-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.name}</span>
                      <Badge variant={label.variant} className="text-[10px]">{label.text}</Badge>
                      <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                        {t.language} · {t.category}
                      </span>
                    </div>
                    {t.body && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.body}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {selected && selected.variables > 0 && (
          <div className="space-y-2">
            {Array.from({ length: selected.variables }).map((_, i) => (
              <div key={i}>
                <Label className="text-xs">Variável {`{{${i + 1}}}`}</Label>
                <Input
                  value={variables[i] || ""}
                  onChange={(e) => {
                    const next = [...variables];
                    next[i] = e.target.value;
                    setVariables(next);
                  }}
                  placeholder={`Valor para {{${i + 1}}}`}
                />
              </div>
            ))}
          </div>
        )}

        {selected && preview && (
          <div className="rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">{preview}</div>
        )}
        {selected?.header_format === 'IMAGE' && company?.name?.toUpperCase() === 'VIALOGISTIC' && (
          <div className="space-y-2">
            <Label>Imagem do template</Label>
            <Select value={imageIndex === null ? '' : String(imageIndex)} onValueChange={setMediaIndex} disabled={mappedIndex !== null}>
              <SelectTrigger><SelectValue placeholder="Selecionar imagem" /></SelectTrigger>
              <SelectContent>{broadcastMedia.map((media, index) => <SelectItem key={media.label} value={String(index)}>{media.label}</SelectItem>)}</SelectContent>
            </Select>
            {selectedMedia && <img src={selectedMedia.image} alt={selectedMedia.label} className="h-40 w-full object-contain" />}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Atualizar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSend} disabled={!selected || sending || missingVars || (needsImage && !selectedMedia)}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
