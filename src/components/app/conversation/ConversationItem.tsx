
import { useState, useCallback, memo } from "react";
import { Conversation } from "@/types/conversation";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "./ChannelIcon";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onResolve?: () => void;
  showResolveButton?: boolean;
}

export const ConversationItem = memo(({ 
  conversation, 
  isSelected, 
  onClick,
  onResolve,
  showResolveButton = false
}: ConversationItemProps) => {
  const [imageError, setImageError] = useState(false);

  // Optimize image error handling
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Pre-compute avatar element to avoid conditional rendering on each update
  const avatarElement = conversation.avatar && !imageError ? (
    <img 
      src={conversation.avatar}
      alt={conversation.name}
      className="w-full h-full object-cover"
      onError={handleImageError}
      loading="lazy" // Add lazy loading for images
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
      {conversation.name.charAt(0)}
    </div>
  );

  const handleResolveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection
    onResolve?.();
  }, [onResolve]);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={cn(
          "flex items-start p-4 w-full text-left border-b border-gray-200 space-x-3 transition-colors hover:bg-gray-50",
          isSelected ? "bg-gray-100" : ""
        )}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            {avatarElement}
          </div>
          <ChannelIcon 
            channel={conversation.channel} 
            hasBackground 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <div className="font-medium truncate">{conversation.name}</div>
            <div className="text-xs text-gray-500">{conversation.time}</div>
          </div>
          <div className="text-sm text-gray-500 truncate">{conversation.preview}</div>
        </div>
        
        {conversation.unread > 0 && (
          <div className="w-5 h-5 rounded-full bg-viainfra-primary text-white text-xs flex items-center justify-center">
            {conversation.unread}
          </div>
        )}
      </button>
      
      {showResolveButton && onResolve && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResolveClick}
            className="h-8 w-8 p-0 hover:bg-green-100"
            title="Resolver conversa"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
        </div>
      )}
    </div>
  );
});

ConversationItem.displayName = "ConversationItem";
