
import { useState, useCallback, memo } from "react";
import { Conversation } from "@/types/conversation";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "./ChannelIcon";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export const ConversationItem = memo(({ 
  conversation, 
  isSelected, 
  onClick 
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

  return (
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
        <div className="w-5 h-5 rounded-full bg-bonina text-white text-xs flex items-center justify-center">
          {conversation.unread}
        </div>
      )}
    </button>
  );
});

ConversationItem.displayName = "ConversationItem";
