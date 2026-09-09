import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface InternalConversation {
  id: string;
  company_id: string;
  participants: string[];
  title?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: Array<{
    name: string;
    email: string;
    avatar_url?: string;
  }>;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

export interface InternalMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: any;
  read_by: string[];
  created_at: string;
  sender?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

// ---------------------------------------------------------------------------
// Store compartilhada: o chat interno é usado simultaneamente por Inbox,
// ConversationList e InternalChatWindow. Antes cada um mantinha sua própria
// assinatura realtime (recriada a cada mensagem) e refazia as consultas por
// conversa, o que travava a interface. Agora há uma única engine.
// ---------------------------------------------------------------------------
interface InternalStore {
  conversations: InternalConversation[];
  messages: Record<string, InternalMessage[]>;
  loading: boolean;
}

let store: InternalStore = { conversations: [], messages: {}, loading: true };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const setStore = (patch: Partial<InternalStore>) => {
  store = { ...store, ...patch };
  emit();
};

let engineKey: string | null = null;
let engineRefCount = 0;
let engineCleanup: (() => void) | null = null;
let convFetchInFlight: Promise<void> | null = null;
let lastConvFetchAt = 0;

const fetchConversationsShared = async (
  userId: string,
  companyId: string,
  force = false
): Promise<void> => {
  if (convFetchInFlight) return convFetchInFlight;
  if (!force && Date.now() - lastConvFetchAt < 5000) return;

  convFetchInFlight = (async () => {
    try {
      const { data, error } = await supabase
        .from('internal_conversations')
        .select('*')
        .contains('participants', [userId])
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const convs = data || [];
      const participantIds = Array.from(
        new Set(convs.flatMap((c) => (c.participants as string[]) || []))
      );

      // Perfis de todos os participantes em UMA consulta
      const profilesById = new Map<string, { name: string; email: string; avatar_url?: string }>();
      if (participantIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, email, avatar_url')
          .in('user_id', participantIds);
        (profiles || []).forEach((p) => {
          profilesById.set(p.user_id, {
            name: p.name,
            email: p.email,
            avatar_url: p.avatar_url || undefined,
          });
        });
      }

      // Últimas mensagens e não lidas em UMA consulta por lote de conversas
      const convIds = convs.map((c) => c.id);
      const lastByConv = new Map<string, { content: string; created_at: string; sender_id: string }>();
      const unreadByConv = new Map<string, number>();

      if (convIds.length > 0) {
        const { data: recent } = await supabase
          .from('internal_messages')
          .select('conversation_id, content, created_at, sender_id, read_by')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(1000);

        (recent || []).forEach((m: any) => {
          if (!lastByConv.has(m.conversation_id)) {
            lastByConv.set(m.conversation_id, {
              content: m.content,
              created_at: m.created_at,
              sender_id: m.sender_id,
            });
          }
          const readBy: string[] = m.read_by || [];
          if (!readBy.includes(userId)) {
            unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) || 0) + 1);
          }
        });
      }

      setStore({
        conversations: convs.map((conv) => ({
          ...conv,
          last_message: lastByConv.get(conv.id),
          unread_count: unreadByConv.get(conv.id) || 0,
          profiles: ((conv.participants as string[]) || [])
            .map((id) => profilesById.get(id))
            .filter(Boolean) as InternalConversation['profiles'],
        })) as InternalConversation[],
        loading: false,
      });
      lastConvFetchAt = Date.now();
    } catch (error) {
      console.error('Error fetching internal conversations:', error);
      setStore({ loading: false });
    } finally {
      convFetchInFlight = null;
    }
  })();

  return convFetchInFlight;
};

const fetchMessagesShared = async (conversationId: string, userId?: string) => {
  try {
    const { data: messagesData, error } = await supabase
      .from('internal_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const senderIds = [...new Set((messagesData || []).map((m) => m.sender_id))];
    const { data: profiles } = senderIds.length
      ? await supabase
          .from('profiles')
          .select('user_id, name, email, avatar_url')
          .in('user_id', senderIds)
      : { data: [] as any[] };

    const formatted = (messagesData || []).map((msg) => {
      const sender = profiles?.find((p: any) => p.user_id === msg.sender_id);
      return {
        ...msg,
        sender: sender
          ? { name: sender.name, email: sender.email, avatar_url: sender.avatar_url }
          : undefined,
      } as InternalMessage;
    });

    setStore({ messages: { ...store.messages, [conversationId]: formatted } });

    // Marca como lidas em uma única atualização por mensagem pendente
    if (userId) {
      const unread = (messagesData || []).filter(
        (m: any) => !((m.read_by as string[]) || []).includes(userId)
      );
      if (unread.length > 0) {
        await Promise.all(
          unread.map((msg: any) =>
            supabase
              .from('internal_messages')
              .update({ read_by: [...((msg.read_by as string[]) || []), userId] })
              .eq('id', msg.id)
          )
        );
      }
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
};

const startEngine = (userId: string, companyId: string) => {
  engineKey = `${userId}:${companyId}`;
  setStore({ conversations: [], messages: {}, loading: true });
  lastConvFetchAt = 0;
  void fetchConversationsShared(userId, companyId, true);

  const channel = supabase
    .channel(`internal-chat-${companyId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'internal_messages' },
      (payload) => {
        const newMessage = payload.new as InternalMessage;
        if (store.messages[newMessage.conversation_id]) {
          void fetchMessagesShared(newMessage.conversation_id, userId);
        }
        void fetchConversationsShared(userId, companyId, true);
      }
    )
    .subscribe();

  engineCleanup = () => {
    supabase.removeChannel(channel);
  };
};

const stopEngine = () => {
  engineCleanup?.();
  engineCleanup = null;
  engineKey = null;
};

export const useInternalChat = () => {
  const { user, profile } = useAuth();
  const [snapshot, setSnapshot] = useState(store);

  useEffect(() => {
    const listener = () => setSnapshot(store);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const userId = user?.id;
    const companyId = profile?.company_id;
    if (!userId || !companyId) return;

    const key = `${userId}:${companyId}`;
    engineRefCount += 1;
    if (engineKey !== key) {
      if (engineKey) stopEngine();
      startEngine(userId, companyId);
    }

    return () => {
      engineRefCount -= 1;
      if (engineRefCount <= 0) {
        engineRefCount = 0;
        stopEngine();
      }
    };
  }, [user?.id, profile?.company_id]);

  const fetchMessages = useCallback(
    (conversationId: string) => fetchMessagesShared(conversationId, user?.id),
    [user?.id]
  );

  const refetch = useCallback(() => {
    if (!user?.id || !profile?.company_id) return Promise.resolve();
    return fetchConversationsShared(user.id, profile.company_id, true);
  }, [user?.id, profile?.company_id]);

  const createConversation = useCallback(
    async (participantIds: string[], title?: string, isGroup = false) => {
      if (!user?.id || !profile?.company_id) return null;
      try {
        const { data, error } = await supabase
          .from('internal_conversations')
          .insert({
            company_id: profile.company_id,
            participants: [user.id, ...participantIds],
            title,
            is_group: isGroup,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        await fetchConversationsShared(user.id, profile.company_id, true);
        return data;
      } catch (error) {
        console.error('Error creating conversation:', error);
        return null;
      }
    },
    [user?.id, profile?.company_id]
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user?.id) return;
      try {
        const { error } = await supabase.from('internal_messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          read_by: [user.id],
        });

        if (error) throw error;

        await supabase
          .from('internal_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        await fetchMessagesShared(conversationId, user.id);
        if (profile?.company_id) {
          await fetchConversationsShared(user.id, profile.company_id, true);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [user?.id, profile?.company_id]
  );

  return {
    conversations: snapshot.conversations,
    messages: snapshot.messages,
    loading: snapshot.loading,
    fetchMessages,
    createConversation,
    sendMessage,
    refetch,
  };
};
