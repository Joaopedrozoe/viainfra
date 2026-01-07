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
import { cn } from "@/lib/utils";
import { useInfiniteMessages } from "@/hooks/useInfiniteMessages";
import { Loader2 } from "lucide-react";

const getFileType = (file: File): Attachment['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
};

export const ChatWindow = memo(({ conversationId, onBack, onEndConversation }: ChatWindowProps) => {
  const [contactName, setContactName] = useState<string>("");
  const [contactAvatar, setContactAvatar] = useState<string | null>(null);
  const [conversationChannel, setConversationChannel] = useState<Channel>("web");
  const [conversationStatus, setConversationStatus] = useState<string>("open");
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const previousConversationIdRef = useRef<string | null>(null);
  const previousScrollHeightRef = useRef<number>(0);
  
  // Hook para infinite scroll de mensagens
  const {
    messages,
    isLoading: isLoadingMessages,
    isLoadingMore,
    hasMore,
    totalCount,
    loadInitialMessages,
    loadMoreMessages,
    addMessage,
    updateMessage,
    replaceTemporaryMessage,
  } = useInfiniteMessages(conversationId);
  
  // Carregar dados da conversa quando mudar
  useEffect(() => {
    if (conversationId) {
      // Reset states when conversation changes to avoid glitches
      if (previousConversationIdRef.current !== conversationId) {
        setIsLoadingConversation(true);
        setContactName("");
        setContactAvatar(null);
        previousConversationIdRef.current = conversationId;
      }
      
      loadConversationData();
      loadInitialMessages();
      
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
            
            // Usar hook para substituir temporária ou adicionar
            replaceTemporaryMessage(newMessage.content, mappedMessage);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, loadInitialMessages, replaceTemporaryMessage]);

  // Carregar dados da conversa (contato, canal) - sem mensagens
  const loadConversationData = async () => {
    try {
      console.log('📥 [LOAD] Carregando dados da conversa:', conversationId);
      
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          contacts (
            id,
            name,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('id', conversationId)
        .maybeSingle();

      if (convError) {
        console.error('❌ Erro ao carregar conversa:', convError);
        setIsLoadingConversation(false);
        return;
      }

      // Definir nome e avatar do contato
      if (conversation?.contacts) {
        setContactName(conversation.contacts.name || 'Cliente Web');
        setContactAvatar(conversation.contacts.avatar_url || null);
      }
      setConversationChannel(conversation?.channel as Channel || 'web');
      setConversationStatus(conversation?.status || 'open');
    } catch (error) {
      console.error('💥 Erro ao carregar dados da conversa:', error);
    } finally {
      setIsLoadingConversation(false);
    }
  };
  
  // Scroll para o final quando novas mensagens chegam
  useEffect(() => {
    // Scroll instantâneo para nova mensagem com requestAnimationFrame
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages.length]);

  // Infinite scroll: detectar quando o usuário rola para cima
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    // Se estiver perto do topo (100px), carregar mais mensagens
    if (container.scrollTop < 100) {
      // Guardar altura atual para manter posição após carregar
      previousScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages();
    }
  }, [isLoadingMore, hasMore, loadMoreMessages]);

  // Restaurar posição do scroll após carregar mensagens antigas
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && previousScrollHeightRef.current > 0 && !isLoadingMore) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
      if (scrollDiff > 0) {
        container.scrollTop = scrollDiff;
      }
      previousScrollHeightRef.current = 0;
    }
  }, [messages, isLoadingMore]);

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
      
      addMessage(tempMessage);

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
        // Remover mensagem temporária (usando updateMessage para marcar como falha)
        updateMessage(tempId, { deliveryStatus: 'failed' });
        return;
      }

      if (data) {
        // Substituir mensagem temporária pela real (ainda com status 'sending')
        const realMessage: Message = {
          id: data.id,
          content: data.content,
          sender: 'agent' as const,
          timestamp: data.created_at,
          attachment: attachmentData,
          deliveryStatus: currentChannel === 'whatsapp' ? 'sending' : undefined,
        };
        replaceTemporaryMessage(messageContent, realMessage);

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
                  message_id: data.id, // Passar ID da mensagem para atualizar metadata
                  message_content: content || undefined,
                  attachment: attachmentData,
                  agent_name: profile?.name || 'Atendente',
                },
              }
            );

            const duration = Date.now() - startTime;

            if (whatsappError || !response?.success) {
              console.error('❌ [WhatsApp] Erro ao enviar:', {
                error: whatsappError,
                response,
                duration: `${duration}ms`,
                conversationId,
                messageId: data.id
              });
              
              // Atualizar status para failed localmente
              updateMessage(data.id, { deliveryStatus: 'failed' });
              
              // Mensagem de erro específica para grupos
              const isGroupError = response?.error?.includes('grupo') || response?.error?.includes('@g.us');
              const errorMsg = isGroupError
                ? 'Falha ao enviar para o grupo. Será reenviada automaticamente.'
                : 'Falha ao enviar via WhatsApp. Será reenviada automaticamente.';
              
              toast.error(errorMsg, {
                description: response?.queued ? 'Adicionada à fila de retry' : response?.error?.substring(0, 100),
                duration: 5000,
              });
            } else {
              console.log('✅ [WhatsApp] Mensagem enviada com sucesso!', {
                duration: `${duration}ms`,
                response,
                conversationId,
                messageId: data.id,
                whatsappMessageId: response?.messageId
              });
              
              // Atualizar status para sent localmente
              updateMessage(data.id, { 
                deliveryStatus: 'sent', 
                whatsappMessageId: response?.messageId 
              });
              
              // Toast de sucesso para grupos (feedback positivo importante)
              if (response?.messageId) {
                // Silencioso para mensagens normais, mas pode ser útil para debug
                console.log('✅ [WhatsApp] MessageId confirmado:', response.messageId);
              }
            }
          } catch (whatsappError) {
            console.error('💥 [WhatsApp] Exceção ao chamar função:', {
              error: whatsappError,
              message: whatsappError instanceof Error ? whatsappError.message : 'Unknown error',
              conversationId,
              messageId: data.id
            });
            
            // Atualizar status para failed localmente
            updateMessage(data.id, { deliveryStatus: 'failed' });
            
            toast.error('Erro ao enviar via WhatsApp. Será reenviada automaticamente.', {
              duration: 5000,
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

  // Reabrir conversa resolvida
  const handleReopenConversation = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'open' })
        .eq('id', conversationId);
      
      if (error) throw error;
      
      setConversationStatus('open');
      toast.success('Conversa reaberta com sucesso');
    } catch (error) {
      console.error('Erro ao reabrir conversa:', error);
      toast.error('Erro ao reabrir conversa');
    }
  }, [conversationId]);

  // Forçar carregamento de histórico via Evolution API
  const handleForceLoadHistory = useCallback(async () => {
    if (!conversationId || isSyncingHistory) return;
    
    setIsSyncingHistory(true);
    toast.info('Buscando histórico completo...', { duration: 2000 });
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-conversation-history', {
        body: { conversationId, limit: 200 }
      });
      
      if (error) throw error;
      
      if (data?.synced > 0) {
        toast.success(`${data.synced} mensagens antigas recuperadas!`);
        // Recarregar mensagens
        loadInitialMessages();
      } else {
        toast.info('Nenhuma mensagem nova encontrada');
      }
    } catch (error) {
      console.error('Erro ao sincronizar histórico:', error);
      toast.error('Erro ao buscar histórico');
    } finally {
      setIsSyncingHistory(false);
    }
  }, [conversationId, isSyncingHistory, loadInitialMessages]);

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
  const isLoading = isLoadingConversation || isLoadingMessages;
  
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
        contactId={conversationId} // Use conversation ID to lookup contact
        conversationStatus={conversationStatus}
        onViewContactDetails={handleViewContactDetails}
        onBackToList={handleBackToList}
        onEndConversation={onEndConversation ? () => onEndConversation(conversationId) : undefined}
        onReopenConversation={handleReopenConversation}
        onForceLoadHistory={handleForceLoadHistory}
      />
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-muted/30 p-4 scroll-smooth"
      >
        <div className="space-y-3">
          {/* Indicador de carregamento de mensagens antigas */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
            </div>
          )}
          
          {/* Indicador de que há mais mensagens */}
          {hasMore && !isLoadingMore && (
            <div className="flex items-center justify-center py-2">
              <span className="text-xs text-muted-foreground">
                ↑ Role para cima para ver mensagens antigas ({totalCount} total)
              </span>
            </div>
          )}
          
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const isNewMessage = isLastMessage && message.sender === 'user';
            const isSentMessage = message.id.startsWith('temp-');
            
            return (
              <div 
                key={message.id} 
                className={cn(
                  "transition-all duration-200",
                  isNewMessage && "animate-in fade-in-0 slide-in-from-bottom-3 duration-300",
                  isSentMessage && "opacity-70 scale-[0.98]",
                  !isSentMessage && message.sender === 'agent' && isLastMessage && "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                )}
              >
                <MessageItem message={message} />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-shrink-0 border-t bg-background">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";
