import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, ArrowLeft } from "lucide-react";
import { useInternalChat, InternalConversation, InternalMessage } from "@/hooks/useInternalChat";
import { useAuth } from "@/contexts/auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InternalChatWindowProps {
  conversation: InternalConversation;
  onBack?: () => void;
}

export const InternalChatWindow = ({ conversation, onBack }: InternalChatWindowProps) => {
  const { user } = useAuth();
  const { messages, fetchMessages, sendMessage } = useInternalChat();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationMessages = messages[conversation.id] || [];

  useEffect(() => {
    fetchMessages(conversation.id);
  }, [conversation.id]);

  useEffect(() => {
    // Scroll para o final quando novas mensagens chegam
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    await sendMessage(conversation.id, messageInput);
    setMessageInput('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    // Check if it's a self-conversation (all participants are the same user)
    const isSelfConversation = conversation.participants.length === 1 || 
      conversation.participants.every(id => id === user?.id);
    
    if (isSelfConversation) return 'Minhas Anotações';
    
    const otherParticipants = conversation.profiles?.filter(
      p => p.email !== user?.email
    );
    
    return otherParticipants?.map(p => p.name).join(', ') || 'Chat Interno';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs">
            {getInitials(getConversationTitle())}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{getConversationTitle()}</h3>
          <p className="text-xs text-muted-foreground">
            {conversation.participants.length === 1 || conversation.participants.every(id => id === user?.id)
              ? 'Anotações pessoais'
              : conversation.is_group 
                ? `${conversation.participants.length} participantes` 
                : 'Chat direto'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversationMessages.map((message: InternalMessage) => {
            const isOwn = message.sender_id === user?.id;

            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isOwn && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">
                      {getInitials(message.sender?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {!isOwn && message.sender && (
                    <span className="text-xs font-medium text-muted-foreground mb-1">
                      {message.sender.name}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
