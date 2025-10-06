import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

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
  contact?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
  };
  messages?: Array<{
    id: string;
    content: string;
    sender_type: 'user' | 'agent' | 'bot';
    created_at: string;
  }>;
}

export const useConversations = () => {
  const { company } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);

  const fetchConversations = async (debounce = false) => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    // Debounce: evitar múltiplas chamadas em sequência rápida
    if (debounce) {
      const now = Date.now();
      if (now - lastFetchRef.current < 1000) { // Min 1 segundo entre fetches
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        fetchTimeoutRef.current = setTimeout(() => fetchConversations(false), 500);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      lastFetchRef.current = Date.now();
      
      const { data, error } = await supabase
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
            created_at
          )
        `)
        .eq('company_id', company.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        setError(error as Error);
        setLoading(false);
        return;
      }

      const newConversations = (data || []).map(conv => ({
        ...conv,
        status: conv.status as 'open' | 'resolved' | 'pending',
        metadata: conv.metadata || {},
        messages: (conv.messages || []).map(msg => ({
          ...msg,
          sender_type: msg.sender_type as 'user' | 'agent' | 'bot',
        })),
      }));

      // Só atualizar se realmente houver mudanças
      setConversations(prev => {
        const prevIds = prev.map(c => c.id).sort().join(',');
        const newIds = newConversations.map(c => c.id).sort().join(',');
        
        if (prevIds === newIds) {
          // Mesmo conjunto de IDs, verificar se conteúdo mudou
          const prevJson = JSON.stringify(prev);
          const newJson = JSON.stringify(newConversations);
          if (prevJson === newJson) {
            return prev; // Sem mudanças, manter referência anterior
          }
        }
        
        return newConversations;
      });
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      setConversations([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Real-time subscription
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [company?.id]);

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
