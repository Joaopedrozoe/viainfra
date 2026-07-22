import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from './useNotifications';

// Helper function to detect if a message is a reaction (should not affect ordering)
const isReactionMessage = (content: string | null | undefined): boolean => {
  if (!content) return false;
  const trimmed = content.trim();
  // Patterns for reaction messages
  return (
    trimmed.startsWith('Reagiu com') ||
    /^\*[^*]+\*:\s*Reagiu com/.test(trimmed) || // "*Via Infra*: Reagiu com 👍"
    /^Reagiu\s+(a\s+)?.+\s+com\s/.test(trimmed)
  );
};

export interface Conversation {
  id: string;
  company_id: string;
  contact_id: string;
  channel: string;
  status: 'open' | 'resolved' | 'pending';
  assigned_to?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  contact?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    sender_type: 'user' | 'agent' | 'bot';
    created_at: string;
  };
  // Last non-reaction message for sorting purposes
  lastRealMessage?: {
    id: string;
    content: string;
    sender_type: 'user' | 'agent' | 'bot';
    created_at: string;
  };
  hasNewMessage?: boolean;
}

// Supabase limita respostas a 1.000 linhas por padrão. Usar o mesmo limite
// para conversas e previews evita que atualizações em massa de updated_at
// (ex.: reconexão da instância) removam conversas válidas do inbox.
const INBOX_CONVERSATION_LIMIT = 1000;

export const useConversations = () => {
  const { company } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Track read conversations during the session (persists across refetches)
  // Key: conversationId, Value: timestamp of last message when marked as read
  const readConversationsRef = useRef<Map<string, string>>(new Map());
  
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);
  const previousConversationsRef = useRef<Set<string>>(new Set());
  const { notifyNewConversation, notifyNewMessage, playNotificationSound } = useNotifications();
  // Lock por empresa — evita que um fetch da empresa anterior bloqueie o da nova
  const isFetchingRef = useRef<{ companyId: string | null; running: boolean }>({ companyId: null, running: false });
  const mountedRef = useRef(true);
  // Guarda a empresa "ativa" para descartar respostas de fetches obsoletos
  const activeCompanyIdRef = useRef<string | null>(null);
  // Evita limpar uma lista válida quando o efeito remonta para a mesma empresa.
  const loadedCompanyIdRef = useRef<string | null>(null);

  // Core fetch function - no debounce, always fresh data
  const fetchConversations = useCallback(async (silent = false) => {
    if (!company?.id || !mountedRef.current) {
      setLoading(false);
      return;
    }

    const requestedCompanyId = company.id;

    // Só bloquear se já houver fetch em andamento PARA A MESMA EMPRESA
    if (isFetchingRef.current.running && isFetchingRef.current.companyId === requestedCompanyId) {
      return;
    }

    try {
      isFetchingRef.current = { companyId: requestedCompanyId, running: true };
      if (!silent && mountedRef.current) setLoading(true);
      setError(null);
      lastFetchRef.current = Date.now();

      
      // Fetch conversations with contacts
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          company_id,
          contact_id,
          channel,
          status,
          assigned_to,
          metadata,
          created_at,
          updated_at,
          archived,
          contacts!conversations_contact_id_fkey (
            id,
            name,
            phone,
            email,
            avatar_url,
            metadata
          )
        `)
        .eq('company_id', company.id)
        // Filter out status broadcasts but allow web conversations (which don't have remoteJid)
        .or('metadata->>remoteJid.is.null,metadata->>remoteJid.neq.status@broadcast')
        .order('updated_at', { ascending: false })
        .limit(INBOX_CONVERSATION_LIMIT);

      if (!mountedRef.current) return;
      // Descartar resposta se o usuário já trocou de empresa
      if (activeCompanyIdRef.current !== requestedCompanyId) return;

      if (convError) {
        console.error('❌ Fetch error:', convError);
        setError(convError as Error);
        setLoading(false);
        isFetchingRef.current = { companyId: null, running: false };
        return;
      }

      // Fetch last messages via SINGLE RPC call (window-function on server side).
      // Reduz volume de leituras de mensagens em > 90% comparado ao SELECT IN(...)
      const conversationIds = (convData || []).map(c => c.id);
      const lastMessages: Record<string, any> = {};
      const lastRealMessages: Record<string, any> = {};

      if (conversationIds.length > 0) {
        // A RPC pode retornar até 5 previews por conversa. Buscar em páginas
        // impede o limite de 1.000 linhas do PostgREST de truncar previews e,
        // consequentemente, esconder conversas que de fato têm mensagens.
        const previews: any[] = [];
        let msgError: any = null;
        const previewPageSize = 1000;

        for (let from = 0; from < conversationIds.length * 5; from += previewPageSize) {
          const { data: page, error: pageError } = await supabase
            .rpc('get_inbox_previews', {
              _company_id: company.id,
              _limit: INBOX_CONVERSATION_LIMIT,
            })
            .range(from, from + previewPageSize - 1);

          if (pageError) {
            msgError = pageError;
            break;
          }

          previews.push(...(page || []));
          if (!page || page.length < previewPageSize) break;
        }

        if (!msgError && mountedRef.current) {
          const messagesByConv: Record<string, any[]> = {};
          for (const row of previews as any[]) {
            const convId = row.conversation_id;
            if (!messagesByConv[convId]) messagesByConv[convId] = [];
            messagesByConv[convId].push({
              id: row.message_id,
              conversation_id: convId,
              content: row.content,
              sender_type: row.sender_type,
              created_at: row.created_at,
            });
          }

          for (const convId of conversationIds) {
            const messages = messagesByConv[convId] || [];
            if (messages.length > 0) {
              lastMessages[convId] = messages[0];
              const realMessage = messages.find(m => !isReactionMessage(m.content));
              lastRealMessages[convId] = realMessage || messages[0];
            }
          }
        }
      }

      const newConversations = (convData || [])
        .filter(conv => {
          const convRemoteJid = (conv.metadata as any)?.remoteJid;
          const contactRemoteJid = (conv.contacts as any)?.metadata?.remoteJid;

          if (convRemoteJid === 'status@broadcast' || contactRemoteJid === 'status@broadcast') {
            return false;
          }

          if (conv.channel !== 'web' && convRemoteJid && (
            /^(cmj|wamid|BAE|msg|3EB)[a-zA-Z0-9]+$/i.test(convRemoteJid) ||
            !convRemoteJid.includes('@')
          )) {
            return false;
          }

          return true;
        })
        .map(conv => {
          const lastMsg = lastMessages[conv.id];
          const lastRealMsg = lastRealMessages[conv.id];

          const lastRealMsgTime = lastRealMsg?.created_at || '';
          const isLastFromContact = lastRealMsg?.sender_type === 'user' &&
                                    !isReactionMessage(lastRealMsg?.content);

          const readTimestamp = readConversationsRef.current.get(conv.id);
          const wasReadAfterLastMessage = readTimestamp && lastRealMsgTime &&
            new Date(readTimestamp) >= new Date(lastRealMsgTime);

          const existingConv = conversations.find(c => c.id === conv.id);
          const shouldHaveNewMessage = isLastFromContact && !wasReadAfterLastMessage;

          return {
            ...conv,
            status: conv.status as 'open' | 'resolved' | 'pending',
            metadata: conv.metadata || {},
            archived: conv.archived || false,
            contact: conv.contacts || undefined,
            lastMessage: lastMsg ? {
              id: lastMsg.id,
              content: lastMsg.content,
              sender_type: lastMsg.sender_type as 'user' | 'agent' | 'bot',
              created_at: lastMsg.created_at
            } : undefined,
            lastRealMessage: lastRealMsg ? {
              id: lastRealMsg.id,
              content: lastRealMsg.content,
              sender_type: lastRealMsg.sender_type as 'user' | 'agent' | 'bot',
              created_at: lastRealMsg.created_at
            } : undefined,
            hasNewMessage: existingConv
              ? (existingConv.hasNewMessage || false)
              : shouldHaveNewMessage,
          };
        });

      // CRITICAL: Sort by last REAL message time (excludes reactions)
      newConversations.sort((a, b) => {
        const aTime = a.lastRealMessage?.created_at || a.lastMessage?.created_at || a.updated_at || a.created_at;
        const bTime = b.lastRealMessage?.created_at || b.lastMessage?.created_at || b.updated_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });


      // Detect new conversations for notifications
      const currentIds = new Set(newConversations.map(c => c.id));
      const previousIds = previousConversationsRef.current;
      
      if (previousIds.size > 0) {
        newConversations.forEach(conv => {
          if (!previousIds.has(conv.id)) {
            const contactName = conv.contact?.name || 'Cliente';
            const channel = conv.channel || 'web';
            notifyNewConversation(contactName, channel);
          }
        });
      }
      
      previousConversationsRef.current = currentIds;

      if (mountedRef.current && activeCompanyIdRef.current === requestedCompanyId) {
        setConversations(newConversations);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      if (mountedRef.current) setError(null);
    } finally {
      if (mountedRef.current && activeCompanyIdRef.current === requestedCompanyId) {
        setLoading(false);
      }
      isFetchingRef.current = { companyId: null, running: false };
    }
  }, [company?.id, notifyNewConversation]);

  // Handle new message - INSTANT optimistic update without refetch
  const handleNewMessage = useCallback((payload: any) => {
    const newMsg = payload.new as any;
    if (!newMsg?.conversation_id) return;
    
    const timestamp = Date.now();
    
    const isContactMessage = newMsg.sender_type === 'user';
    const isReaction = isReactionMessage(newMsg.content);
    
    // Se é mensagem de contato (não reação), limpar o "read timestamp" para essa conversa
    // Isso garante que ela apareça como não lida novamente
    if (isContactMessage && !isReaction) {
      readConversationsRef.current.delete(newMsg.conversation_id);
    }
    setConversations(prev => {
      const conversationIndex = prev.findIndex(c => c.id === newMsg.conversation_id);
      
      if (conversationIndex === -1) {
        // Conversa ainda não está no cache (novo contato). Dispara refetch
        // silencioso para trazê-la para a lista imediatamente.
        fetchConversationsRef.current?.(true);
        return prev;
      }
      
      const conversation = prev[conversationIndex];
      
      // Notify IMMEDIATELY for contact messages (not reactions)
      if (isContactMessage && !isReaction) {
        const contactName = conversation.contact?.name || 'Cliente';
        notifyNewMessage(contactName, newMsg.content);
        playNotificationSound();
      }
      
      const newLastMessage = {
        id: newMsg.id,
        content: newMsg.content,
        sender_type: newMsg.sender_type,
        created_at: newMsg.created_at,
      };
      
      const updatedConversation = {
        ...conversation,
        lastMessage: newLastMessage,
        // Only update lastRealMessage if this is NOT a reaction
        lastRealMessage: isReaction ? conversation.lastRealMessage : newLastMessage,
        // Only update updated_at if NOT a reaction (prevents re-ordering)
        updated_at: isReaction ? conversation.updated_at : newMsg.created_at,
        hasNewMessage: isContactMessage && !isReaction
          ? true
          : (conversation.hasNewMessage || false),
      };
      
      // Remove from current position and add to appropriate position
      const updated = [...prev];
      updated.splice(conversationIndex, 1);
      
      if (!isReaction) {
        // Move to top for real messages
        updated.unshift(updatedConversation);
      } else {
        // Keep in same position for reactions
        updated.splice(conversationIndex, 0, updatedConversation);
      }
      
      void timestamp;
      return updated;
    });
  }, [notifyNewMessage, playNotificationSound]);
  
  // Stable refs for realtime handlers to prevent re-subscriptions
  const handleNewMessageRef = useRef(handleNewMessage);
  const fetchConversationsRef = useRef(fetchConversations);
  useEffect(() => {
    handleNewMessageRef.current = handleNewMessage;
    fetchConversationsRef.current = fetchConversations;
  }, [handleNewMessage, fetchConversations]);

  // Clear new message flag - also track in readConversationsRef to persist across refetches
  const clearNewMessageFlag = useCallback((conversationId: string) => {
    // Store the current timestamp as "read time" for this conversation
    readConversationsRef.current.set(conversationId, new Date().toISOString());
    
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, hasNewMessage: false } : conv
      )
    );
  }, []);

  // Setup realtime subscriptions and polling
  useEffect(() => {
    mountedRef.current = true;
    const nextCompanyId = company?.id ?? null;
    const companyChanged = loadedCompanyIdRef.current !== nextCompanyId;
    activeCompanyIdRef.current = nextCompanyId;

    // Limpar somente em uma troca real de empresa. Remontagens do efeito para
    // a mesma empresa preservam a lista atual até o fetch silenciosamente
    // confirmar os dados, eliminando o flash de conversas desaparecendo.
    if (companyChanged) {
      loadedCompanyIdRef.current = nextCompanyId;
      setConversations([]);
      setLoading(true);
      previousConversationsRef.current = new Set();
      readConversationsRef.current = new Map();
    }

    // CRÍTICO: Iniciar como TRUE e só marcar false em erro explícito
    // Isso evita polling desnecessário durante a conexão inicial
    let realtimeConnected = true;
    let connectionConfirmed = false;

    // Timeout para detectar se a conexão realmente falhou
    const connectionTimeout = setTimeout(() => {
      if (!connectionConfirmed && mountedRef.current) {
        console.warn('⚠️ Realtime connection timeout - still waiting for SUBSCRIBED status');
      }
    }, 10000);

    // Initial fetch
    fetchConversationsRef.current(false);


    if (company?.id) {
      // Use a stable channel ID for better connection reuse
      const channelId = `inbox-rt-${company.id}`;

      const realtimeChannel = supabase
        .channel(channelId, {
          config: {
            broadcast: { self: true },
            presence: { key: company.id },
          }
        })
        // Listen to conversation INSERTS filtered by company
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversations',
            filter: `company_id=eq.${company.id}`
          },
          () => {
            fetchConversationsRef.current(true);
          }
        )
        // Listen to conversation UPDATES filtered by company
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
            filter: `company_id=eq.${company.id}`
          },
          (payload) => {
            const updated = payload.new as any;
            setConversations(prev => {
              const index = prev.findIndex(c => c.id === updated.id);
              if (index === -1) {
                // Conversa não está em cache — ignora para não pagar refetch.
                return prev;
              }
              const existing = prev[index];
              const updatedConv = { ...existing, ...updated, status: updated.status };
              const shouldMoveToTop =
                new Date(updated.updated_at).getTime() > new Date(existing.updated_at).getTime();

              const newList = prev.slice();
              newList.splice(index, 1);
              if (shouldMoveToTop) {
                newList.unshift(updatedConv);
              } else {
                // Insere na posição original (index continua válido porque
                // removemos o próprio item nessa mesma posição).
                newList.splice(index, 0, updatedConv);
              }
              return newList;
            });
          }
        )
        // Listen to ALL message inserts - filter in handleNewMessage
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            handleNewMessageRef.current(payload);
          }
        )
        .subscribe((status) => {
          clearTimeout(connectionTimeout);
          if (status === 'SUBSCRIBED') {
            realtimeConnected = true;
            connectionConfirmed = true;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Não reinscrever manualmente — o supabase-js já faz reconnect
            // automaticamente com backoff. Reinscrições manuais causam
            // tempestade de conexões e picos de custo em Realtime.
            realtimeConnected = false;
            connectionConfirmed = false;
          }
        });

      // Adaptive polling — só dispara fetch quando realtime está desconectado
      // (60s entre tentativas). Quando conectado faz um sync leve a cada ~5min.
      let pollCounter = 0;
      const pollInterval = setInterval(() => {
        if (!mountedRef.current) return;
        pollCounter++;
        if (!realtimeConnected) {
          if (pollCounter % 2 === 0) {
            fetchConversationsRef.current(true);
          }
        } else if (pollCounter % 10 === 0) {
          fetchConversationsRef.current(true);
        }
      }, 30000);

      return () => {
        mountedRef.current = false;
        clearInterval(pollInterval);
        clearTimeout(connectionTimeout);
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        supabase.removeChannel(realtimeChannel);
      };
    }

    return () => {
      mountedRef.current = false;
    };
  }, [company?.id]);

  const updateConversationStatus = async (conversationId: string, status: 'open' | 'resolved' | 'pending') => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;
      await fetchConversations(true);
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  const sendMessage = async (conversationId: string, content: string, senderType: 'agent' | 'bot' = 'agent') => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          content,
        });

      if (error) throw error;
      await fetchConversations(true);
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  // Force sync with edge function
  const forceSync = useCallback(async () => {
    try {
      console.log('🔄 Forcing sync via edge function...');
      const { data, error } = await supabase.functions.invoke('realtime-sync', {
        body: {}
      });
      
      if (error) {
        console.error('Sync error:', error);
      } else {
        console.log('✅ Sync complete:', data);
      }
      
      // Refresh local data
      await fetchConversations(false);
    } catch (err) {
      console.error('Force sync error:', err);
    }
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    lastSyncTime,
    refetch: fetchConversations,
    forceSync,
    updateConversationStatus,
    sendMessage,
    clearNewMessageFlag,
  };
};
