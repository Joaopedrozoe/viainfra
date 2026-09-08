import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { useGroupActions } from "@/hooks/useGroupActions";

interface CreateGroupDialogProps {
  open: boolean;
  companyId?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
}

export const CreateGroupDialog = ({ open, companyId, onOpenChange, onCreated }: CreateGroupDialogProps) => {
  const { runGroupAction, isLoading } = useGroupActions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [createdConversationId, setCreatedConversationId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setInviteLink(null);
      setCreatedConversationId(null);
      setCopied(false);
    }
  }, [open]);

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

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
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
            Na API oficial do WhatsApp, o grupo é criado com nome e descrição e as pessoas entram pelo link de convite.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link de convite</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} />
                <Button type="button" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Envie este link para os contatos: o grupo fica ativo quando eles aceitarem entrar.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  if (createdConversationId) onCreated(createdConversationId);
                }}
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-group-name">Nome do grupo</Label>
              <Input id="new-group-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-group-description">Descrição (opcional)</Label>
              <Textarea id="new-group-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar grupo
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
