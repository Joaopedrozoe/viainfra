import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingStatus {
  conversationId: string;
  contactId: string;
  isTyping: boolean;
  updatedAt: string;
}

export const useTypingIndicator = (conversationIds: string[] = []) => {
  const [typingStatuses, setTypingStatuses] = useState<Map<string, TypingStatus>>(new Map());

  // Cleanup expired typing statuses
  const cleanupExpired = useCallback(() => {
    const now = Date.now();
    const expireTime = 10000; // 10 seconds
    
    setTypingStatuses(prev => {
      const newMap = new Map(prev);
      let changed = false;
      
      for (const [key, status] of newMap) {
        const statusTime = new Date(status.updatedAt).getTime();
        if (now - statusTime > expireTime) {
          newMap.delete(key);
          changed = true;
        }
      }
      
      return changed ? newMap : prev;
    });
  }, []);

  useEffect(() => {
    if (conversationIds.length === 0) return;

    // Initial fetch
    const fetchTypingStatus = async () => {
      const { data, error } = await supabase
        .from('typing_status')
        .select('*')
        .in('conversation_id', conversationIds)
        .eq('is_typing', true)
        .gt('expires_at', new Date().toISOString());

      if (!error && data) {
        const newMap = new Map<string, TypingStatus>();
        for (const row of data) {
          newMap.set(row.conversation_id, {
            conversationId: row.conversation_id,
            contactId: row.contact_id,
            isTyping: row.is_typing,
            updatedAt: row.updated_at,
          });
        }
        setTypingStatuses(newMap);
      }
    };

    fetchTypingStatus();

    // Real-time subscription
    const channel = supabase
      .channel('typing-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_status',
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          if (payload.eventType === 'DELETE' && oldData?.conversation_id) {
            setTypingStatuses(prev => {
              const newMap = new Map(prev);
              newMap.delete(oldData.conversation_id);
              return newMap;
            });
          } else if (newData?.conversation_id && conversationIds.includes(newData.conversation_id)) {
            if (newData.is_typing) {
              setTypingStatuses(prev => {
                const newMap = new Map(prev);
                newMap.set(newData.conversation_id, {
                  conversationId: newData.conversation_id,
                  contactId: newData.contact_id,
                  isTyping: newData.is_typing,
                  updatedAt: newData.updated_at,
                });
                return newMap;
              });
            } else {
              setTypingStatuses(prev => {
                const newMap = new Map(prev);
                newMap.delete(newData.conversation_id);
                return newMap;
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup interval
    const cleanupInterval = setInterval(cleanupExpired, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(cleanupInterval);
    };
  }, [conversationIds.join(','), cleanupExpired]);

  const isTyping = useCallback((conversationId: string): boolean => {
    const status = typingStatuses.get(conversationId);
    if (!status) return false;
    
    // Check if expired
    const now = Date.now();
    const statusTime = new Date(status.updatedAt).getTime();
    return status.isTyping && (now - statusTime < 10000);
  }, [typingStatuses]);

  return {
    typingStatuses,
    isTyping,
  };
};
