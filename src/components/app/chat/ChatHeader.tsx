
import { memo } from "react";
import { ArrowLeft, MoreVertical, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "../conversation/ChannelIcon";
import { Channel } from "@/types/conversation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
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
  onViewContactDetails?: () => void;
  onBackToList?: () => void;
  onEndConversation?: () => void;
}

export const ChatHeader = memo(({ 
  userName, 
  channel, 
  className, 
  onViewContactDetails,
  onBackToList,
  onEndConversation
}: ChatHeaderProps) => {
  const isMobile = useIsMobile();
  
  if (!userName) return null;
  
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
    </div>
  );
});

ChatHeader.displayName = "ChatHeader";
