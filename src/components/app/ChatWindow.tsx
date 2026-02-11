import { useState, useRef, useEffect, useCallback, memo } from "react";
import { ChatHeader } from "./chat/ChatHeader";
import { MessageItem } from "./chat/MessageItem";
import { ChatInput } from "./chat/ChatInput";
import { Message, ChatWindowProps, Attachment } from "./chat/types";
import { EditMessageDialog } from "./chat/EditMessageDialog";
import { DeleteMessageDialog } from "./chat/DeleteMessageDialog";
import { ForwardMessageModal } from "./chat/ForwardMessageModal";
import { Channel } from "@/types/conversation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useInfiniteMessages } from "@/hooks/useInfiniteMessages";
import { Loader2, Pin } from "lucide-react";

const getFileType = (file: File): Attachment['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
};

// Cache de posição de scroll por conversa (distância do final)
const scrollPositionsCache = new Map<string, number>();

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
  const isLoadingHistoryRef = useRef(false);
  
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
    deleteMessage,
  } = useInfiniteMessages(conversationId);
  
  // Estados para modais de ações
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  
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
              // Campos para citação/reply
              quotedMessageId: newMessage.metadata?.quotedMessageId,
              quotedContent: newMessage.metadata?.quotedContent,
              quotedSender: newMessage.metadata?.quotedSender,
              quotedAttachmentType: newMessage.metadata?.quotedAttachmentType,
              // ID do WhatsApp para replies
              whatsappMessageId: newMessage.metadata?.whatsappMessageId || newMessage.metadata?.external_id,
              // Campos para mídia indisponível
              mediaUnavailable: newMessage.metadata?.mediaUnavailable || false,
              mediaType: newMessage.metadata?.mediaType,
            };
            
            // Usar hook para substituir temporária ou adicionar
            replaceTemporaryMessage(newMessage.content, mappedMessage);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ ChatWindow realtime CONNECTED for conversation:', conversationId);
          } else {
            console.warn('⚠️ ChatWindow realtime status:', status);
          }
        });

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
  
  // Salvar posição do scroll quando sair da conversa
  useEffect(() => {
    const container = messagesContainerRef.current;
    const currentConvId = conversationId;
    
    return () => {
      if (currentConvId && container) {
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        // Só salvar se não estiver no final (mais de 100px do fim)
        if (distanceFromBottom > 100) {
          scrollPositionsCache.set(currentConvId, distanceFromBottom);
        } else {
          scrollPositionsCache.delete(currentConvId);
        }
      }
    };
  }, [conversationId]);
  
  // Scroll para o final quando novas mensagens chegam (com preservação de posição)
  useEffect(() => {
    // NÃO fazer scroll automático se estiver carregando histórico antigo
    if (isLoadingHistoryRef.current) {
      return;
    }
    
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Verificar se temos posição salva para esta conversa
    const savedDistance = scrollPositionsCache.get(conversationId || '');
    
    if (savedDistance !== undefined) {
      // Restaurar posição salva (distância do final)
      requestAnimationFrame(() => {
        const targetScroll = container.scrollHeight - container.clientHeight - savedDistance;
        container.scrollTop = Math.max(0, targetScroll);
      });
      // Limpar cache após usar (uma vez só)
      scrollPositionsCache.delete(conversationId || '');
    } else {
      // Comportamento padrão: scroll para o final
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
    }
  }, [messages.length, conversationId]);

  // Infinite scroll: detectar quando o usuário rola para cima
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMore) return;

    // Se estiver perto do topo (100px), carregar mais mensagens
    if (container.scrollTop < 100) {
      // Marcar que é carregamento de histórico (evita scroll automático para o final)
      isLoadingHistoryRef.current = true;
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
      // Resetar flag após restaurar posição
      isLoadingHistoryRef.current = false;
    }
  }, [messages, isLoadingMore]);

  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    console.log('🚀 [SEND] Iniciando envio de mensagem:', { conversationId, content, hasFile: !!file, hasReply: !!replyToMessage });
    
    if (!conversationId) {
      console.error('❌ [SEND] Sem conversationId');
      return;
    }

    if (!profile) {
      console.error('❌ [SEND] Perfil não disponível no contexto');
      toast.error('Perfil não encontrado. Por favor, faça logout e login novamente.');
      return;
    }

    // Capturar dados de reply antes de limpar o estado
    const currentReplyTo = replyToMessage;
    
    // Limpar estado de reply imediatamente para melhor UX
    setReplyToMessage(null);

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
        timestamp: new Date().toISOString(),
        // Incluir dados de citação se houver
        quotedMessageId: currentReplyTo?.whatsappMessageId || currentReplyTo?.id,
        quotedContent: currentReplyTo?.content,
        quotedSender: currentReplyTo?.sender === 'user' ? contactName : 'Você',
      };
      
      addMessage(tempMessage);

      // Usar canal já carregado do state (evita query redundante)
      // O canal é carregado em loadConversationData() que sempre executa ao abrir a conversa
      const currentChannel = conversationChannel;
      console.log('📡 [Send] Canal da conversa (from state):', {
        conversationId,
        channel: currentChannel
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
      
      // Build metadata with attachment info and reply info if present
      const messageMetadata: Record<string, any> = {};
      if (attachmentData) {
        messageMetadata.attachment = attachmentData;
      }
      // Adicionar dados de citação aos metadados se houver reply
      if (currentReplyTo) {
        messageMetadata.quotedMessageId = currentReplyTo.whatsappMessageId || currentReplyTo.id;
        messageMetadata.quotedContent = currentReplyTo.content;
        messageMetadata.quotedSender = currentReplyTo.sender === 'user' ? contactName : 'Você';
        messageMetadata.quotedAttachmentType = currentReplyTo.attachment?.type;
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
              // Garantir que o messageId do quoted existe (prioridade: whatsappMessageId > id da mensagem)
              // IMPORTANTE: whatsappMessageId é preenchido em useInfiniteMessages.ts com fallback para external_id
              const quotedMessageId = currentReplyTo?.whatsappMessageId;
              
              console.log('📩 [Reply] Dados de citação:', {
                hasReplyTo: !!currentReplyTo,
                quotedMessageId,
                whatsappMessageId: currentReplyTo?.whatsappMessageId,
                messageId: currentReplyTo?.id,
                sender: currentReplyTo?.sender,
              });
              
              const { data: response, error: whatsappError } = await supabase.functions.invoke(
              'send-whatsapp-message',
              {
                body: {
                  conversation_id: conversationId,
                  message_id: data.id, // Passar ID da mensagem para atualizar metadata
                  message_content: content || undefined,
                  attachment: attachmentData,
                  agent_name: profile?.name || 'Atendente',
                  // Dados para reply/quoted se houver - só envia se tiver messageId válido
                  // isFromAgent é necessário para o protocolo WhatsApp definir fromMe corretamente
                  quoted: (currentReplyTo && quotedMessageId) ? {
                    messageId: quotedMessageId,
                    content: currentReplyTo.content,
                    senderName: currentReplyTo.sender === 'user' ? contactName : 'Você',
                    isFromAgent: currentReplyTo.sender === 'agent',  // Define fromMe no protocolo WhatsApp
                  } : undefined,
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
  }, [conversationId, conversationChannel, profile, replyToMessage, contactName, addMessage, replaceTemporaryMessage, updateMessage]);

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

  // ========== HANDLERS DE AÇÕES NAS MENSAGENS ==========
  
  // Copiar texto da mensagem
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Mensagem copiada!');
  }, []);

  // Abrir dialog de edição
  const handleEditMessage = useCallback((message: Message) => {
    setEditingMessage(message);
    setShowEditDialog(true);
  }, []);

  // Salvar edição da mensagem (local + WhatsApp se aplicável)
  const handleSaveEdit = useCallback(async (messageId: string, newContent: string) => {
    try {
      const editedAt = new Date().toISOString();
      
      // Buscar metadata atual
      const { data: currentMsg } = await supabase
        .from('messages')
        .select('metadata, created_at, sender_type')
        .eq('id', messageId)
        .single();
      
      const currentMetadata = (typeof currentMsg?.metadata === 'object' && currentMsg?.metadata !== null)
        ? currentMsg.metadata as Record<string, unknown>
        : {};

      // IMPORTANTE: Obter o whatsappMessageId com prioridade correta
      // external_id é o ID original recebido do webhook, whatsappMessageId é usado internamente
      const whatsappMessageId = currentMetadata.external_id || currentMetadata.whatsappMessageId || currentMetadata.messageId;
      const remoteJid = currentMetadata.remoteJid;
      
      console.log('✏️ [Edit] Iniciando edição:', {
        messageId,
        whatsappMessageId,
        remoteJid,
        senderType: currentMsg?.sender_type,
        createdAt: currentMsg?.created_at,
        hasExternalId: !!currentMetadata.external_id,
        hasWhatsappMessageId: !!currentMetadata.whatsappMessageId,
      });
      
      // Verificar se é uma mensagem do agente (só agentes podem editar suas próprias mensagens)
      const isAgentMessage = currentMsg?.sender_type === 'agent';
      
      // Verificar tempo de edição (WhatsApp limita a ~15 minutos)
      const messageCreatedAt = currentMsg?.created_at ? new Date(currentMsg.created_at) : null;
      const minutesSinceCreation = messageCreatedAt 
        ? (Date.now() - messageCreatedAt.getTime()) / (1000 * 60) 
        : Infinity;
      
      console.log('✏️ [Edit] Validações:', {
        isAgentMessage,
        minutesSinceCreation: minutesSinceCreation.toFixed(1),
        canEditOnWhatsApp: isAgentMessage && minutesSinceCreation < 15
      });
      
      // Atualizar no banco local primeiro
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          metadata: { ...currentMetadata, editedAt, editedLocally: true }
        })
        .eq('id', messageId);
      
      if (error) throw error;
      
      // Atualizar localmente
      updateMessage(messageId, { content: newContent, editedAt });
      
      // Tentar editar no WhatsApp se for canal WhatsApp, mensagem do agente e tiver os IDs necessários
      const canEditOnWhatsApp = conversationChannel === 'whatsapp' && 
                                 whatsappMessageId && 
                                 remoteJid && 
                                 isAgentMessage;
      
      if (canEditOnWhatsApp) {
        // Avisar se passou do limite de tempo
        if (minutesSinceCreation >= 15) {
          console.warn('⚠️ [Edit] Mensagem muito antiga para edição no WhatsApp:', minutesSinceCreation.toFixed(1), 'minutos');
          toast.warning('Mensagem editada localmente. Limite de 15 minutos do WhatsApp excedido.', {
            duration: 4000,
          });
          return;
        }
        
        try {
          // Buscar instância da conversa
          const { data: conversation } = await supabase
            .from('conversations')
            .select('metadata')
            .eq('id', conversationId)
            .single();
          
          // Fallback para VIAINFRAOFICIAL se instanceName não estiver presente
          const conversationMeta = (conversation?.metadata as Record<string, unknown>) || {};
          const instanceName = conversationMeta.instanceName as string || 'VIAINFRAOFICIAL';
          
          console.log('✏️ [Edit] Enviando para Evolution API:', {
            instanceName,
            remoteJid,
            messageId: whatsappMessageId,
            newContentLength: newContent.length
          });
          
          const { data: editResult, error: editError } = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              action: 'updateMessage',
              instanceName,
              remoteJid,
              messageId: whatsappMessageId,
              newContent
            }
          });
          
          console.log('✏️ [Edit] Resposta da Evolution API:', editResult, editError);
          
          if (editError || !editResult?.success) {
            console.warn('⚠️ [Edit] Não foi possível editar no WhatsApp:', editError || editResult?.error);
            toast.warning('Mensagem editada localmente. Edição no WhatsApp não disponível.', {
              description: editResult?.error || 'O WhatsApp limita edição a ~15 minutos após o envio',
              duration: 4000,
            });
          } else {
            toast.success('Mensagem editada no WhatsApp!');
          }
        } catch (whatsappError) {
          console.warn('⚠️ [Edit] Erro ao editar no WhatsApp:', whatsappError);
          toast.warning('Mensagem editada localmente.');
        }
      } else {
        // Mensagem editada apenas localmente
        if (!whatsappMessageId && conversationChannel === 'whatsapp') {
          toast.info('Mensagem editada localmente (sem ID do WhatsApp para propagação).');
        } else if (!isAgentMessage) {
          toast.info('Apenas mensagens enviadas por você podem ser editadas no WhatsApp.');
        } else {
          toast.success('Mensagem editada!');
        }
      }
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      toast.error('Erro ao editar mensagem');
    }
  }, [updateMessage, conversationChannel, conversationId]);

  // Toggle fixar/desafixar
  const handlePinMessage = useCallback(async (message: Message) => {
    try {
      const newPinned = !message.isPinned;
      
      // Buscar metadata atual
      const { data: currentMsg } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', message.id)
        .single();
      
      const currentMetadata = (typeof currentMsg?.metadata === 'object' && currentMsg?.metadata !== null)
        ? currentMsg.metadata as Record<string, unknown>
        : {};
      
      // Atualizar no banco
      const { error } = await supabase
        .from('messages')
        .update({ 
          metadata: { ...currentMetadata, isPinned: newPinned }
        })
        .eq('id', message.id);
      
      if (error) throw error;
      
      // Atualizar localmente
      updateMessage(message.id, { isPinned: newPinned });
      toast.success(newPinned ? 'Mensagem fixada!' : 'Mensagem desafixada!');
    } catch (error) {
      console.error('Erro ao fixar mensagem:', error);
      toast.error('Erro ao fixar mensagem');
    }
  }, [updateMessage]);

  // Toggle favoritar/desfavoritar
  const handleFavoriteMessage = useCallback(async (message: Message) => {
    try {
      const newFavorite = !message.isFavorite;
      
      // Buscar metadata atual
      const { data: currentMsg } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', message.id)
        .single();
      
      const currentMetadata = (typeof currentMsg?.metadata === 'object' && currentMsg?.metadata !== null)
        ? currentMsg.metadata as Record<string, unknown>
        : {};
      
      // Atualizar no banco
      const { error } = await supabase
        .from('messages')
        .update({ 
          metadata: { ...currentMetadata, isFavorite: newFavorite }
        })
        .eq('id', message.id);
      
      if (error) throw error;
      
      // Atualizar localmente
      updateMessage(message.id, { isFavorite: newFavorite });
      toast.success(newFavorite ? 'Adicionado aos favoritos!' : 'Removido dos favoritos!');
    } catch (error) {
      console.error('Erro ao favoritar mensagem:', error);
      toast.error('Erro ao favoritar mensagem');
    }
  }, [updateMessage]);

  // Abrir modal de encaminhamento
  const handleForwardMessage = useCallback((message: Message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
  }, []);

  // Definir mensagem para resposta (reply)
  const handleReplyMessage = useCallback((message: Message) => {
    // Verificar se a mensagem tem ID do WhatsApp para reply funcionar
    if (!message.whatsappMessageId) {
      console.warn('⚠️ [Reply] Mensagem sem whatsappMessageId - reply será enviado como mensagem normal (sem citação no WhatsApp)', {
        messageId: message.id,
        sender: message.sender,
        content: message.content?.substring(0, 50),
      });
    }
    setReplyToMessage(message);
    // Focar no input após definir reply (para UX melhor)
    // O componente ChatInput recebe o foco automaticamente
  }, []);

  // Cancelar resposta
  const handleCancelReply = useCallback(() => {
    setReplyToMessage(null);
  }, []);

  // Abrir dialog de confirmação de exclusão
  const handleDeleteMessageClick = useCallback((message: Message) => {
    setDeletingMessage(message);
    setShowDeleteDialog(true);
  }, []);

  // Confirmar exclusão da mensagem (tenta apagar no WhatsApp primeiro)
  const handleConfirmDelete = useCallback(async (messageId: string) => {
    try {
      // Buscar dados da mensagem para exclusão no WhatsApp
      const { data: msgData } = await supabase
        .from('messages')
        .select('metadata, sender_type, created_at')
        .eq('id', messageId)
        .single();
      
      const metadata = msgData?.metadata as Record<string, any>;
      // IMPORTANTE: Prioridade correta para obter o ID do WhatsApp
      const whatsappMessageId = metadata?.external_id || metadata?.whatsappMessageId || metadata?.messageId;
      const remoteJid = metadata?.remoteJid;
      const isFromAgent = msgData?.sender_type === 'agent' || deletingMessage?.sender === 'agent';
      
      // Verificar tempo desde criação (WhatsApp limita a ~1 hora para exclusão)
      const messageCreatedAt = msgData?.created_at ? new Date(msgData.created_at) : null;
      const minutesSinceCreation = messageCreatedAt 
        ? (Date.now() - messageCreatedAt.getTime()) / (1000 * 60) 
        : Infinity;
      
      console.log('🗑️ [Delete] Iniciando exclusão:', {
        messageId,
        whatsappMessageId,
        remoteJid,
        isFromAgent,
        minutesSinceCreation: minutesSinceCreation.toFixed(1),
        hasExternalId: !!metadata?.external_id,
        hasWhatsappMessageId: !!metadata?.whatsappMessageId,
        conversationChannel,
      });
      
      let whatsappDeleteSuccess = false;
      let whatsappDeleteAttempted = false;
      
      // Se for WhatsApp e tiver messageId, tentar excluir no WhatsApp
      if (conversationChannel === 'whatsapp' && whatsappMessageId && remoteJid) {
        whatsappDeleteAttempted = true;
        
        // Avisar sobre limitações de tempo
        if (minutesSinceCreation > 60) {
          console.warn('⚠️ [Delete] Mensagem muito antiga para exclusão no WhatsApp:', minutesSinceCreation.toFixed(1), 'minutos');
          toast.warning('Mensagem antiga - exclusão no WhatsApp pode não funcionar (limite: ~1 hora)', {
            duration: 4000,
          });
        }
        
        // Buscar instância da conversa
        const { data: conversation } = await supabase
          .from('conversations')
          .select('metadata')
          .eq('id', conversationId)
          .single();
        
        const conversationMeta = (conversation?.metadata as Record<string, unknown>) || {};
        const instanceName = conversationMeta.instanceName as string || 'VIAINFRAOFICIAL';
        
        console.log('🗑️ [Delete] Enviando para Evolution API:', {
          instanceName,
          remoteJid,
          messageId: whatsappMessageId,
          fromMe: isFromAgent
        });
        
        try {
          const { data: deleteResult, error: deleteError } = await supabase.functions.invoke(
            'send-whatsapp-message',
            {
              body: {
                action: 'deleteMessage',
                instanceName,
                remoteJid,
                messageId: whatsappMessageId,
                fromMe: isFromAgent
              }
            }
          );
          
          console.log('🗑️ [Delete] Resposta da Evolution API:', deleteResult, deleteError);
          
          if (deleteError || !deleteResult?.success) {
            // WhatsApp falhou - avisar usuário mas ainda deletar local
            const errorMessage = deleteResult?.error || 'Exclusão no WhatsApp não disponível';
            console.warn('⚠️ [Delete] Falha ao excluir no WhatsApp:', errorMessage);
            
            if (deleteResult?.isTimeLimit) {
              toast.warning('Mensagem apagada localmente. Limite de tempo do WhatsApp excedido (~1 hora).', {
                duration: 4000,
              });
            } else if (!isFromAgent) {
              toast.warning('Mensagem apagada localmente. Mensagens recebidas não podem ser apagadas para todos no WhatsApp.', {
                duration: 4000,
              });
            } else {
              toast.warning('Mensagem apagada localmente. ' + errorMessage, {
                duration: 4000,
              });
            }
          } else {
            whatsappDeleteSuccess = true;
            toast.success('Mensagem apagada do WhatsApp para todos!');
          }
        } catch (whatsappError) {
          console.warn('⚠️ [Delete] Erro ao excluir no WhatsApp:', whatsappError);
          toast.warning('Mensagem apagada localmente.');
        }
      }
      
      // Sempre deletar do banco local
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      // Remover localmente
      deleteMessage(messageId);
      
      // Se não for WhatsApp ou não tentou exclusão remota, mostrar sucesso simples
      if (!whatsappDeleteAttempted) {
        if (conversationChannel === 'whatsapp' && !whatsappMessageId) {
          toast.info('Mensagem apagada localmente (sem ID do WhatsApp para exclusão remota).');
        } else {
          toast.success('Mensagem apagada!');
        }
      }
    } catch (error) {
      console.error('Erro ao apagar mensagem:', error);
      toast.error('Erro ao apagar mensagem');
    }
  }, [deleteMessage, conversationChannel, conversationId, deletingMessage]);

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
        conversationStatus={conversationStatus}
        onViewContactDetails={handleViewContactDetails}
        onBackToList={handleBackToList}
        onEndConversation={onEndConversation ? () => onEndConversation(conversationId) : undefined}
        onReopenConversation={handleReopenConversation}
        onForceLoadHistory={handleForceLoadHistory}
      />
      
      {/* Seção de mensagens fixadas */}
      {messages.some(m => m.isPinned) && (
        <div className="flex-shrink-0 border-b border-border bg-amber-50/50 dark:bg-amber-950/20 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 mb-2">
            <Pin className="w-3 h-3" />
            <span className="font-medium">Mensagens Fixadas</span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {messages.filter(m => m.isPinned).map(pinnedMsg => (
              <div 
                key={`pinned-${pinnedMsg.id}`}
                className="text-xs p-2 bg-background/80 rounded border border-amber-200 dark:border-amber-800 truncate cursor-pointer hover:bg-background transition-colors"
                onClick={() => {
                  // Scroll to the pinned message
                  const element = document.getElementById(`msg-${pinnedMsg.id}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                title="Clique para ir até a mensagem"
              >
                <span className="text-muted-foreground">
                  {pinnedMsg.sender === 'agent' ? 'Você: ' : 'Cliente: '}
                </span>
                {pinnedMsg.content?.substring(0, 100)}{pinnedMsg.content && pinnedMsg.content.length > 100 ? '...' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

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
                id={`msg-${message.id}`}
                className={cn(
                  "transition-all duration-200",
                  isNewMessage && "animate-in fade-in-0 slide-in-from-bottom-3 duration-300",
                  isSentMessage && "opacity-70 scale-[0.98]",
                  !isSentMessage && message.sender === 'agent' && isLastMessage && "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                )}
              >
                <MessageItem 
                  message={message}
                  onCopy={handleCopyMessage}
                  onEdit={handleEditMessage}
                  onPin={handlePinMessage}
                  onFavorite={handleFavoriteMessage}
                  onForward={handleForwardMessage}
                  onDelete={handleDeleteMessageClick}
                  onReply={handleReplyMessage}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-shrink-0 border-t bg-background">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          replyToMessage={replyToMessage}
          onCancelReply={handleCancelReply}
          contactName={contactName}
        />
      </div>

      {/* Modais de ações */}
      <EditMessageDialog
        message={editingMessage}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleSaveEdit}
      />

      <DeleteMessageDialog
        message={deletingMessage}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
      />

      <ForwardMessageModal
        message={forwardingMessage}
        open={showForwardModal}
        onOpenChange={setShowForwardModal}
      />
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";
