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
            
            // Mapear tipo de sender corretamente
            const mappedMessage: Message = {
              id: newMessage.id,
              content: newMessage.content,
              sender: newMessage.sender_type === 'user' ? 'user' : newMessage.sender_type === 'agent' ? 'agent' : 'bot',
              timestamp: newMessage.created_at
            };
            
            setMessages(prev => {
              // Evitar duplicatas verificando se a mensagem já existe
              if (prev.some(msg => msg.id === mappedMessage.id)) {
                console.log('Mensagem duplicada ignorada via realtime:', mappedMessage.id);
                return prev;
              }
              console.log('Adicionando nova mensagem via realtime:', mappedMessage.id, 'sender:', mappedMessage.sender);
              return [...prev, mappedMessage];
            });
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
      // SOLUÇÃO: Buscar profile do usuário logado DIRETAMENTE do banco
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.error('❌ [ERROR] No authenticated user found!');
        return;
      }

      // Buscar profile usando o user_id do auth
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('user_id', authUser.id)
        .single();

      if (profileError || !currentProfile) {
        console.error('❌ [ERROR] Failed to fetch profile:', profileError);
        return;
      }

      console.log('✅ [SUCCESS] Profile loaded:', {
        profileId: currentProfile.id,
        profileName: currentProfile.name,
        profileEmail: currentProfile.email,
        authUserId: authUser.id
      });

      // Criar ID único para a mensagem
      const tempId = `temp-${Date.now()}`;
      
      // Adicionar mensagem localmente primeiro para feedback instantâneo
      const tempMessage: Message = {
        id: tempId,
        content,
        sender: "agent",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);

      // CRITICAL: Buscar canal da conversa DIRETAMENTE do banco para garantir que está atualizado
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('channel')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('❌ Erro ao buscar canal da conversa:', convError);
      }

      const currentChannel = conversationData?.channel || conversationChannel;
      console.log('📡 [Send] Canal da conversa:', {
        conversationId,
        channelFromDB: conversationData?.channel,
        channelFromState: conversationChannel,
        usingChannel: currentChannel
      });

      // Enviar mensagem para o banco com o profile_id correto
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          sender_id: currentProfile.id, // USANDO O ID DO PROFILE BUSCADO DIRETAMENTE
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir mensagem:', error);
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        return;
      }

      if (data) {
        // Substituir mensagem temporária pela real
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? {
                id: data.id,
                content: data.content,
                sender: 'agent',
                timestamp: data.created_at
              }
            : msg
        ));

        // GARANTIR envio via WhatsApp se o canal for whatsapp
        if (currentChannel === 'whatsapp') {
          console.log('🔵 [WhatsApp] Enviando mensagem via Evolution API...', {
            conversationId,
            messageId: data.id,
            contentLength: content.length,
            timestamp: new Date().toISOString()
          });
          
          try {
            const startTime = Date.now();
            const { data: response, error: whatsappError } = await supabase.functions.invoke(
              'send-whatsapp-message',
              {
                body: {
                  conversation_id: conversationId,
                  message_content: content,
                },
              }
            );

            const duration = Date.now() - startTime;

            if (whatsappError) {
              console.error('❌ [WhatsApp] Erro ao enviar:', {
                error: whatsappError,
                duration: `${duration}ms`,
                conversationId,
                messageId: data.id
              });
            } else {
              console.log('✅ [WhatsApp] Mensagem enviada com sucesso!', {
                duration: `${duration}ms`,
                response,
                conversationId,
                messageId: data.id
              });
            }
          } catch (whatsappError) {
            console.error('💥 [WhatsApp] Exceção ao chamar função:', {
              error: whatsappError,
              message: whatsappError instanceof Error ? whatsappError.message : 'Unknown error',
              stack: whatsappError instanceof Error ? whatsappError.stack : undefined,
              conversationId,
              messageId: data.id
            });
          }
        } else {
          console.log('ℹ️ [Chat] Canal não é WhatsApp, pulando envio via Evolution API', {
            channel: currentChannel,
            conversationId
          });
        }
      }
    } catch (error) {
      console.error('💥 Erro geral ao enviar mensagem:', error);
    }
  }, [conversationId, conversationChannel]);

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
    <div className="flex flex-col h-full w-full overflow-hidden">
      <ChatHeader 
        userName={contactName || 'Cliente Web'} 
        channel={conversationChannel} 
        conversationId={conversationId}
        onViewContactDetails={handleViewContactDetails}
        onBackToList={handleBackToList}
        onEndConversation={onEndConversation ? () => onEndConversation(conversationId) : undefined}
      />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-shrink-0 border-t bg-white">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";
