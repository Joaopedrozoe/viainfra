import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Attachment } from '@/components/app/chat/types';

const PAGE_SIZE = 50; // Mensagens por página

interface UseInfiniteMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  loadInitialMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  replaceTemporaryMessage: (tempContent: string, realMessage: Message) => void;
  deleteMessage: (id: string) => void;
}

export function useInfiniteMessages(conversationId: string | null): UseInfiniteMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const oldestTimestampRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const mapMessage = useCallback((msg: any): Message => {
    const attachmentData = msg.metadata?.attachment;
    const attachment: Attachment | undefined = attachmentData ? {
      type: attachmentData.type,
      url: attachmentData.url,
      filename: attachmentData.filename,
      mimeType: attachmentData.mimeType,
    } : undefined;

    let deliveryStatus: Message['deliveryStatus'] = undefined;
    if (msg.sender_type === 'agent' && msg.metadata?.whatsappStatus) {
      deliveryStatus = msg.metadata.whatsappStatus as Message['deliveryStatus'];
    }

    return {
      id: msg.id,
      content: msg.content,
      sender: msg.sender_type === 'user' ? 'user' : msg.sender_type === 'agent' ? 'agent' : 'bot',
      timestamp: msg.created_at,
      attachment,
      deliveryStatus,
      whatsappMessageId: msg.metadata?.whatsappMessageId,
      // Campos para mídia indisponível (marcada pelo script de reparo)
      mediaUnavailable: msg.metadata?.mediaUnavailable || false,
      mediaType: msg.metadata?.mediaType,
      // Campos para mensagens com reply/citação
      quotedMessageId: msg.metadata?.quotedMessageId,
      quotedContent: msg.metadata?.quotedContent,
      quotedSender: msg.metadata?.quotedSender,
      quotedAttachmentType: msg.metadata?.quotedAttachmentType,
    };
  }, []);

  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    seenIdsRef.current.clear();
    oldestTimestampRef.current = null;

    try {
      console.log('📥 [INFINITE] Carregando mensagens iniciais...');

      // Primeiro, pegar contagem total
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      setTotalCount(count || 0);
      console.log(`📊 [INFINITE] Total de mensagens na conversa: ${count}`);

      // Carregar as últimas PAGE_SIZE mensagens (mais recentes)
      const { data: recentMessages, error } = await supabase
        .from('messages')
        .select('id, content, sender_type, created_at, metadata, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error('❌ [INFINITE] Erro ao carregar mensagens:', error);
        return;
      }

      if (!recentMessages || recentMessages.length === 0) {
        setMessages([]);
        setHasMore(false);
        return;
      }

      // Reverter ordem para exibição (mais antigas primeiro)
      const orderedMessages = recentMessages.reverse();
      
      // Mapear e deduplicar
      const mappedMessages: Message[] = [];
      for (const msg of orderedMessages) {
        if (!seenIdsRef.current.has(msg.id)) {
          seenIdsRef.current.add(msg.id);
          mappedMessages.push(mapMessage(msg));
        }
      }

      // Guardar timestamp mais antigo para paginação
      if (mappedMessages.length > 0) {
        oldestTimestampRef.current = mappedMessages[0].timestamp;
      }

      // Verificar se há mais mensagens
      setHasMore(recentMessages.length === PAGE_SIZE && (count || 0) > PAGE_SIZE);
      setMessages(mappedMessages);

      console.log(`✅ [INFINITE] ${mappedMessages.length} mensagens iniciais carregadas`);

      // Marcar como lidas (background, não bloqueia)
      markMessagesAsRead(orderedMessages);

    } catch (error) {
      console.error('💥 [INFINITE] Erro:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, mapMessage]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMore || isLoadingMore || !oldestTimestampRef.current) {
      return;
    }

    setIsLoadingMore(true);

    try {
      console.log('📥 [INFINITE] Carregando mais mensagens antigas...');

      // Buscar mensagens ANTES do timestamp mais antigo atual
      const { data: olderMessages, error } = await supabase
        .from('messages')
        .select('id, content, sender_type, created_at, metadata, sender_id')
        .eq('conversation_id', conversationId)
        .lt('created_at', oldestTimestampRef.current)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        console.error('❌ [INFINITE] Erro ao carregar mais mensagens:', error);
        return;
      }

      if (!olderMessages || olderMessages.length === 0) {
        console.log('📭 [INFINITE] Não há mais mensagens antigas');
        setHasMore(false);
        return;
      }

      // Reverter ordem para exibição
      const orderedMessages = olderMessages.reverse();

      // Mapear e deduplicar
      const mappedMessages: Message[] = [];
      for (const msg of orderedMessages) {
        if (!seenIdsRef.current.has(msg.id)) {
          seenIdsRef.current.add(msg.id);
          mappedMessages.push(mapMessage(msg));
        }
      }

      if (mappedMessages.length === 0) {
        setHasMore(false);
        return;
      }

      // Atualizar timestamp mais antigo
      oldestTimestampRef.current = mappedMessages[0].timestamp;

      // Adicionar mensagens antigas NO INÍCIO do array
      setMessages(prev => [...mappedMessages, ...prev]);

      // Verificar se há mais
      setHasMore(olderMessages.length === PAGE_SIZE);

      console.log(`✅ [INFINITE] +${mappedMessages.length} mensagens antigas carregadas`);

    } catch (error) {
      console.error('💥 [INFINITE] Erro ao carregar mais:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, isLoadingMore, mapMessage]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Evitar duplicatas
      if (seenIdsRef.current.has(message.id)) {
        return prev;
      }
      seenIdsRef.current.add(message.id);
      return [...prev, message];
    });
    setTotalCount(prev => prev + 1);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const replaceTemporaryMessage = useCallback((tempContent: string, realMessage: Message) => {
    setMessages(prev => {
      const tempIndex = prev.findIndex(msg => msg.id.startsWith('temp-') && msg.content === tempContent);
      if (tempIndex === -1) {
        // Não encontrou temp, apenas adiciona
        if (!seenIdsRef.current.has(realMessage.id)) {
          seenIdsRef.current.add(realMessage.id);
          return [...prev, realMessage];
        }
        return prev;
      }
      // Substitui a mensagem temporária
      seenIdsRef.current.add(realMessage.id);
      return prev.map((msg, idx) => idx === tempIndex ? realMessage : msg);
    });
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    seenIdsRef.current.delete(id);
    setTotalCount(prev => Math.max(0, prev - 1));
  }, []);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    loadInitialMessages,
    loadMoreMessages,
    addMessage,
    updateMessage,
    replaceTemporaryMessage,
    deleteMessage,
  };
}

// Função auxiliar para marcar mensagens como lidas (background)
async function markMessagesAsRead(messages: any[]) {
  const unreadMessages = messages.filter(
    msg => msg.sender_type !== 'agent' && !msg.metadata?.read
  );

  if (unreadMessages.length === 0) return;

  console.log(`📖 [INFINITE] Marcando ${unreadMessages.length} mensagens como lidas`);

  // Fazer updates em paralelo (máximo 10 por vez)
  const batchSize = 10;
  for (let i = 0; i < unreadMessages.length; i += batchSize) {
    const batch = unreadMessages.slice(i, i + batchSize);
    await Promise.all(
      batch.map(msg => {
        const currentMetadata = (typeof msg.metadata === 'object' && msg.metadata !== null)
          ? msg.metadata
          : {};
        return supabase
          .from('messages')
          .update({ metadata: { ...currentMetadata, read: true } })
          .eq('id', msg.id);
      })
    );
  }
}
