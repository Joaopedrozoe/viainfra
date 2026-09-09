import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from './useNotifications';
import { isConversationInFocus } from '@/lib/notification-focus';

// Helper function to detect if a message is a reaction (should not affect ordering)
const isReactionMessage = (content: string | null | undefined): boolean => {
  if (!content) return false;
  const trimmed = content.trim();
  return (
    trimmed.startsWith('Reagiu com') ||
    /^\*[^*]+\*:\s*Reagiu com/.test(trimmed) ||
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
  lastRealMessage?: {
    id: string;
    content: string;
    sender_type: 'user' | 'agent' | 'bot';
    created_at: string;
  };
  hasNewMessage?: boolean;
}

const INBOX_CONVERSATION_LIMIT = 1000;

// ---------------------------------------------------------------------------
// Estado de leitura COMPARTILHADO por empresa (tabela conversation_reads).
// O localStorage é apenas cache offline/otimista: a fonte da verdade é o banco,
// para que quando uma atendente zera a fila, todas as outras vejam zerado.
// ---------------------------------------------------------------------------
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
    const entries = Array.from(map.entries())
      .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
      .slice(0, 2000);
    localStorage.setItem(readStorageKey(companyId), JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // storage indisponível — estado em memória continua válido
  }
};

/** Mescla o estado do servidor no mapa local, mantendo o timestamp mais recente. */
const mergeReadEntry = (conversationId: string, timestamp: string) => {
  const current = readMap.get(conversationId);
  if (!current || new Date(timestamp).getTime() > new Date(current).getTime()) {
    readMap.set(conversationId, timestamp);
    return true;
  }
  return false;
};

const loadServerReadMap = async (companyId: string) => {
  const { data, error } = await supabase
    .from('conversation_reads')
    .select('conversation_id, last_read_at')
    .eq('company_id', companyId)
    .limit(5000);

  if (error) {
    console.warn('⚠️ conversation_reads fetch error:', error.message);
    return;
  }
  if (engineCompanyId !== companyId) return;

  let changed = false;
  for (const row of data || []) {
    if (mergeReadEntry(row.conversation_id as string, row.last_read_at as string)) changed = true;
  }
  if (changed) persistReadMap(companyId, readMap);
};

const pushServerRead = async (
  companyId: string,
  conversationId: string,
  timestamp: string
) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id ?? null;
  const { error } = await supabase
    .from('conversation_reads')
    .upsert(
      {
        conversation_id: conversationId,
        company_id: companyId,
        last_read_at: timestamp,
        last_read_by: userId,
      },
      { onConflict: 'conversation_id' }
    );
  if (error) console.warn('⚠️ conversation_reads upsert error:', error.message);
};


// ---------------------------------------------------------------------------
// Engine única compartilhada por TODOS os consumidores do hook.
// Antes, cada componente que chamava useConversations criava seu próprio canal
// realtime + polling + busca de até 1.000 conversas, multiplicando o custo e
// travando a interface. Agora existe apenas uma engine por empresa ativa.
// ---------------------------------------------------------------------------
interface StoreState {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
  lastSyncTime: Date | null;
}

let store: StoreState = { conversations: [], loading: true, error: null, lastSyncTime: null };
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

const setStore = (patch: Partial<StoreState>) => {
  store = { ...store, ...patch };
  emit();
};

const setConversations = (
  updater: Conversation[] | ((prev: Conversation[]) => Conversation[])
) => {
  const next = typeof updater === 'function'
    ? (updater as (prev: Conversation[]) => Conversation[])(store.conversations)
    : updater;
  if (next === store.conversations) return;
  setStore({ conversations: next });
};

type Notifier = {
  notifyNewConversation: (name: string, channel: string) => void;
  notifyNewMessage: (name: string, content: string) => void;
  playNotificationSound: () => void;
};

let notifier: Notifier | null = null;

let engineCompanyId: string | null = null;
let engineRefCount = 0;
let engineCleanup: (() => void) | null = null;

let readMap: Map<string, string> = new Map();
let readMapCompanyId: string | null = null;
let previousIds = new Set<string>();
const notifiedMessageIds = new Set<string>();
let sessionStart = Date.now();
let fetchRunning = false;
let lastFetchAt = 0;
let lastUnknownRefetchAt = 0;

const markConversationRead = (conversationId: string, timestamp?: string, sync = true) => {
  const ts = timestamp || new Date().toISOString();
  readMap.set(conversationId, ts);
  persistReadMap(readMapCompanyId, readMap);
  if (sync && engineCompanyId) {
    void pushServerRead(engineCompanyId, conversationId, ts);
  }
};

/** Aplica no store as conversas cujo estado de leitura veio do servidor. */
const applyReadMapToStore = () => {
  setConversations((prev) => {
    let changed = false;
    const next = prev.map((conv) => {
      if (!conv.hasNewMessage) return conv;
      const readTs = readMap.get(conv.id);
      const lastTs = conv.lastRealMessage?.created_at;
      if (readTs && lastTs && new Date(readTs).getTime() >= new Date(lastTs).getTime()) {
        changed = true;
        return { ...conv, hasNewMessage: false };
      }
      return conv;
    });
    return changed ? next : prev;
  });
};


const fetchConversations = async (companyId: string, silent = false) => {
  if (!companyId || engineCompanyId !== companyId) return;
  if (fetchRunning) return;

  fetchRunning = true;
  if (!silent) setStore({ loading: true });
  lastFetchAt = Date.now();

  try {
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
      .eq('company_id', companyId)
      .or('metadata->>remoteJid.is.null,metadata->>remoteJid.neq.status@broadcast')
      .order('updated_at', { ascending: false })
      .limit(INBOX_CONVERSATION_LIMIT);

    if (engineCompanyId !== companyId) return;

    if (convError) {
      console.error('❌ Fetch error:', convError);
      setStore({ error: convError as unknown as Error, loading: false });
      return;
    }

    // Prévias: UMA chamada, uma linha por conversa (última mensagem + última
    // mensagem que não é reação, calculadas no servidor).
    const lastMessages: Record<string, any> = {};
    const lastRealMessages: Record<string, any> = {};

    if ((convData || []).length > 0) {
      const { data: previews, error: previewError } = await supabase.rpc(
        'get_inbox_previews_compact',
        { _company_id: companyId, _limit: INBOX_CONVERSATION_LIMIT }
      );

      if (engineCompanyId !== companyId) return;

      if (previewError) {
        console.warn('⚠️ Preview fetch error:', previewError);
      } else {
        for (const row of (previews || []) as any[]) {
          if (row.last_message_id) {
            lastMessages[row.conversation_id] = {
              id: row.last_message_id,
              content: row.last_content,
              sender_type: row.last_sender_type,
              created_at: row.last_created_at,
            };
          }
          if (row.real_message_id) {
            lastRealMessages[row.conversation_id] = {
              id: row.real_message_id,
              content: row.real_content,
              sender_type: row.real_sender_type,
              created_at: row.real_created_at,
            };
          } else if (row.last_message_id) {
            lastRealMessages[row.conversation_id] = lastMessages[row.conversation_id];
          }
        }
      }
    }

    const existingById = new Map(store.conversations.map((c) => [c.id, c]));

    const newest = <T extends { created_at: string } | undefined>(a: T, b: T): T => {
      if (!a) return b;
      if (!b) return a;
      return new Date(a.created_at).getTime() >= new Date(b.created_at).getTime() ? a : b;
    };

    const newConversations = (convData || [])
      .filter((conv) => {
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
      .map((conv) => {
        const lastMsg = lastMessages[conv.id];
        const lastRealMsg = lastRealMessages[conv.id];

        const lastRealMsgTime = lastRealMsg?.created_at || '';
        const isLastFromContact = lastRealMsg?.sender_type === 'user' &&
          !isReactionMessage(lastRealMsg?.content);

        const readTimestamp = readMap.get(conv.id);
        const wasReadAfterLastMessage = !!readTimestamp && !!lastRealMsgTime &&
          new Date(readTimestamp) >= new Date(lastRealMsgTime);

        const existingConv = existingById.get(conv.id);
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

        return {
          ...conv,
          status: conv.status as 'open' | 'resolved' | 'pending',
          metadata: conv.metadata || {},
          archived: conv.archived || false,
          contact: conv.contacts || undefined,
          lastMessage: newest(fetchedLastMessage, existingConv?.lastMessage),
          lastRealMessage: newest(fetchedLastReal, existingConv?.lastRealMessage),
          hasNewMessage: shouldHaveNewMessage ||
            (existingConv?.hasNewMessage && !wasReadAfterLastMessage) || false,
        } as Conversation;
      });

    newConversations.sort((a, b) => {
      const aTime = a.lastRealMessage?.created_at || a.lastMessage?.created_at || a.updated_at || a.created_at;
      const bTime = b.lastRealMessage?.created_at || b.lastMessage?.created_at || b.updated_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    // Notificações de novas conversas
    const currentIds = new Set(newConversations.map((c) => c.id));
    if (previousIds.size > 0) {
      newConversations.forEach((conv) => {
        if (!previousIds.has(conv.id)) {
          notifier?.notifyNewConversation(conv.contact?.name || 'Cliente', conv.channel || 'web');
        }
      });
    }
    previousIds = currentIds;

    // Fallback de notificação quando o realtime falha (dedupe por message id)
    newConversations.forEach((conv) => {
      const last = conv.lastRealMessage;
      if (!last || last.sender_type !== 'user') return;
      if (isReactionMessage(last.content)) return;
      if (new Date(last.created_at).getTime() < sessionStart) return;
      if (notifiedMessageIds.has(last.id)) return;
      notifiedMessageIds.add(last.id);
      if (notifiedMessageIds.size > 500) {
        const keep = Array.from(notifiedMessageIds).slice(-250);
        notifiedMessageIds.clear();
        keep.forEach((id) => notifiedMessageIds.add(id));
      }
      if (isConversationInFocus(conv.id)) return;
      notifier?.notifyNewMessage(conv.contact?.name || 'Cliente', last.content);
      notifier?.playNotificationSound();
    });

    if (engineCompanyId === companyId) {
      setStore({
        conversations: newConversations,
        lastSyncTime: new Date(),
        loading: false,
        error: null,
      });
    }
  } catch (err) {
    console.warn('Error fetching conversations:', err);
    setStore({ loading: false });
  } finally {
    fetchRunning = false;
  }
};

const handleNewMessage = (companyId: string, payload: any) => {
  const newMsg = payload.new as any;
  if (!newMsg?.conversation_id) return;
  if (engineCompanyId !== companyId) return;

  const known = store.conversations.some((c) => c.id === newMsg.conversation_id);
  if (!known) {
    // Mensagem de conversa fora do cache (pode ser de outra empresa, já que a
    // tabela messages não tem company_id). Refetch no máximo 1x a cada 10s.
    if (Date.now() - lastUnknownRefetchAt > 10000) {
      lastUnknownRefetchAt = Date.now();
      void fetchConversations(companyId, true);
    }
    return;
  }

  const isContactMessage = newMsg.sender_type === 'user';
  const isReaction = isReactionMessage(newMsg.content);
  const inFocus = isConversationInFocus(newMsg.conversation_id);

  if (isContactMessage && !isReaction) {
    if (inFocus) {
      markConversationRead(newMsg.conversation_id, newMsg.created_at);
    } else {
      readMap.delete(newMsg.conversation_id);
      persistReadMap(readMapCompanyId, readMap);
    }
  }

  setConversations((prev) => {
    const conversationIndex = prev.findIndex((c) => c.id === newMsg.conversation_id);
    if (conversationIndex === -1) return prev;

    const conversation = prev[conversationIndex];

    if (isContactMessage && !isReaction && !notifiedMessageIds.has(newMsg.id)) {
      notifiedMessageIds.add(newMsg.id);
      if (!inFocus) {
        notifier?.notifyNewMessage(conversation.contact?.name || 'Cliente', newMsg.content);
        notifier?.playNotificationSound();
      }
    }

    const newLastMessage = {
      id: newMsg.id,
      content: newMsg.content,
      sender_type: newMsg.sender_type,
      created_at: newMsg.created_at,
    };

    const updatedConversation: Conversation = {
      ...conversation,
      lastMessage: newLastMessage,
      lastRealMessage: isReaction ? conversation.lastRealMessage : newLastMessage,
      updated_at: isReaction ? conversation.updated_at : newMsg.created_at,
      hasNewMessage: isContactMessage && !isReaction
        ? !inFocus
        : (conversation.hasNewMessage || false),
    };

    const updated = prev.slice();
    updated.splice(conversationIndex, 1);
    if (!isReaction) {
      updated.unshift(updatedConversation);
    } else {
      updated.splice(conversationIndex, 0, updatedConversation);
    }
    return updated;
  });
};

const startEngine = (companyId: string) => {
  engineCompanyId = companyId;
  readMapCompanyId = companyId;
  readMap = loadReadMap(companyId);
  previousIds = new Set();
  notifiedMessageIds.clear();
  sessionStart = Date.now();
  fetchRunning = false;
  setStore({ conversations: [], loading: true, error: null });

  let realtimeConnected = true;

  // Carrega o estado de leitura compartilhado ANTES/em paralelo à lista, e
  // reaplica quando chegar (evita fila "fantasma" em outro dispositivo).
  void loadServerReadMap(companyId).then(() => {
    if (engineCompanyId === companyId) applyReadMapToStore();
  });

  void fetchConversations(companyId, false);

  const channel = supabase
    .channel(`inbox-rt-${companyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversation_reads', filter: `company_id=eq.${companyId}` },
      (payload) => {
        const row = (payload.new || payload.old) as any;
        if (!row?.conversation_id || !row?.last_read_at) return;
        if (engineCompanyId !== companyId) return;
        if (mergeReadEntry(row.conversation_id, row.last_read_at)) {
          persistReadMap(companyId, readMap);
          applyReadMapToStore();
        }
      }
    )

    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'conversations', filter: `company_id=eq.${companyId}` },
      () => {
        void fetchConversations(companyId, true);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `company_id=eq.${companyId}` },
      (payload) => {
        const updated = payload.new as any;
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === updated.id);
          if (index === -1) return prev;
          const existing = prev[index];
          const updatedConv = { ...existing, ...updated, status: updated.status } as Conversation;
          const shouldMoveToTop =
            new Date(updated.updated_at).getTime() > new Date(existing.updated_at).getTime();

          const newList = prev.slice();
          newList.splice(index, 1);
          if (shouldMoveToTop) {
            newList.unshift(updatedConv);
          } else {
            newList.splice(index, 0, updatedConv);
          }
          return newList;
        });
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        handleNewMessage(companyId, payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        realtimeConnected = true;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        realtimeConnected = false;
      }
    });

  // Polling de segurança: 30s com a aba visível, 2min em background.
  const pollInterval = window.setInterval(() => {
    if (engineCompanyId !== companyId) return;
    const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
    if (!visible) {
      if (Date.now() - lastFetchAt > 120000) void fetchConversations(companyId, true);
      return;
    }
    const staleAfter = realtimeConnected ? 30000 : 15000;
    if (Date.now() - lastFetchAt >= staleAfter) {
      void fetchConversations(companyId, true);
    }
  }, 10000);

  const onWake = () => {
    if (engineCompanyId !== companyId) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (Date.now() - lastFetchAt < 5000) return;
    void loadServerReadMap(companyId).then(() => {
      if (engineCompanyId === companyId) applyReadMapToStore();
    });
    void fetchConversations(companyId, true);
  };

  document.addEventListener('visibilitychange', onWake);
  window.addEventListener('focus', onWake);
  window.addEventListener('online', onWake);

  engineCleanup = () => {
    window.clearInterval(pollInterval);
    document.removeEventListener('visibilitychange', onWake);
    window.removeEventListener('focus', onWake);
    window.removeEventListener('online', onWake);
    supabase.removeChannel(channel);
  };
};

const stopEngine = () => {
  engineCleanup?.();
  engineCleanup = null;
  engineCompanyId = null;
  fetchRunning = false;
};

export const useConversations = () => {
  const { company } = useAuth();
  const { notifyNewConversation, notifyNewMessage, playNotificationSound } = useNotifications();
  const [snapshot, setSnapshot] = useState(store);

  // Notificadores compartilhados pela engine única
  useEffect(() => {
    notifier = { notifyNewConversation, notifyNewMessage, playNotificationSound };
  }, [notifyNewConversation, notifyNewMessage, playNotificationSound]);

  // Assina a store compartilhada
  useEffect(() => {
    const listener = () => setSnapshot(store);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Liga/desliga a engine única (contagem de referências entre componentes)
  useEffect(() => {
    const companyId = company?.id ?? null;
    if (!companyId) {
      setStore({ conversations: [], loading: false });
      return;
    }

    engineRefCount += 1;
    if (engineCompanyId !== companyId) {
      if (engineCompanyId) stopEngine();
      startEngine(companyId);
    }

    return () => {
      engineRefCount -= 1;
      if (engineRefCount <= 0) {
        engineRefCount = 0;
        stopEngine();
      }
    };
  }, [company?.id]);

  const refetch = useCallback(async (silent = true) => {
    if (!company?.id) return;
    await fetchConversations(company.id, silent);
  }, [company?.id]);

  const clearNewMessageFlag = useCallback((conversationId: string) => {
    markConversationRead(conversationId);
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, hasNewMessage: false } : conv))
    );
  }, []);

  /** Zera a fila de não lidas para TODA a equipe da empresa ativa. */
  const markAllAsRead = useCallback(async () => {
    const companyId = company?.id;
    if (!companyId) return 0;

    const pending = store.conversations.filter((c) => c.hasNewMessage);
    if (pending.length === 0) return 0;

    const now = new Date().toISOString();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;

    pending.forEach((c) => {
      readMap.set(c.id, now);
    });
    persistReadMap(companyId, readMap);
    setConversations((prev) => prev.map((c) => (c.hasNewMessage ? { ...c, hasNewMessage: false } : c)));

    const rows = pending.map((c) => ({
      conversation_id: c.id,
      company_id: companyId,
      last_read_at: now,
      last_read_by: userId,
    }));

    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase
        .from('conversation_reads')
        .upsert(rows.slice(i, i + 200), { onConflict: 'conversation_id' });
      if (error) {
        console.warn('⚠️ markAllAsRead error:', error.message);
        throw error;
      }
    }
    return pending.length;
  }, [company?.id]);


  const updateConversationStatus = useCallback(async (
    conversationId: string,
    status: 'open' | 'resolved' | 'pending'
  ) => {
    const { error } = await supabase
      .from('conversations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) throw error;
    setConversations((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, status } : conv))
    );
  }, []);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    senderType: 'agent' | 'bot' = 'agent'
  ) => {
    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_type: senderType, content });

    if (error) throw error;
  }, []);

  const forceSync = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('realtime-sync', { body: {} });
      if (error) console.error('Sync error:', error);
    } catch (err) {
      console.error('Force sync error:', err);
    }
    if (company?.id) await fetchConversations(company.id, false);
  }, [company?.id]);

  return {
    conversations: snapshot.conversations,
    loading: snapshot.loading,
    error: snapshot.error,
    lastSyncTime: snapshot.lastSyncTime,
    refetch,
    forceSync,
    updateConversationStatus,
    sendMessage,
    clearNewMessageFlag,
  };
};
