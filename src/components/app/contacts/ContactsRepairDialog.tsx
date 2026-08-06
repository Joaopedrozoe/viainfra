import { useState } from "react";
import { Loader2, ShieldCheck, PhoneCall, UserPen, Combine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Action = "audit" | "phones" | "names" | "merge";

interface AuditRow {
  company_name: string;
  total_contacts: number;
  missing_phone: number;
  numeric_names: number;
  duplicate_phones: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  onCompleted?: () => void;
}

const LABELS: Record<string, string> = {
  message_id_crossmatch: "Cruzamento por ID de mensagem",
  jid_or_lid: "Identificador do WhatsApp / LID",
  spreadsheet_name: "Diretório (planilha) por nome",
  vcard_waid: "Cartão de contato (vCard)",
  spreadsheet: "Diretório (planilha)",
  message_pushname: "Nome exibido nas mensagens",
};

export const ContactsRepairDialog = ({ open, onOpenChange, companyId, onCompleted }: Props) => {
  const [busy, setBusy] = useState<Action | null>(null);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [result, setResult] = useState<{ title: string; lines: string[] } | null>(null);

  const call = async (action: Action, dryRun: boolean) => {
    setBusy(action);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("contacts-repair", {
        body: { action, companyId: companyId ?? null, dryRun },
      });
      if (error) throw error;
      const payload = data as Record<string, unknown>;
      if (payload?.error) throw new Error(String(payload.error));

      if (action === "audit") {
        setAudit((payload.audit as AuditRow[]) ?? []);
        return null;
      }
      return payload;
    } catch (err) {
      toast.error("Falha na rotina", {
        description: err instanceof Error ? err.message : "Erro inesperado",
      });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const runPhones = async () => {
    const sim = await call("phones", true);
    if (!sim) return;
    const total = Number(sim.total ?? 0);
    const byPass = (sim.byPass ?? {}) as Record<string, number>;
    if (total === 0) {
      toast.success("Nenhum telefone recuperável pendente.");
      setResult({ title: "Recuperação de telefones", lines: ["Nenhuma proposta encontrada."] });
      return;
    }
    const lines = Object.entries(byPass).map(([k, v]) => `${LABELS[k] ?? k}: ${v}`);
    setResult({ title: `Simulação: ${total} telefone(s) recuperáveis`, lines });
    if (!window.confirm(`Aplicar a recuperação de ${total} telefone(s)?\n\n${lines.join("\n")}`)) return;
    const applied = await call("phones", false);
    if (!applied) return;
    toast.success(`${applied.total} telefone(s) recuperado(s)`);
    onCompleted?.();
    await call("audit", true);
  };

  const runNames = async () => {
    const sim = await call("names", true);
    if (!sim) return;
    const total = Number(sim.total ?? 0);
    const bySource = (sim.bySource ?? {}) as Record<string, number>;
    if (total === 0) {
      toast.success("Nenhum nome numérico para corrigir.");
      setResult({ title: "Correção de nomes", lines: ["Nenhuma proposta encontrada."] });
      return;
    }
    const lines = Object.entries(bySource).map(([k, v]) => `${LABELS[k] ?? k}: ${v}`);
    setResult({ title: `Simulação: ${total} nome(s) corrigíveis`, lines });
    if (!window.confirm(`Aplicar a correção de ${total} nome(s)?\n\n${lines.join("\n")}`)) return;
    const applied = await call("names", false);
    if (!applied) return;
    toast.success(`${applied.total} nome(s) atualizado(s)`);
    onCompleted?.();
    await call("audit", true);
  };

  const runMerge = async () => {
    const sim = await call("merge", true);
    if (!sim) return;
    const pairs = Number(sim.pairs ?? 0);
    if (pairs === 0) {
      toast.success("Nenhum contato duplicado encontrado.");
      setResult({ title: "Mesclagem de duplicados", lines: ["Nenhum duplicado encontrado."] });
      return;
    }
    setResult({
      title: `Simulação: ${pairs} duplicado(s) para mesclar`,
      lines: ["As conversas serão unificadas e apenas mensagens repetidas (mesmo ID do WhatsApp) serão descartadas."],
    });
    if (!window.confirm(`Mesclar ${pairs} contato(s) duplicado(s)? Esta ação não pode ser desfeita.`)) return;
    const applied = await call("merge", false);
    if (!applied) return;
    toast.success(`${applied.pairs} contato(s) mesclado(s)`, {
      description: `${applied.movedMessages} mensagem(ns) movidas, ${applied.removedDuplicates} repetidas removidas.`,
    });
    onCompleted?.();
    await call("audit", true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Auditoria de contatos
          </DialogTitle>
          <DialogDescription>
            Toda rotina roda primeiro em simulação e só é aplicada após sua confirmação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => call("audit", true)}
            disabled={busy !== null}
          >
            {busy === "audit" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Rodar auditoria
          </Button>

          {audit && (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              {audit.map((row) => (
                <div key={row.company_name} className="space-y-1">
                  <p className="font-medium">{row.company_name}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{row.total_contacts} contatos</Badge>
                    <Badge variant={row.missing_phone > 0 ? "destructive" : "outline"}>
                      {row.missing_phone} sem telefone
                    </Badge>
                    <Badge variant={row.numeric_names > 0 ? "secondary" : "outline"}>
                      {row.numeric_names} nome numérico
                    </Badge>
                    <Badge variant={row.duplicate_phones > 0 ? "secondary" : "outline"}>
                      {row.duplicate_phones} duplicados
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="grid gap-2">
            <Button variant="outline" onClick={runPhones} disabled={busy !== null}>
              {busy === "phones" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PhoneCall className="h-4 w-4 mr-2" />}
              Recuperar telefones (simular)
            </Button>
            <Button variant="outline" onClick={runNames} disabled={busy !== null}>
              {busy === "names" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPen className="h-4 w-4 mr-2" />}
              Corrigir nomes numéricos (simular)
            </Button>
            <Button variant="outline" onClick={runMerge} disabled={busy !== null}>
              {busy === "merge" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Combine className="h-4 w-4 mr-2" />}
              Mesclar contatos duplicados (simular)
            </Button>
          </div>

          {result && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-medium">{result.title}</p>
              {result.lines.map((l) => (
                <p key={l} className="text-muted-foreground">{l}</p>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
