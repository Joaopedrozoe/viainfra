import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from './useNotifications';
import { isConversationInFocus } from '@/lib/notification-focus';


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

// Estado de leitura persistido por empresa — evita que conversas já lidas
// voltem a aparecer como "não lidas" após recarregar a página.
const readStorageKey = (companyId: string) => `inbox-read-map:${companyId}`;

const loadReadMap = (companyId: string | null): Map<string, string> => {
  if (!companyId) return new Map();
  try {
    const raw = localStorage.getItem(readStorageKey(companyId));
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
};

const persistReadMap = (companyId: string | null, map: Map<string, string>) => {
  if (!companyId) return;
  try {
    // Mantém apenas as 2.000 entradas mais recentes para não crescer sem limite
    const entries = Array.from(map.entries())
      .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
      .slice(0, 2000);
    localStorage.setItem(readStorageKey(companyId), JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // storage cheio / indisponível — estado em memória continua válido
  }
};


export const useConversations = () => {
  const { company } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Track read conversations (persistido em localStorage por empresa)
  // Key: conversationId, Value: timestamp de leitura
  const readConversationsRef = useRef<Map<string, string>>(loadReadMap(company?.id ?? null));
  const readCompanyIdRef = useRef<string | null>(company?.id ?? null);
  
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
  // Dedupe de notificações entre realtime e polling
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const sessionStartRef = useRef<number>(Date.now());
  // Espelho da lista atual — permite ler o estado mais recente dentro de
  // callbacks estáveis sem recriá-los (evita re-subscrições do realtime).
  const conversationsRef = useRef<Conversation[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const markConversationRead = useCallback((conversationId: string, timestamp?: string) => {
    readConversationsRef.current.set(conversationId, timestamp || new Date().toISOString());
    persistReadMap(readCompanyIdRef.current, readConversationsRef.current);
  }, []);



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
          const wasReadAfterLastMessage = !!readTimestamp && !!lastRealMsgTime &&
            new Date(readTimestamp) >= new Date(lastRealMsgTime);

          const existingConv = conversationsRef.current.find(c => c.id === conv.id);
          const shouldHaveNewMessage = isLastFromContact && !wasReadAfterLastMessage;

          const fetchedLastMessage = lastMsg ? {
            id: lastMsg.id,
            content: lastMsg.content,
            sender_type: lastMsg.sender_type as 'user' | 'agent' | 'bot',
            created_at: lastMsg.created_at,
          } : undefined;
          const fetchedLastReal = lastRealMsg ? {
            id: lastRealMsg.id,
            content: lastRealMsg.content,
            sender_type: lastRealMsg.sender_type as 'user' | 'agent' | 'bot',
            created_at: lastRealMsg.created_at,
          } : undefined;

          // Nunca regredir o preview: se o realtime já trouxe algo mais novo
          // que a RPC (replicação/cache), mantém o mais recente.
          const newest = <T extends { created_at: string } | undefined>(a: T, b: T): T => {
            if (!a) return b;
            if (!b) return a;
            return new Date(a.created_at).getTime() >= new Date(b.created_at).getTime() ? a : b;
          };

          return {
            ...conv,
            status: conv.status as 'open' | 'resolved' | 'pending',
            metadata: conv.metadata || {},
            archived: conv.archived || false,
            contact: conv.contacts || undefined,
            lastMessage: newest(fetchedLastMessage, existingConv?.lastMessage),
            lastRealMessage: newest(fetchedLastReal, existingConv?.lastRealMessage),
            hasNewMessage: shouldHaveNewMessage || (existingConv?.hasNewMessage && !wasReadAfterLastMessage) || false,
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

      // Fallback de notificações: quando o Realtime não conecta (CHANNEL_ERROR /
      // TIMED_OUT), o polling é a única fonte de novas mensagens. Notificamos
      // aqui também, com dedupe por message id compartilhado com o handler
      // realtime, para nunca notificar duas vezes a mesma mensagem.
      newConversations.forEach(conv => {
        const last = conv.lastRealMessage;
        if (!last || last.sender_type !== 'user') return;
        if (isReactionMessage(last.content)) return;
        if (new Date(last.created_at).getTime() < sessionStartRef.current) return;
        if (notifiedMessageIdsRef.current.has(last.id)) return;
        notifiedMessageIdsRef.current.add(last.id);
        if (notifiedMessageIdsRef.current.size > 500) {
          notifiedMessageIdsRef.current = new Set(
            Array.from(notifiedMessageIdsRef.current).slice(-250)
          );
        }
        if (isConversationInFocus(conv.id)) return;
        notifyNewMessage(conv.contact?.name || 'Cliente', last.content);
        playNotificationSound();
      });


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
  }, [company?.id, notifyNewConversation, notifyNewMessage, playNotificationSound]);

  // Handle new message - INSTANT optimistic update without refetch
  const handleNewMessage = useCallback((payload: any) => {
    const newMsg = payload.new as any;
    if (!newMsg?.conversation_id) return;
    
    const timestamp = Date.now();
    
    const isContactMessage = newMsg.sender_type === 'user';
    const isReaction = isReactionMessage(newMsg.content);
    const inFocus = isConversationInFocus(newMsg.conversation_id);

    // Mensagem do contato: se a conversa está aberta em foco, já conta como
    // lida; caso contrário volta a ficar não lida.
    if (isContactMessage && !isReaction) {
      if (inFocus) {
        markConversationRead(newMsg.conversation_id, newMsg.created_at);
      } else {
        readConversationsRef.current.delete(newMsg.conversation_id);
        persistReadMap(readCompanyIdRef.current, readConversationsRef.current);
      }
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
      
      // Notify IMMEDIATELY for contact messages (not reactions),
      // exceto quando a conversa já está aberta e a aba está em foco
      if (isContactMessage && !isReaction && !notifiedMessageIdsRef.current.has(newMsg.id)) {
        notifiedMessageIdsRef.current.add(newMsg.id);
        if (!isConversationInFocus(newMsg.conversation_id)) {
          const contactName = conversation.contact?.name || 'Cliente';
          notifyNewMessage(contactName, newMsg.content);
          playNotificationSound();
        }
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
          ? !inFocus
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
  }, [notifyNewMessage, playNotificationSound, markConversationRead]);
  
  // Stable refs for realtime handlers to prevent re-subscriptions
  const handleNewMessageRef = useRef(handleNewMessage);
  const fetchConversationsRef = useRef(fetchConversations);
  useEffect(() => {
    handleNewMessageRef.current = handleNewMessage;
    fetchConversationsRef.current = fetchConversations;
  }, [handleNewMessage, fetchConversations]);

  // Clear new message flag — persiste a leitura (sobrevive a recarregamentos)
  const clearNewMessageFlag = useCallback((conversationId: string) => {
    markConversationRead(conversationId);

    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, hasNewMessage: false } : conv
      )
    );
  }, [markConversationRead]);

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
      readCompanyIdRef.current = nextCompanyId;
      readConversationsRef.current = loadReadMap(nextCompanyId);
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

      // Polling de segurança: 15s quando a aba está visível (garante que a
      // última mensagem apareça na lista mesmo se um evento realtime falhar) e
      // 60s quando a aba está em background (economiza requisições).
      let pollCounter = 0;
      const pollInterval = setInterval(() => {
        if (!mountedRef.current) return;
        pollCounter++;
        const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
        if (!realtimeConnected || visible) {
          fetchConversationsRef.current(true);
        } else if (pollCounter % 4 === 0) {
          fetchConversationsRef.current(true);
        }
      }, 15000);

      // Atualização imediata ao voltar para a aba/janela (throttle de 3s)
      const onWake = () => {
        if (!mountedRef.current) return;
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
        if (Date.now() - lastFetchRef.current < 3000) return;
        fetchConversationsRef.current(true);
      };
      window.addEventListener('visibilitychange', onWake);
      document.addEventListener('visibilitychange', onWake);
      window.addEventListener('focus', onWake);
      window.addEventListener('online', onWake);

      return () => {
        mountedRef.current = false;
        clearInterval(pollInterval);
        clearTimeout(connectionTimeout);
        window.removeEventListener('visibilitychange', onWake);
        document.removeEventListener('visibilitychange', onWake);
        window.removeEventListener('focus', onWake);
        window.removeEventListener('online', onWake);
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
