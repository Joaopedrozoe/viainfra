
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  MoreVertical, 
  Star, 
  Trash, 
  Archive, 
  UserPlus, 
  PhoneCall 
} from "lucide-react";

interface ConversationActionsProps {
  conversationId: string;
}

export function ConversationActions({ conversationId }: ConversationActionsProps) {
  const [showOpportunityDialog, setShowOpportunityDialog] = useState(false);
  const [opportunityTitle, setOpportunityTitle] = useState("");
  const [opportunityValue, setOpportunityValue] = useState("");
  const [opportunityNotes, setOpportunityNotes] = useState("");

  const handleCreateOpportunity = () => {
    if (!opportunityTitle) {
      toast.error("Por favor, digite um título para a oportunidade");
      return;
    }

    // Here you would normally make an API call to create the opportunity
    toast.success("Oportunidade criada com sucesso!");
    setShowOpportunityDialog(false);
    
    // Reset form
    setOpportunityTitle("");
    setOpportunityValue("");
    setOpportunityNotes("");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowOpportunityDialog(true)}>
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            Marcar como oportunidade
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPlus className="mr-2 h-4 w-4 text-blue-500" />
            Adicionar contato
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PhoneCall className="mr-2 h-4 w-4 text-green-500" />
            Iniciar chamada
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Archive className="mr-2 h-4 w-4" />
            Arquivar conversa
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Excluir conversa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showOpportunityDialog} onOpenChange={setShowOpportunityDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Oportunidade CRM</DialogTitle>
            <DialogDescription>
              Transforme esta conversa em uma oportunidade no CRM
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input
                id="title"
                value={opportunityTitle}
                onChange={(e) => setOpportunityTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Valor (R$)
              </Label>
              <Input
                id="value"
                type="number"
                value={opportunityValue}
                onChange={(e) => setOpportunityValue(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={opportunityNotes}
                onChange={(e) => setOpportunityNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpportunityDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOpportunity}>Criar Oportunidade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
