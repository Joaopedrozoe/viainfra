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
      
      // Configurar subscription para novas mensagens em tempo real
      const channel = supabase
        .channel(`messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            console.log('Nova mensagem recebida via realtime:', payload);
            const newMessage = payload.new as any;
            
            // Adicionar mensagem se for do tipo user ou bot (não duplicar mensagens do agent)
            if (newMessage.sender_type !== 'agent') {
              const mappedMessage: Message = {
                id: newMessage.id,
                content: newMessage.content,
                sender: newMessage.sender_type === 'user' ? 'user' : 'bot',
                timestamp: newMessage.created_at // Data completa
              };
              
              setMessages(prev => {
                // Evitar duplicatas verificando se a mensagem já existe
                if (prev.some(msg => msg.id === mappedMessage.id)) {
                  console.log('Mensagem duplicada ignorada:', mappedMessage.id);
                  return prev;
                }
                console.log('Adicionando nova mensagem:', mappedMessage.id);
                return [...prev, mappedMessage];
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
            created_at,
            metadata
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Erro ao carregar conversa:', error);
        return;
      }

      if (conversation) {
        // Marcar mensagens como lidas ao abrir a conversa
        const unreadMessages = (conversation.messages || [])
          .filter((msg: any) => msg.sender_type !== 'agent' && !msg.metadata?.read);
        
        if (unreadMessages.length > 0) {
          // Atualizar metadata das mensagens para marcar como lidas
          for (const msg of unreadMessages) {
            const currentMetadata = (typeof msg.metadata === 'object' && msg.metadata !== null) 
              ? msg.metadata 
              : {};
            await supabase
              .from('messages')
              .update({ 
                metadata: { ...currentMetadata, read: true } 
              })
              .eq('id', msg.id);
          }
        }

        // Mapear mensagens removendo duplicatas por ID
        const seenIds = new Set<string>();
        const mappedMessages: Message[] = (conversation.messages || [])
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .filter((msg: any) => {
            if (seenIds.has(msg.id)) {
              console.log('Mensagem duplicada removida no carregamento:', msg.id);
              return false;
            }
            seenIds.add(msg.id);
            return true;
          })
          .map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender_type === 'user' ? 'user' : msg.sender_type === 'agent' ? 'agent' : 'bot',
            timestamp: msg.created_at // Passar a data completa para formatação no MessageItem
          }));

        console.log('Mensagens carregadas:', mappedMessages.length);
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
      // Criar ID único para a mensagem
      const tempId = `temp-${Date.now()}`;
      
      // Adicionar mensagem localmente primeiro para feedback instantâneo
      const tempMessage: Message = {
        id: tempId,
        content,
        sender: "agent",
        timestamp: new Date().toISOString() // Data completa
      };
      
      setMessages(prev => [...prev, tempMessage]);

      // Enviar mensagem para o banco
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir mensagem:', error);
        // Remover mensagem temporária em caso de erro
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      } else if (data) {
        // Substituir mensagem temporária pela real
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? {
                id: data.id,
                content: data.content,
                sender: 'agent',
                timestamp: data.created_at // Data completa
              }
            : msg
        ));
      }
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
    <div className="flex flex-col h-screen md:h-full">
      <ChatHeader 
        userName={contactName || 'Cliente Web'} 
        channel={conversationChannel} 
        conversationId={conversationId}
        onViewContactDetails={handleViewContactDetails}
        onBackToList={handleBackToList}
        onEndConversation={onEndConversation ? () => onEndConversation(conversationId) : undefined}
      />
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t bg-white">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";
