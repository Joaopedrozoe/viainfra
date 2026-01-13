import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Message } from "./types";

interface EditMessageDialogProps {
  message: Message | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (messageId: string, newContent: string) => void;
}

export function EditMessageDialog({
  message,
  open,
  onOpenChange,
  onSave,
}: EditMessageDialogProps) {
  const [content, setContent] = useState(message?.content || "");

  // Atualizar conteúdo quando a mensagem mudar
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && message) {
      setContent(message.content);
    }
    onOpenChange(newOpen);
  };

  const handleSave = () => {
    if (!message || !content.trim()) return;
    onSave(message.id, content.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar mensagem</DialogTitle>
          <DialogDescription>
            Edite o conteúdo da mensagem. A alteração será salva localmente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite a mensagem..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
