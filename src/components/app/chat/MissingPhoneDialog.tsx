import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MissingPhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
  contactName: string;
  onSaved: (phone: string) => void;
}

/** Normaliza para o formato aceito pela API oficial: apenas dígitos com DDI */
export function normalizePhoneInput(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const withDdi = digits.length >= 10 && digits.length <= 11 ? `55${digits}` : digits;
  if (withDdi.length < 10 || withDdi.length > 15) return null;
  return withDdi;
}

export const MissingPhoneDialog = ({
  open,
  onOpenChange,
  contactId,
  contactName,
  onSaved,
}: MissingPhoneDialogProps) => {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  const handleSave = async () => {
    const normalized = normalizePhoneInput(value);
    if (!normalized) {
      toast.error("Número inválido. Informe DDD + número (ex: 11 91234-5678).");
      return;
    }
    if (!contactId) {
      toast.error("Contato não identificado.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .update({ phone: normalized })
        .eq("id", contactId);

      if (error) {
        const duplicate = error.code === "23505";
        toast.error(
          duplicate
            ? "Este número já está cadastrado em outro contato desta empresa."
            : `Não foi possível salvar o número: ${error.message}`
        );
        return;
      }

      toast.success("Número atualizado", { description: "Agora é possível enviar mensagens para este contato." });
      onSaved(normalized);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contato sem número</DialogTitle>
          <DialogDescription>
            {contactName || "Este contato"} não possui um número de WhatsApp válido, então a API oficial não consegue
            entregar mensagens nem templates. Informe o número para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="missing-phone">Número do WhatsApp</Label>
          <Input
            id="missing-phone"
            inputMode="tel"
            placeholder="(11) 91234-5678"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <p className="text-xs text-muted-foreground">
            O DDI 55 (Brasil) é aplicado automaticamente quando não informado.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar número
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
