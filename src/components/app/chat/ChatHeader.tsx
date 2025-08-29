
import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "../conversation/ChannelIcon";
import { Channel } from "@/types/conversation";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatHeaderProps {
  userName: string;
  channel: Channel;
  className?: string;
  onViewContactDetails?: () => void;
  onBackToList?: () => void;
}

export const ChatHeader = memo(({ 
  userName, 
  channel, 
  className, 
  onViewContactDetails,
  onBackToList 
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
      <div onClick={onViewContactDetails} className="cursor-pointer">
        <h2 className="font-medium text-gray-900">{userName}</h2>
        <p className="text-sm text-gray-500">Ver detalhes do contato</p>
      </div>
    </div>
  );
});

ChatHeader.displayName = "ChatHeader";
