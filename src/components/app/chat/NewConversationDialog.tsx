import { useEffect, useState } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStartConversation } from "@/hooks/useStartConversation";
import { toast } from "sonner";

interface NewConversationDialogProps {
  open: boolean;
  companyId?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversationId: string) => void;
  initialName?: string;
  initialPhone?: string;
}

export const NewConversationDialog = ({
  open,
  companyId,
  onOpenChange,
  onCreated,
  initialName = "",
  initialPhone = "",
}: NewConversationDialogProps) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startConversation } = useStartConversation(companyId);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhone(initialPhone);
      setEmail("");
    }
  }, [open, initialName, initialPhone]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await startConversation({ name, phone, email });
      toast.success(result.createdConversation ? "Conversa criada" : "Conversa existente aberta", {
        description: result.createdContact ? "Contato cadastrado na empresa ativa." : undefined,
      });
      onOpenChange(false);
      onCreated(result.conversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a conversa");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            Nova conversa
          </DialogTitle>
          <DialogDescription>
            Cadastre rapidamente o contato e abra uma conversa no WhatsApp da empresa ativa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-conversation-name">Nome</Label>
            <Input id="new-conversation-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome completo" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-conversation-phone">WhatsApp</Label>
            <Input id="new-conversation-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(11) 99999-9999" inputMode="tel" required />
            <p className="text-xs text-muted-foreground">O DDI 55 é aplicado automaticamente para números brasileiros.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-conversation-email">E-mail (opcional)</Label>
            <Input id="new-conversation-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@exemplo.com" />
          </div>
          <p className="text-xs text-muted-foreground">A conversa será aberta sem enviar mensagem. Se estiver fora da janela de 24 horas, use um template aprovado antes de escrever.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Abrir conversa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
