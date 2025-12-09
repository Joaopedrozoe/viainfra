import { useState, useRef, useEffect, useCallback, memo } from "react";
import { ChatHeader } from "./chat/ChatHeader";
import { MessageItem } from "./chat/MessageItem";
import { ChatInput } from "./chat/ChatInput";
import { Message, ChatWindowProps, Attachment } from "./chat/types";
import { Channel } from "@/types/conversation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const getFileType = (file: File): Attachment['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
};

export const ChatWindow = memo(({ conversationId, onBack, onEndConversation }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactName, setContactName] = useState<string>("");
  const [contactAvatar, setContactAvatar] = useState<string | null>(null);
  const [conversationChannel, setConversationChannel] = useState<Channel>("web");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const previousConversationIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (conversationId) {
      // Reset states when conversation changes to avoid glitches
      if (previousConversationIdRef.current !== conversationId) {
        setIsLoading(true);
        setMessages([]);
        setContactName("");
        setContactAvatar(null);
        previousConversationIdRef.current = conversationId;
      }
      
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
            const newMessage = payload.new as any;
            
            // Mapear tipo de sender corretamente com attachment se existir
            const attachmentData = newMessage.metadata?.attachment;
            const mappedMessage: Message = {
              id: newMessage.id,
              content: newMessage.content,
              sender: newMessage.sender_type === 'user' ? 'user' : newMessage.sender_type === 'agent' ? 'agent' : 'bot',
              timestamp: newMessage.created_at,
              attachment: attachmentData,
            };
            
            // Update imediato sem re-render desnecessário
            setMessages(prev => {
              // Evitar duplicatas verificando se a mensagem já existe (incluindo temporárias)
              if (prev.some(msg => msg.id === mappedMessage.id || (msg.id.startsWith('temp-') && msg.content === mappedMessage.content))) {
                // Substituir mensagem temporária pela real se existir
                return prev.map(msg => 
                  msg.id.startsWith('temp-') && msg.content === mappedMessage.content ? mappedMessage : msg
                );
              }
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
            email,
            avatar_url
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
          .map((msg: any) => {
            // Extrair attachment do metadata se existir
            const attachmentData = msg.metadata?.attachment;
            const attachment: Attachment | undefined = attachmentData ? {
              type: attachmentData.type,
              url: attachmentData.url,
              filename: attachmentData.filename,
              mimeType: attachmentData.mimeType,
            } : undefined;

            return {
              id: msg.id,
              content: msg.content,
              sender: msg.sender_type === 'user' ? 'user' : msg.sender_type === 'agent' ? 'agent' : 'bot',
              timestamp: msg.created_at,
              attachment,
            };
          });

        console.log('Mensagens carregadas:', mappedMessages.length);
        setMessages(mappedMessages);
        
        // Definir nome e avatar do contato
        if (conversation.contacts) {
          setContactName(conversation.contacts.name || 'Cliente Web');
          setContactAvatar(conversation.contacts.avatar_url || null);
        }

        // Definir canal
        setConversationChannel(conversation.channel as Channel || 'web');
      }
    } catch (error) {
      console.error('Erro ao carregar dados da conversa:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Scroll instantâneo para nova mensagem com requestAnimationFrame
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages]);
  
  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    console.log('🚀 [SEND] Iniciando envio de mensagem:', { conversationId, content, hasFile: !!file });
    
    if (!conversationId) {
      console.error('❌ [SEND] Sem conversationId');
      return;
    }

    if (!profile) {
      console.error('❌ [SEND] Perfil não disponível no contexto');
      toast.error('Perfil não encontrado. Por favor, faça logout e login novamente.');
      return;
    }

    try {
      let attachmentData: Attachment | undefined;
      let attachmentUrl: string | undefined;

      // Upload do arquivo se houver
      if (file) {
        console.log('📎 [SEND] Fazendo upload do arquivo:', file.name);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('❌ [SEND] Erro no upload:', uploadError);
          toast.error('Erro ao enviar arquivo');
          return;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName);

        attachmentUrl = publicUrlData.publicUrl;
        attachmentData = {
          type: getFileType(file),
          url: attachmentUrl,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        };

        console.log('✅ [SEND] Arquivo uploaded:', attachmentUrl);
      }
      console.log('✅ [SEND] Usando perfil do contexto:', { 
        profileId: profile.id,
        profileName: profile.name,
        profileEmail: profile.email,
        companyId: profile.company_id
      });
      // Criar ID único para a mensagem
      const tempId = `temp-${Date.now()}`;
      
      // Definir conteúdo da mensagem
      let messageContent = content;
      if (attachmentData && !content) {
        const typeLabels = { image: 'Imagem', video: 'Vídeo', audio: 'Áudio', document: 'Documento' };
        messageContent = `[${typeLabels[attachmentData.type]}]`;
      }
      
      // Adicionar mensagem localmente primeiro para feedback instantâneo
      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        attachment: attachmentData,
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

      // Inserir mensagem no banco
      console.log('💾 [SEND] Inserindo mensagem no banco:', {
        conversation_id: conversationId,
        sender_type: 'agent',
        sender_id: profile.id,
        sender_name: profile.name,
        content_preview: messageContent.substring(0, 50),
        hasAttachment: !!attachmentData
      });
      
      // Build metadata with attachment info if present
      const messageMetadata: Record<string, any> = {};
      if (attachmentData) {
        messageMetadata.attachment = attachmentData;
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          sender_id: profile.id,
          content: messageContent,
          metadata: Object.keys(messageMetadata).length > 0 ? messageMetadata : undefined,
        })
        .select()
        .single();

      console.log('💾 [SEND] Resultado da inserção:', { 
        hasData: !!data, 
        messageId: data?.id,
        messageSenderId: data?.sender_id,
        error 
      });

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
                sender: 'agent' as const,
                timestamp: data.created_at,
                attachment: attachmentData,
              }
            : msg
        ));

        // GARANTIR envio via WhatsApp se o canal for whatsapp
        if (currentChannel === 'whatsapp') {
          console.log('🔵 [WhatsApp] Enviando mensagem via Evolution API...', {
            conversationId,
            messageId: data.id,
            contentLength: messageContent.length,
            hasAttachment: !!attachmentData,
            timestamp: new Date().toISOString()
          });
          
          try {
            const startTime = Date.now();
            const { data: response, error: whatsappError } = await supabase.functions.invoke(
              'send-whatsapp-message',
              {
                body: {
                  conversation_id: conversationId,
                  message_content: content || undefined,
                  attachment: attachmentData,
                  agent_name: profile?.name || 'Atendente',
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
  }, [conversationId, conversationChannel, profile]);

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
      <div className="flex-1 flex items-center justify-center bg-muted p-4">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-3">Selecione uma conversa para começar</p>
          <p className="text-muted-foreground/70">As conversas aparecerão aqui</p>
        </div>
      </div>
    );
  }

  // Show loading skeleton while data loads
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <div className="flex-shrink-0 p-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <ChatHeader 
        userName={contactName || 'Cliente Web'} 
        avatar={contactAvatar}
        channel={conversationChannel} 
        conversationId={conversationId}
        onViewContactDetails={handleViewContactDetails}
        onBackToList={handleBackToList}
        onEndConversation={onEndConversation ? () => onEndConversation(conversationId) : undefined}
      />
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 scroll-smooth">
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
              style={{ animationDelay: index === messages.length - 1 ? '0ms' : undefined }}
            >
              <MessageItem message={message} />
            </div>
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
