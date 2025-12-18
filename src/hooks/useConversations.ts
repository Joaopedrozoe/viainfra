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
  hasNewMessage?: boolean; // Flag para indicar nova mensagem
}

export const useConversations = () => {
  const { company } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);
  const previousConversationsRef = useRef<Set<string>>(new Set());
  const previousMessagesRef = useRef<Map<string, string>>(new Map()); // conversation_id -> last_message_id
  const { notifyNewConversation, notifyNewMessage, playNotificationSound } = useNotifications();
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const newMessageConvsRef = useRef<Set<string>>(new Set()); // Conversas com novas mensagens

  const fetchConversations = useCallback(async (debounce = false, silent = false) => {
    if (!company?.id || !mountedRef.current) {
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches only when debouncing
    if (isFetchingRef.current && debounce) {
      return;
    }

    // Ultra-fast debounce: 30ms para real-time instantâneo
    if (debounce) {
      const now = Date.now();
      if (now - lastFetchRef.current < 30) {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        fetchTimeoutRef.current = setTimeout(() => fetchConversations(false, true), 20);
        return;
      }
    }

    try {
      isFetchingRef.current = true;
      // Nunca mostrar loading em updates para evitar flicker
      if (!debounce && !silent && mountedRef.current) setLoading(true);
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

      if (!mountedRef.current) return;

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
        // Fetch last messages - group by conversation and take latest USER message as preview
        // This matches WhatsApp Web behavior which shows the last contact message
        const { data: allLastMessages } = await supabase
          .from('messages')
          .select('id, conversation_id, content, sender_type, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });
        
        if (!mountedRef.current) return;
        
        // Group by conversation - prioritize user messages for preview (like WhatsApp Web)
        if (allLastMessages) {
          const seenLatest = new Set<string>(); // Track overall latest message per conv
          const seenUserMsg = new Set<string>(); // Track if we found a user message
          
          for (const msg of allLastMessages) {
            if (!msg.conversation_id) continue;
            
            // Store first (latest) message as fallback
            if (!seenLatest.has(msg.conversation_id)) {
              seenLatest.add(msg.conversation_id);
              // Only use bot/agent message if we don't have a user message yet
              if (!seenUserMsg.has(msg.conversation_id)) {
                lastMessages[msg.conversation_id] = msg;
              }
            }
            
            // Prefer user messages for preview (like WhatsApp Web)
            if (msg.sender_type === 'user' && !seenUserMsg.has(msg.conversation_id)) {
              seenUserMsg.add(msg.conversation_id);
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

      // Sort by lastMessage.created_at (most recent first), fallback to updated_at
      newConversations.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.updated_at;
        const bTime = b.lastMessage?.created_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
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

      if (mountedRef.current) {
        setConversations(newConversations);
      }
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      if (mountedRef.current) setError(null);
    } finally {
      if (mountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [company?.id, notifyNewConversation]);

  // Limpar flag de nova mensagem após visualização
  const clearNewMessageFlag = useCallback((conversationId: string) => {
    newMessageConvsRef.current.delete(conversationId);
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, hasNewMessage: false } : conv
      )
    );
  }, []);

  // Optimistic update for messages - atualiza UI instantaneamente
  const handleNewMessage = useCallback((payload: any) => {
    const newMsg = payload.new as any;
    if (!newMsg?.conversation_id) return;
    
    console.log('📨 New message received - instant update');
    
    // Verificar se é uma mensagem do contato (não do agente/bot)
    const isContactMessage = newMsg.sender_type === 'user';
    
    // Marcar como nova mensagem para animação
    if (isContactMessage) {
      newMessageConvsRef.current.add(newMsg.conversation_id);
    }
    
    // Atualização otimista: atualiza o estado local imediatamente
    setConversations(prev => {
      const conversation = prev.find(c => c.id === newMsg.conversation_id);
      const contactName = conversation?.contact?.name || 'Cliente';
      
      // Notificar nova mensagem se for do contato
      if (isContactMessage && conversation) {
        notifyNewMessage(contactName, newMsg.content);
        playNotificationSound();
      }
      
      const updated = prev.map(conv => {
        if (conv.id === newMsg.conversation_id) {
          return {
            ...conv,
            lastMessage: {
              id: newMsg.id,
              content: newMsg.content,
              sender_type: newMsg.sender_type,
              created_at: newMsg.created_at,
            },
            updated_at: newMsg.created_at,
            hasNewMessage: isContactMessage, // Flag de nova mensagem
          };
        }
        return conv;
      });
      
      // Re-sort by last message time
      return updated.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.updated_at;
        const bTime = b.lastMessage?.created_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    });
    
    // Background refresh para garantir consistência
    fetchConversations(true, true);
  }, [fetchConversations, notifyNewMessage, playNotificationSound]);

  useEffect(() => {
    mountedRef.current = true;
    fetchConversations(false, false);

    // Real-time subscriptions com reconexão automática
    if (company?.id) {
      console.log('📡 Setting up real-time subscriptions for company:', company.id);
      
      const channelId = `inbox-${company.id}-${Date.now()}`;
      
      // Canal unificado para conversas e mensagens - com filtro por company
      const realtimeChannel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
          },
          (payload) => {
            const newData = payload.new as any;
            if (newData?.company_id === company.id || payload.eventType === 'DELETE') {
              console.log('📬 Conversation change:', payload.eventType);
              
              // Atualização otimista para novas conversas
              if (payload.eventType === 'INSERT' && newData) {
                setConversations(prev => {
                  // Check if already exists
                  if (prev.some(c => c.id === newData.id)) return prev;
                  
                  const newConv: Conversation = {
                    ...newData,
                    status: newData.status as 'open' | 'resolved' | 'pending',
                    metadata: newData.metadata || {},
                    archived: newData.archived || false,
                  };
                  return [newConv, ...prev];
                });
              }
              
              fetchConversations(true, true);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          handleNewMessage
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          () => {
            console.log('📝 Message updated');
            fetchConversations(true, true);
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime subscription:', status);
          if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time error - will retry');
            // Retry subscription after error
            setTimeout(() => {
              if (mountedRef.current) {
                fetchConversations(false, true);
              }
            }, 2000);
          }
        });

      // Heartbeat para manter conexão ativa e detectar desconexões
      const heartbeatInterval = setInterval(() => {
        if (mountedRef.current) {
          fetchConversations(true, true);
        }
      }, 15000); // A cada 15s verifica se há updates

      return () => {
        mountedRef.current = false;
        clearInterval(heartbeatInterval);
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        supabase.removeChannel(realtimeChannel);
      };
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [company?.id, fetchConversations, handleNewMessage]);

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
    clearNewMessageFlag,
  };
};
