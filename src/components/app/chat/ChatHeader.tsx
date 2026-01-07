
import { memo, useState, useEffect } from "react";
import { ArrowLeft, MoreVertical, User, X, ArrowRightLeft, Bot, BotOff, RotateCcw, History } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  userName: string;
  avatar?: string | null;
  channel: Channel;
  className?: string;
  conversationId?: string;
  conversationStatus?: string;
  onViewContactDetails?: () => void;
  onBackToList?: () => void;
  onEndConversation?: () => void;
  onReopenConversation?: () => void;
  onForceLoadHistory?: () => void;
}

export const ChatHeader = memo(({ 
  userName, 
  avatar,
  channel, 
  className, 
  conversationId,
  conversationStatus,
  onViewContactDetails,
  onBackToList,
  onEndConversation,
  onReopenConversation,
  onForceLoadHistory
}: ChatHeaderProps) => {
  const isMobile = useIsMobile();
  const { departments, getDepartmentByUser } = useDepartments();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const [botActive, setBotActive] = useState<boolean>(true);
  const [botLoading, setBotLoading] = useState(false);
  
  // Carregar estado do bot e subscription para atualizações em tempo real
  useEffect(() => {
    if (!conversationId) return;
    
    const loadBotState = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('bot_active, metadata')
        .eq('id', conversationId)
        .single();
      
      if (data) {
        // Verificar ambos: coluna bot_active E metadata.agent_takeover
        const metadata = data.metadata as Record<string, unknown> | null;
        const agentTakeover = metadata?.agent_takeover === true;
        setBotActive(data.bot_active !== false && !agentTakeover);
      }
    };
    
    loadBotState();
    
    // Subscription para atualizações em tempo real
    const channel = supabase
      .channel(`bot-status-${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new) {
          const newData = payload.new as { bot_active?: boolean; metadata?: Record<string, unknown> };
          const agentTakeover = newData.metadata?.agent_takeover === true;
          setBotActive(newData.bot_active !== false && !agentTakeover);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
  
  if (!userName) return null;

  // FUNÇÃO CRÍTICA: Assumir/Reativar Conversa
  const handleToggleBot = async () => {
    if (!conversationId) return;
    
    setBotLoading(true);
    try {
      const newBotState = !botActive;
      
      // Buscar metadata atual para preservar outros dados
      const { data: currentConv } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();
      
      const currentMetadata = (currentConv?.metadata as Record<string, unknown>) || {};
      
      // ATUALIZAÇÃO CRÍTICA: Atualizar AMBOS bot_active E metadata.agent_takeover
      const { error } = await supabase
        .from('conversations')
        .update({ 
          bot_active: newBotState,
          metadata: {
            ...currentMetadata,
            agent_takeover: !newBotState, // true quando agente assume (bot desativado)
            agent_takeover_at: !newBotState ? new Date().toISOString() : null
          }
        })
        .eq('id', conversationId);
      
      if (error) throw error;
      
      setBotActive(newBotState);
      toast.success(newBotState ? 'Bot reativado' : 'Você assumiu a conversa');
      
    } catch (error) {
      console.error('Erro ao alternar bot:', error);
      toast.error('Erro ao alternar controle da conversa');
    } finally {
      setBotLoading(false);
    }
  };



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
        className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex-shrink-0 relative cursor-pointer overflow-hidden"
        onClick={onViewContactDetails}
      >
        {avatar && !imageError ? (
          <img 
            src={avatar}
            alt={userName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <ChannelIcon channel={channel} hasBackground />
      </div>
      <div onClick={onViewContactDetails} className="cursor-pointer flex-1">
        <h2 className="font-medium text-gray-900">{userName}</h2>
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
          <DropdownMenuItem onClick={handleToggleBot} disabled={botLoading}>
            {botActive ? (
              <>
                <BotOff className="mr-2 h-4 w-4" />
                Assumir Conversa
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Reativar Bot
              </>
            )}
          </DropdownMenuItem>
          
          

          <DropdownMenuSeparator />
          
          {/* Forçar carregamento de histórico */}
          {onForceLoadHistory && (
            <DropdownMenuItem onClick={onForceLoadHistory}>
              <History className="mr-2 h-4 w-4" />
              Carregar Histórico Completo
            </DropdownMenuItem>
          )}
          
          {/* Reabrir conversa resolvida */}
          {onReopenConversation && conversationStatus === 'resolved' && (
            <DropdownMenuItem onClick={onReopenConversation}>
              <RotateCcw className="mr-2 h-4 w-4 text-green-600" />
              Reabrir Conversa
            </DropdownMenuItem>
          )}
          
          {onEndConversation && conversationStatus !== 'resolved' && (
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
              <label className="text-sm font-medium">Transferir para:</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
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
