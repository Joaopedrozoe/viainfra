import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from './useNotifications';

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
}

export const useConversations = () => {
  const { company } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);
  const previousConversationsRef = useRef<Set<string>>(new Set());
  const { notifyNewConversation } = useNotifications();
  const isFetchingRef = useRef(false);

  const fetchConversations = useCallback(async (debounce = false) => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current && debounce) {
      return;
    }

    // Debounce: evitar múltiplas chamadas em sequência rápida
    if (debounce) {
      const now = Date.now();
      if (now - lastFetchRef.current < 2000) { // Min 2 seconds entre fetches
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        fetchTimeoutRef.current = setTimeout(() => fetchConversations(false), 1000);
        return;
      }
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      lastFetchRef.current = Date.now();
      
      // Fetch conversations with contacts - without all messages (too heavy)
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
            avatar_url
          )
        `)
        .eq('company_id', company.id)
        .order('updated_at', { ascending: false });

      if (convError) {
        console.error('Supabase query error:', convError);
        setError(convError as Error);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Fetch last message for each conversation in a single query
      const conversationIds = (convData || []).map(c => c.id);
      
      let lastMessages: Record<string, any> = {};
      
      if (conversationIds.length > 0) {
        // Fetch last messages - group by conversation and take latest
        const { data: allLastMessages } = await supabase
          .from('messages')
          .select('id, conversation_id, content, sender_type, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });
        
        // Group by conversation and take only the first (latest)
        if (allLastMessages) {
          const seen = new Set<string>();
          for (const msg of allLastMessages) {
            if (msg.conversation_id && !seen.has(msg.conversation_id)) {
              seen.add(msg.conversation_id);
              lastMessages[msg.conversation_id] = msg;
            }
          }
        }
      }

      const newConversations = (convData || []).map(conv => {
        const lastMsg = lastMessages[conv.id];
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
        };
      });

      // Verificar novas conversas para notificação
      const currentIds = new Set(newConversations.map(c => c.id));
      const previousIds = previousConversationsRef.current;
      
      // Detectar novas conversas (IDs que não existiam antes) - only if we had previous data
      if (previousIds.size > 0) {
        newConversations.forEach(conv => {
          if (!previousIds.has(conv.id)) {
            const contactName = conv.contact?.name || 'Cliente';
            const channel = conv.channel || 'web';
            notifyNewConversation(contactName, channel);
          }
        });
      }
      
      // Atualizar referência de IDs anteriores
      previousConversationsRef.current = currentIds;

      setConversations(newConversations);
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      setError(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [company?.id, notifyNewConversation]);

  useEffect(() => {
    fetchConversations();

    // Real-time subscription with debounced refetch
    if (company?.id) {
      const channel = supabase
        .channel('conversations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `company_id=eq.${company.id}`,
          },
          () => {
            fetchConversations(true); // Com debounce
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          () => {
            fetchConversations(true); // Com debounce
          }
        )
        .subscribe();

      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        supabase.removeChannel(channel);
      };
    }
  }, [company?.id, fetchConversations]);

  const updateConversationStatus = async (conversationId: string, status: 'open' | 'resolved' | 'pending') => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;

      await fetchConversations();
    } catch (err) {
      console.error('Error updating conversation status:', err);
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

      await fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    updateConversationStatus,
    sendMessage,
  };
};
