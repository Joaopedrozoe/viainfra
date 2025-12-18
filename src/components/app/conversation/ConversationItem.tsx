import { useState, useCallback, memo, useEffect, useRef } from "react";
import { Conversation } from "@/types/conversation";
import { cn } from "@/lib/utils";
import { ChannelIcon } from "./ChannelIcon";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle, Check, CheckCheck } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onResolve?: () => void;
  showResolveButton?: boolean;
  isTyping?: boolean;
  hasNewMessage?: boolean;
}

export const ConversationItem = memo(({ 
  conversation, 
  isSelected, 
  onClick,
  onResolve,
  showResolveButton = false,
  isTyping = false,
  hasNewMessage = false
}: ConversationItemProps) => {
  const [imageError, setImageError] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(hasNewMessage);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevHasNewMessageRef = useRef(hasNewMessage);

  // Detectar nova mensagem e iniciar animação
  useEffect(() => {
    if (hasNewMessage && !prevHasNewMessageRef.current) {
      setShowNewBadge(true);
      setIsAnimating(true);
      
      // Remover animação após completar
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevHasNewMessageRef.current = hasNewMessage;
  }, [hasNewMessage]);

  // Esconder badge quando selecionado
  useEffect(() => {
    if (isSelected && showNewBadge) {
      setShowNewBadge(false);
      setIsAnimating(false);
    }
  }, [isSelected, showNewBadge]);

  // Reset image error when avatar URL changes
  useEffect(() => {
    setImageError(false);
  }, [conversation.avatar]);

  // Handle image error
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Determinar se última mensagem foi enviada pelo agente (preview começa com nome do agente em negrito)
  const isLastMessageFromAgent = conversation.preview?.startsWith('*');

  // Render avatar with image or fallback initial
  const avatarElement = conversation.avatar && !imageError ? (
    <img 
      src={conversation.avatar}
      alt={conversation.name}
      className="w-full h-full object-cover"
      onError={handleImageError}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium bg-gray-100">
      {conversation.name.charAt(0).toUpperCase()}
    </div>
  );

  const handleResolveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onResolve?.();
  }, [onResolve]);

  return (
    <div className="relative">
      {/* Indicador lateral animado de nova mensagem */}
      {showNewBadge && !isSelected && (
        <div 
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 bg-primary z-10 rounded-r-full",
            isAnimating ? "animate-pulse" : ""
          )} 
        />
      )}
      
      <button
        onClick={onClick}
        className={cn(
          "flex items-start p-4 w-full text-left border-b border-border space-x-3 transition-all duration-200 ease-out",
          "hover:bg-accent/50",
          isSelected && "bg-primary/10 border-l-4 border-l-primary shadow-sm",
          showNewBadge && !isSelected && "bg-primary/5",
          isAnimating && "animate-in slide-in-from-left-2 duration-300"
        )}
      >
        <div className="relative flex-shrink-0">
          {/* Avatar com indicadores */}
          <div className={cn(
            "w-12 h-12 rounded-full overflow-hidden transition-all duration-200",
            showNewBadge && !isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            isAnimating && "scale-105"
          )}>
            {avatarElement}
          </div>
          
          {/* Ícone do canal */}
          <ChannelIcon 
            channel={conversation.channel} 
            hasBackground 
          />
          
          {/* Badge de nova mensagem animado */}
          {showNewBadge && !isSelected && (
            <div className={cn(
              "absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg",
              isAnimating && "animate-bounce"
            )}>
              <MessageCircle className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex justify-between items-center gap-2">
            <div className={cn(
              "font-medium truncate transition-all duration-150",
              showNewBadge && !isSelected && "text-primary font-semibold"
            )}>
              {conversation.name}
            </div>
            <div className={cn(
              "text-xs tabular-nums flex-shrink-0",
              showNewBadge && !isSelected ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              {conversation.time}
            </div>
          </div>
          
          <div className="h-5 overflow-hidden flex items-center">
            {isTyping ? (
              <div className="text-sm text-primary italic flex items-center gap-1.5">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>digitando</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 w-full">
                {/* Indicador de status da mensagem */}
                {isLastMessageFromAgent && (
                  <span className="flex-shrink-0 text-muted-foreground">
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </span>
                )}
                <span className={cn(
                  "text-sm truncate flex-1",
                  showNewBadge && !isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {conversation.preview}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Badge de contagem não lida */}
        {conversation.unread > 0 && (
          <div className={cn(
            "flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-white text-xs font-medium flex items-center justify-center",
            showNewBadge && !isSelected ? "bg-primary animate-pulse" : "bg-viainfra-primary"
          )}>
            {conversation.unread > 99 ? '99+' : conversation.unread}
          </div>
        )}
      </button>
      
      {/* Botão resolver */}
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
