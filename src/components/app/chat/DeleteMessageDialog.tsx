import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Message } from "./types";

interface DeleteMessageDialogProps {
  message: Message | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (messageId: string) => Promise<boolean> | boolean;
}

export function DeleteMessageDialog({
  message,
  open,
  onOpenChange,
  onConfirm,
}: DeleteMessageDialogProps) {
  const handleConfirm = async () => {
    if (!message) return;
    const confirmed = await onConfirm(message.id);
    if (confirmed !== false) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar mensagem?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A mensagem será removida permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
