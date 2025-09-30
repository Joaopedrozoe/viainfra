import { useState, useRef, useEffect, useCallback, memo } from "react";
import { ChatHeader } from "./chat/ChatHeader";
import { MessageItem } from "./chat/MessageItem";
import { ChatInput } from "./chat/ChatInput";
import { Message, ChatWindowProps } from "./chat/types";
import { Channel } from "@/types/conversation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const ChatWindow = memo(({ conversationId, onBack, onEndConversation }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactName, setContactName] = useState<string>("");
  const [conversationChannel, setConversationChannel] = useState<Channel>("web");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (conversationId) {
      loadConversationData();
    }
  }, [conversationId]);

  const loadConversationData = async () => {
    try {
      // Buscar conversa com mensagens e contato
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contacts (
            id,
            name,
            phone,
            email
          ),
          messages (
            id,
            content,
            sender_type,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Erro ao carregar conversa:', error);
        return;
      }

      if (conversation) {
        // Mapear mensagens
        const mappedMessages: Message[] = (conversation.messages || [])
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender_type === 'user' ? 'user' : msg.sender_type === 'agent' ? 'agent' : 'bot',
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

        setMessages(mappedMessages);
        
        // Definir nome do contato
        if (conversation.contacts) {
          setContactName(conversation.contacts.name || 'Cliente Web');
        }

        // Definir canal
        setConversationChannel(conversation.channel as Channel || 'web');
      }
    } catch (error) {
      console.error('Erro ao carregar dados da conversa:', error);
    }
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = useCallback(async (content: string) => {
    if (!conversationId) return;

    try {
      // Adicionar mensagem localmente primeiro para feedback instantâneo
      const tempMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: "agent",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, tempMessage]);

      // Enviar mensagem para o banco
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          content,
        });

      // Recarregar mensagens para garantir sincronização
      await loadConversationData();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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
          <p className="text-gray-400">As conversas aparecerão aqui</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader 
        userName={contactName || 'Cliente Web'} 
        channel={conversationChannel} 
        conversationId={conversationId}
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
