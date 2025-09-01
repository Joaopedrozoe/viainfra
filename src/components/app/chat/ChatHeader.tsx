
import { memo, useState } from "react";
import { ArrowLeft, MoreVertical, User, X, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "../conversation/ChannelIcon";
import { Channel } from "@/types/conversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDepartments } from "@/contexts/DepartmentsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  userName: string;
  channel: Channel;
  className?: string;
  conversationId?: string;
  onViewContactDetails?: () => void;
  onBackToList?: () => void;
  onEndConversation?: () => void;
}

export const ChatHeader = memo(({ 
  userName, 
  channel, 
  className, 
  conversationId,
  onViewContactDetails,
  onBackToList,
  onEndConversation
}: ChatHeaderProps) => {
  const isMobile = useIsMobile();
  const { departments, getDepartmentByUser } = useDepartments();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  
  if (!userName) return null;

  // Simular atribuição de agente e departamento baseado no ID da conversa
  const getConversationAssignment = () => {
    if (!conversationId) return { agent: "Sistema", department: null };
    
    const agents = ["Ana Silva", "João Santos", "Maria Costa", "Pedro Lima"];
    const departmentNames = ["Atendimento", "Comercial", "Manutenção", "Financeiro", "RH"];
    
    const agentIndex = parseInt(conversationId) % agents.length;
    const deptIndex = parseInt(conversationId) % departmentNames.length;
    
    const assignedAgent = agents[agentIndex];
    const assignedDepartment = departments.find(d => d.name === departmentNames[deptIndex]);
    
    return { 
      agent: assignedAgent, 
      department: assignedDepartment 
    };
  };

  const { agent, department } = getConversationAssignment();

  const handleTransferDepartment = () => {
    if (!selectedDepartment || !conversationId) return;
    
    const targetDept = departments.find(d => d.id === selectedDepartment);
    if (targetDept) {
      // TODO: Implementar transferência real quando houver backend
      console.log(`Transferindo conversa ${conversationId} para departamento ${targetDept.name}`);
      toast.success(`Conversa transferida para ${targetDept.name}`);
      setShowTransferDialog(false);
      setSelectedDepartment("");
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-center p-4 border-b border-gray-200 bg-white",
        className
      )}
    >
      {isMobile && onBackToList && (
        <button
          onClick={onBackToList}
          className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Voltar para lista de conversas"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div 
        className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex-shrink-0 relative cursor-pointer"
        onClick={onViewContactDetails}
      >
        <ChannelIcon channel={channel} hasBackground />
      </div>
      <div onClick={onViewContactDetails} className="cursor-pointer flex-1">
        <h2 className="font-medium text-gray-900">{userName}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {agent}
          </Badge>
          {department && (
            <Badge variant="secondary" className="text-xs">
              {department.name}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">Ver detalhes do contato</p>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onViewContactDetails && (
            <DropdownMenuItem onClick={onViewContactDetails}>
              <User className="mr-2 h-4 w-4" />
              Ver Contato
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transferir Departamento
          </DropdownMenuItem>
          {onEndConversation && (
            <DropdownMenuItem 
              onClick={onEndConversation}
              className="text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Encerrar Conversa
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Transfer Department Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir para outro departamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Departamento atual:</label>
              <p className="text-sm text-muted-foreground">
                {department ? department.name : "Não atribuído"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Transferir para:</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments
                    .filter(d => d.id !== department?.id)
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.members.length} membros)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleTransferDepartment} disabled={!selectedDepartment}>
                Transferir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ChatHeader.displayName = "ChatHeader";
