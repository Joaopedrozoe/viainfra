import { useState, useRef, useEffect, useCallback, memo } from "react";
import { ChatHeader } from "./chat/ChatHeader";
import { MessageItem } from "./chat/MessageItem";
import { ChatInput } from "./chat/ChatInput";
import { Message, ChatWindowProps } from "./chat/types";
import { Channel } from "@/types/conversation";
import { useNavigate } from "react-router-dom";

export const ChatWindow = memo(({ conversationId, onBack, onEndConversation }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (conversationId) {
      // Para conversas de preview, buscar mensagens do contexto de preview
      try {
        const storedConversations = localStorage.getItem('preview-conversations');
        if (storedConversations) {
          const previewData = JSON.parse(storedConversations);
          if (previewData[conversationId] && previewData[conversationId].messages) {
            const mappedMessages = previewData[conversationId].messages.map((msg: any, index: number) => ({
              id: `${conversationId}-${index}`,
              content: msg.content,
              sender: msg.isBot ? 'bot' : 'user',
              timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            console.log('📱 ChatWindow: Carregando mensagens para', conversationId, mappedMessages.length, 'mensagens');
            setMessages(mappedMessages);
            return;
          }
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens de preview:', error);
      }
      
      // TODO: Fetch real messages from API when backend is connected
      // For now, show empty messages if not a preview conversation
      setMessages([]);
    }
  }, [conversationId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = useCallback((content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      sender: "agent",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // TODO: Send message via API when backend is connected
    setMessages(prev => [...prev, message]);
  }, [conversationId]);

  const handleViewContactDetails = useCallback(() => {
    if (conversationId) {
      navigate(`/contacts/${conversationId}`);
    }
  }, [conversationId, navigate]);

  const handleBackToList = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate("/inbox", { 
        state: { 
          selectedConversation: undefined,
          showChat: false 
        },
        replace: true
      });
    }
  }, [navigate, onBack]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-xl text-gray-500 mb-3">Selecione uma conversa para começar</p>
          <p className="text-gray-400">Conecte uma API do WhatsApp para receber conversas reais</p>
        </div>
      </div>
    );
  }
  
  // TODO: Get real user data from API when backend is connected
  const name = `Usuário ${conversationId}`;
  const channel: Channel = "whatsapp";
  
  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader 
        userName={name} 
        channel={channel} 
        onViewContactDetails={handleViewContactDetails}
        onBackToList={handleBackToList}
        onEndConversation={onEndConversation ? () => onEndConversation(conversationId) : undefined}
      />
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 pb-20">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";
