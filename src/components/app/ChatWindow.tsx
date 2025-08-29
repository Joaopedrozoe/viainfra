import { useState, useRef, useEffect, useCallback, memo } from "react";
import { ChatHeader } from "./chat/ChatHeader";
import { MessageItem } from "./chat/MessageItem";
import { ChatInput } from "./chat/ChatInput";
import { mockMessages } from "./chat/mockData";
import { Message, ChatWindowProps } from "./chat/types";
import { Channel } from "@/types/conversation";
import { useNavigate } from "react-router-dom";

const getUserData = (conversationId: string): { name: string; channel: Channel } => {
  switch (conversationId) {
    case "1": return { name: "João Silva", channel: "whatsapp" };
    case "2": return { name: "Maria Souza", channel: "instagram" };
    case "3": return { name: "Pedro Santos", channel: "messenger" };
    case "4": return { name: "Ana Costa", channel: "telegram" };
    case "5": return { name: "Carlos Oliveira", channel: "whatsapp" };
    default: return { name: "", channel: "whatsapp" };
  }
};

export const ChatWindow = memo(({ conversationId, onBack }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (conversationId && mockMessages[conversationId]) {
      setMessages(mockMessages[conversationId]);
    } else {
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
    
    setMessages(prev => [...prev, message]);
    
    if (mockMessages[conversationId]) {
      mockMessages[conversationId] = [...mockMessages[conversationId], message];
    } else {
      mockMessages[conversationId] = [message];
    }
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
          <p className="text-gray-400">Ou inicie uma nova conversa</p>
        </div>
      </div>
    );
  }
  
  const { name, channel } = getUserData(conversationId);
  
  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader 
        userName={name} 
        channel={channel} 
        onViewContactDetails={handleViewContactDetails}
        onBackToList={handleBackToList}
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
