import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGroupActions } from "@/hooks/useGroupActions";

interface CompanyContact {
  id: string;
  name: string;
  phone: string | null;
}

interface CreateGroupDialogProps {
  open: boolean;
  companyId?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
}

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
};

export const CreateGroupDialog = ({ open, companyId, onOpenChange, onCreated }: CreateGroupDialogProps) => {
  const { runGroupAction, isLoading } = useGroupActions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [selected, setSelected] = useState<{ phone: string; label: string }[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<CompanyContact[]>([]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setPhoneInput("");
      setSelected([]);
      setContactSearch("");
      setContactResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!companyId || contactSearch.trim().length < 2) {
      setContactResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, name, phone")
        .eq("company_id", companyId)
        .ilike("name", `%${contactSearch.trim()}%`)
        .limit(10);
      if (!cancelled) setContactResults((data || []).filter((c) => !!c.phone) as CompanyContact[]);
    })();
    return () => { cancelled = true; };
  }, [contactSearch, companyId]);

  const addSelected = (phone: string, label: string) => {
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    if (selected.some((s) => s.phone === normalized)) return;
    setSelected((prev) => [...prev, { phone: normalized, label }]);
  };

  const removeSelected = (phone: string) => {
    setSelected((prev) => prev.filter((s) => s.phone !== phone));
  };

  const handleAddPhone = () => {
    if (!phoneInput.trim()) return;
    addSelected(phoneInput, phoneInput.trim());
    setPhoneInput("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || !name.trim()) return;

    const res = await runGroupAction<any>({
      companyId,
      action: "create",
      payload: { subject: name.trim(), description: description.trim() || undefined },
      successMessage: "Grupo criado",
    });

    if (res.ok) {
      const link = res.data?.inviteLink || null;
      setInviteLink(link);
      setCreatedConversationId(res.data?.conversationId || null);
      if (!link && res.data?.conversationId) {
        onOpenChange(false);
        onCreated(res.data.conversationId);
      }
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Novo grupo
          </DialogTitle>
          <DialogDescription>
            Crie um grupo de WhatsApp com contatos da empresa ativa ou números avulsos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-group-name">Nome do grupo</Label>
            <Input id="new-group-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-group-description">Descrição (opcional)</Label>
            <Textarea id="new-group-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Adicionar por telefone</Label>
            <div className="flex gap-2">
              <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="(11) 99999-9999" inputMode="tel" />
              <Button type="button" variant="outline" onClick={handleAddPhone}>Adicionar</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Buscar contato da empresa</Label>
            <Input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Digite um nome..." />
            {contactResults.length > 0 && (
              <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                {contactResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full flex items-center justify-between p-2 text-sm hover:bg-accent/50 text-left"
                    onClick={() => addSelected(c.phone || "", c.name)}
                  >
                    <span>{c.name}</span>
                    <span className="text-muted-foreground text-xs">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <Badge key={s.phone} variant="secondary" className="flex items-center gap-1">
                  {s.label}
                  <button type="button" onClick={() => removeSelected(s.phone)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || selected.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
