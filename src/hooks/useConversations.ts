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

export const useConversations = () => {
  const { company } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFetchRef = useRef<number>(0);
  const previousConversationsRef = useRef<Set<string>>(new Set());
  const { notifyNewConversation, notifyNewMessage, playNotificationSound } = useNotifications();
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Core fetch function - no debounce, always fresh data
  const fetchConversations = useCallback(async (silent = false) => {
    if (!company?.id || !mountedRef.current) {
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
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
        .limit(200);

      if (!mountedRef.current) return;

      if (convError) {
        console.error('❌ Fetch error:', convError);
        setError(convError as Error);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Fetch last messages for ALL conversations in a SINGLE batch query
      // This replaces N sequential queries with 1 efficient query
      const conversationIds = (convData || []).map(c => c.id);
      const lastMessages: Record<string, any> = {};
      const lastRealMessages: Record<string, any> = {};
      
      if (conversationIds.length > 0) {
        // Use a single query with a window function to get last 5 messages per conversation
        // This is more efficient than N separate queries
        const { data: allMessages, error: msgError } = await supabase
          .from('messages')
          .select('id, conversation_id, content, sender_type, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        if (!msgError && allMessages && mountedRef.current) {
          // Group messages by conversation and keep only last 5 per conversation
          const messagesByConv: Record<string, any[]> = {};
          for (const msg of allMessages) {
            if (!messagesByConv[msg.conversation_id]) {
              messagesByConv[msg.conversation_id] = [];
            }
            if (messagesByConv[msg.conversation_id].length < 5) {
              messagesByConv[msg.conversation_id].push(msg);
            }
          }
          
          // Process grouped messages
          for (const convId of conversationIds) {
            const messages = messagesByConv[convId] || [];
            if (messages.length > 0) {
              // Last message (for display)
              lastMessages[convId] = messages[0];
              
              // Last REAL message (for sorting) - skip reactions
              const realMessage = messages.find(m => !isReactionMessage(m.content));
              lastRealMessages[convId] = realMessage || messages[0];
            }
          }
        }
      }

      // Build conversation list - filter out invalid JIDs
      // DEBUG: Check raw data for web conversations
      const rawWebConvs = (convData || []).filter(c => c.channel === 'web');
      console.log('🔍 RAW web conversations from Supabase:', rawWebConvs.length, rawWebConvs.map(c => ({
        id: c.id,
        channel: c.channel,
        contact: c.contacts,
        metadata: c.metadata
      })));

      const newConversations = (convData || [])
        .filter(conv => {
          const convRemoteJid = (conv.metadata as any)?.remoteJid;
          const contactRemoteJid = (conv.contacts as any)?.metadata?.remoteJid;
          
          // Skip status broadcasts
          if (convRemoteJid === 'status@broadcast' || contactRemoteJid === 'status@broadcast') {
            return false;
          }
          
          // Skip invalid JIDs (message IDs, etc.) - BUT NEVER filter web conversations
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
          
          // Detectar se há mensagem não lida:
          // - Última mensagem é do contato (user) e não é reação
          // - Preservar hasNewMessage existente se já estava setado
          const existingConv = conversations.find(c => c.id === conv.id);
          const isLastFromContact = lastRealMsg?.sender_type === 'user' && 
                                    !isReactionMessage(lastRealMsg?.content);
          
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
            // Last real message for sorting (excludes reactions)
            lastRealMessage: lastRealMsg ? {
              id: lastRealMsg.id,
              content: lastRealMsg.content,
              sender_type: lastRealMsg.sender_type as 'user' | 'agent' | 'bot',
              created_at: lastRealMsg.created_at
            } : undefined,
            // Preservar hasNewMessage ou detectar baseado na última mensagem
            hasNewMessage: existingConv?.hasNewMessage ?? isLastFromContact,
          };
        });

      // CRITICAL: Sort by last REAL message time (excludes reactions)
      newConversations.sort((a, b) => {
        // Use lastRealMessage for sorting (ignores reactions)
        const aTime = a.lastRealMessage?.created_at || a.lastMessage?.created_at || a.updated_at || a.created_at;
        const bTime = b.lastRealMessage?.created_at || b.lastMessage?.created_at || b.updated_at || b.created_at;
        const diff = new Date(bTime).getTime() - new Date(aTime).getTime();
        return diff;
      });
      
      // DEBUG: Check web conversations
      const webConvs = newConversations.filter(c => c.channel === 'web');
      console.log('🌐 Web conversations found:', webConvs.length, webConvs.map(c => ({
        id: c.id,
        name: c.contact?.name,
        status: c.status,
        hasLastMessage: !!c.lastMessage
      })));
      
      console.log('📋 Total conversations:', newConversations.length);

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

      if (mountedRef.current) {
        setConversations(newConversations);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      if (mountedRef.current) setError(null);
    } finally {
      if (mountedRef.current) setLoading(false);
      isFetchingRef.current = false;
    }
  }, [company?.id, notifyNewConversation]);

  // Handle new message - INSTANT optimistic update without refetch
  const handleNewMessage = useCallback((payload: any) => {
    const newMsg = payload.new as any;
    if (!newMsg?.conversation_id) return;
    
    const timestamp = Date.now();
    console.log(`⚡ [${timestamp}] NEW MESSAGE RECEIVED:`, {
      id: newMsg.id,
      content: newMsg.content?.substring(0, 30),
      sender: newMsg.sender_type,
      conversation: newMsg.conversation_id
    });
    
    const isContactMessage = newMsg.sender_type === 'user';
    const isReaction = isReactionMessage(newMsg.content);
    
    setConversations(prev => {
      const conversationIndex = prev.findIndex(c => c.id === newMsg.conversation_id);
      
      if (conversationIndex === -1) {
        // New conversation not in list - do a single fetch
        console.log('⚡ Conversation not found, fetching...');
        setTimeout(() => fetchConversations(true), 100);
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
        hasNewMessage: isContactMessage && !isReaction,
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
      
      console.log(`⚡ [${Date.now() - timestamp}ms] UI updated for message`);
      return updated;
    });
  }, [fetchConversations, notifyNewMessage, playNotificationSound]);

  // Clear new message flag
  const clearNewMessageFlag = useCallback((conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, hasNewMessage: false } : conv
      )
    );
  }, []);

  // Setup realtime subscriptions and polling
  useEffect(() => {
    mountedRef.current = true;
    let realtimeConnected = false;
    let lastRealtimeEvent = Date.now();
    
    // Initial fetch
    fetchConversations(false);

    if (company?.id) {
      console.log('📡 Setting up ROBUST realtime for company:', company.id);
      
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
          (payload) => {
            lastRealtimeEvent = Date.now();
            console.log('⚡ NEW conversation (realtime):', payload.new);
            fetchConversations(true);
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
            lastRealtimeEvent = Date.now();
            const updated = payload.new as any;
            console.log('⚡ UPDATED conversation (realtime):', updated.id);
            // Update in place AND move to top if updated_at changed significantly
            setConversations(prev => {
              const index = prev.findIndex(c => c.id === updated.id);
              if (index === -1) {
                // Conversation not in list, fetch to add it
                fetchConversations(true);
                return prev;
              }
              const existing = prev[index];
              const updatedConv = { ...existing, ...updated, status: updated.status };
              const newList = [...prev];
              newList.splice(index, 1);
              // Move to top if updated_at is newer
              if (new Date(updated.updated_at) > new Date(existing.updated_at)) {
                newList.unshift(updatedConv);
              } else {
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
            lastRealtimeEvent = Date.now();
            console.log('⚡ NEW message (realtime):', payload.new);
            handleNewMessage(payload);
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime status:', status);
          if (status === 'SUBSCRIBED') {
            realtimeConnected = true;
            console.log('✅ Realtime CONNECTED - instant updates enabled');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            realtimeConnected = false;
            console.error('❌ Realtime disconnected:', status);
          }
        });

      // Adaptive polling: uses subscription status instead of event timestamp
      // This avoids false positives during low-activity periods
      let pollCounter = 0;
      const pollInterval = setInterval(() => {
        if (!mountedRef.current) return;
        
        pollCounter++;
        
        // Only check connection status, NOT event timestamp
        // Low activity periods should NOT trigger fast polling
        if (!realtimeConnected) {
          // Realtime is actually disconnected - poll every 15s
          console.log('🔄 Fast poll (realtime disconnected)');
          fetchConversations(true);
        } else {
          // Realtime is connected - sync every 60s (every 4th poll)
          if (pollCounter % 4 === 0) {
            console.log('🔄 Routine sync poll (realtime connected)');
            fetchConversations(true);
          }
        }
      }, 15000); // Base interval 15s, but only fetches every 60s when realtime is connected

      return () => {
        mountedRef.current = false;
        clearInterval(pollInterval);
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
