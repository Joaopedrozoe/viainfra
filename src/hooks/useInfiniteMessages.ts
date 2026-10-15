import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Attachment } from '@/components/app/chat/types';
import { mergeMessages, newestConfirmed, olderThanFilter, newerThanFilter } from '@/lib/message-pagination';

const PAGE_SIZE = 50; // Mensagens por página

interface UseInfiniteMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  loadMoreError: boolean;
  loadInitialMessages: () => Promise<void>;
  syncLatest: () => Promise<void>;
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
  const [loadMoreError, setLoadMoreError] = useState(false);
  const oldestTimestampRef = useRef<string | null>(null);
  const oldestRef = useRef<{ id: string; timestamp: string } | null>(null);
  const activeConvRef = useRef<string | null>(conversationId);
  activeConvRef.current = conversationId;
  const messagesRef = useRef<Message[]>([]);
  const syncingRef = useRef(false);

  // Troca de conversa: limpa estado para nada da conversa anterior permanecer
  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setLoadMoreError(false);
    seenIdsRef.current = new Set();
    oldestRef.current = null;
    oldestTimestampRef.current = null;
  }, [conversationId]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const mapMessage = useCallback((msg: any): Message => {
    const attachmentData = msg.metadata?.attachment;
    const attachment: Attachment | undefined = attachmentData ? {
      type: attachmentData.type,
      url: attachmentData.url,
      filename: attachmentData.filename,
      mimeType: attachmentData.mimeType,
      size: attachmentData.size,
      latitude: attachmentData.latitude,
      longitude: attachmentData.longitude,
      locationName: attachmentData.locationName,
      locationAddress: attachmentData.locationAddress,
      contactName: attachmentData.contactName,
      contactPhones: attachmentData.contactPhones,
      vcard: attachmentData.vcard,
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
      // Unificar ID: mensagens enviadas usam whatsappMessageId, recebidas usam external_id
      whatsappMessageId: msg.metadata?.whatsappMessageId || msg.metadata?.external_id,
      // Campos para mídia indisponível (marcada pelo script de reparo)
      mediaUnavailable: msg.metadata?.mediaUnavailable || false,
      mediaType: msg.metadata?.mediaType,
      // Campos para mensagens com reply/citação
      quotedMessageId: msg.metadata?.quotedMessageId,
      quotedContent: msg.metadata?.quotedContent,
      quotedSender: msg.metadata?.quotedSender,
      quotedAttachmentType: msg.metadata?.quotedAttachmentType,
      senderName: msg.metadata?.sender_name || msg.metadata?.participantName,
    };
  }, []);

  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) return;

    const convAtStart = conversationId;
    setIsLoading(true);
    setLoadMoreError(false);
    seenIdsRef.current.clear();
    oldestTimestampRef.current = null;
    oldestRef.current = null;

    try {
      // Carregar as últimas PAGE_SIZE+1 mensagens para descobrir se há mais,
      // sem custo de um COUNT(*) exato na tabela messages.
      const { data: recentMessages, error } = await supabase
        .from('messages')
        .select('id, content, sender_type, created_at, metadata, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE + 1);

      if (activeConvRef.current !== convAtStart) return;
      if (error) {
        console.error('❌ [INFINITE] Erro ao carregar mensagens:', error);
        return;
      }

      if (!recentMessages || recentMessages.length === 0) {
        setMessages([]);
        setHasMore(false);
        setTotalCount(0);
        return;
      }

      const hasMoreThanPage = recentMessages.length > PAGE_SIZE;
      const pageMessages = hasMoreThanPage ? recentMessages.slice(0, PAGE_SIZE) : recentMessages;

      // Reverter ordem para exibição (mais antigas primeiro)
      const orderedMessages = pageMessages.reverse();

      // Mapear e deduplicar
      const mappedMessages: Message[] = [];
      for (const msg of orderedMessages) {
        if (!seenIdsRef.current.has(msg.id)) {
          seenIdsRef.current.add(msg.id);
          mappedMessages.push(mapMessage(msg));
        }
      }

      if (mappedMessages.length > 0) {
        oldestTimestampRef.current = mappedMessages[0].timestamp;
        oldestRef.current = { id: mappedMessages[0].id, timestamp: mappedMessages[0].timestamp };
      }

      setHasMore(hasMoreThanPage);
      setTotalCount(mappedMessages.length + (hasMoreThanPage ? 1 : 0));
      // Preservar mensagens recebidas via realtime durante a carga
      setMessages(prev => {
        const lastTs = mappedMessages.length ? mappedMessages[mappedMessages.length - 1].timestamp : '';
        const extra = prev.filter(m => !seenIdsRef.current.has(m.id) && !m.id.startsWith('temp-') && m.timestamp >= lastTs);
        extra.forEach(m => seenIdsRef.current.add(m.id));
        const temps = prev.filter(m => m.id.startsWith('temp-'));
        return [...mappedMessages, ...extra, ...temps];
      });

      // Removido: markMessagesAsRead. metadata.read não é utilizado em nenhum
      // ponto do app e gerava um UPDATE por mensagem a cada abertura do chat.

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

    const convAtStart = conversationId;
    const cursor = oldestRef.current;
    if (!cursor) return;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      const { data: olderMessages, error } = await supabase
        .from('messages')
        .select('id, content, sender_type, created_at, metadata, sender_id')
        .eq('conversation_id', conversationId)
        .or(olderThanFilter(cursor))
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);

      if (activeConvRef.current !== convAtStart) return;
      if (error) {
        console.error('❌ [INFINITE] Erro ao carregar mais mensagens:', error);
        setLoadMoreError(true);
        return;
      }

      const rows = olderMessages || [];
      if (rows.length > 0) {
        const last = rows[rows.length - 1];
        // Cursor avança sempre pelo banco, mesmo se a página vier repetida
        oldestRef.current = { id: last.id, timestamp: last.created_at };
        oldestTimestampRef.current = last.created_at;
        const mapped = rows.reverse().filter(m => !seenIdsRef.current.has(m.id)).map(mapMessage);
        mapped.forEach(m => seenIdsRef.current.add(m.id));
        if (mapped.length) setMessages(prev => mergeMessages(prev, mapped));
      }
      // Fim do histórico só quando o banco devolve menos que uma página
      setHasMore(rows.length === PAGE_SIZE);
    } catch (error) {
      console.error('💥 [INFINITE] Erro ao carregar mais:', error);
      if (activeConvRef.current === convAtStart) setLoadMoreError(true);
    } finally {
      if (activeConvRef.current === convAtStart) setIsLoadingMore(false);
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

  // Busca incremental das mensagens mais recentes (reconexão, foco da aba,
  // preview mais novo que o chat). Não reseta a lista nem o scroll.
  const syncLatest = useCallback(async () => {
    if (!conversationId || syncingRef.current) return;
    const convAtStart = conversationId;
    let cursor: { id: string; timestamp: string } | null = newestConfirmed(messagesRef.current);
    if (!cursor) return;
    syncingRef.current = true;
    try {
      for (let batch = 0; batch < 10; batch++) {
        const { data, error } = await supabase
          .from('messages')
          .select('id, content, sender_type, created_at, metadata, sender_id')
          .eq('conversation_id', conversationId)
          .or(newerThanFilter(cursor))
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(PAGE_SIZE);
        if (activeConvRef.current !== convAtStart || error || !data) return;
        if (data.length) {
          const last = data[data.length - 1];
          cursor = { id: last.id, timestamp: last.created_at };
          const fresh = data.filter(m => !seenIdsRef.current.has(m.id)).map(mapMessage);
          fresh.forEach(m => seenIdsRef.current.add(m.id));
          if (fresh.length) setMessages(prev => mergeMessages(prev, fresh));
        }
        if (data.length < PAGE_SIZE) return;
      }
      // Lacuna maior que 500: recarrega preservando temporárias
      if (activeConvRef.current === convAtStart) await loadInitialMessages();
    } finally {
      syncingRef.current = false;
    }
  }, [conversationId, mapMessage, loadInitialMessages]);

  messagesRef.current = messages;

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    loadMoreError,
    loadInitialMessages,
    syncLatest,
    loadMoreMessages,
    addMessage,
    updateMessage,
    replaceTemporaryMessage,
    deleteMessage,
  };
}

// Removido: markMessagesAsRead — o campo metadata.read não é consumido em
// nenhum ponto da aplicação e gerava milhares de UPDATE messages/dia.

