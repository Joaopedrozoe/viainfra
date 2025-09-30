import { useState, useEffect } from 'react';
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

export const useInternalChat = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<InternalConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, InternalMessage[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch all internal conversations for current user
  const fetchConversations = async () => {
    if (!user?.id || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('internal_conversations')
        .select(`
          *,
          internal_messages!inner (
            content,
            created_at,
            sender_id
          )
        `)
        .contains('participants', [user.id])
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('internal_messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count } = await supabase
            .from('internal_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .not('read_by', 'cs', `{${user.id}}`);

          // Get participant profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('name, email, avatar_url')
            .in('user_id', conv.participants);

          return {
            ...conv,
            last_message: lastMsg,
            unread_count: count || 0,
            profiles: profiles || [],
          };
        })
      );

      setConversations(conversationsWithLastMessage);
    } catch (error) {
      console.error('Error fetching internal conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select(`
          *,
          profiles:sender_id (
            name,
            email,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = (data || []).map(msg => ({
        ...msg,
        sender: Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles
      }));

      setMessages(prev => ({
        ...prev,
        [conversationId]: formattedMessages
      }));

      // Mark messages as read
      if (user?.id) {
        const { data: unreadMessages } = await supabase
          .from('internal_messages')
          .select('id, read_by')
          .eq('conversation_id', conversationId)
          .not('read_by', 'cs', `{${user.id}}`);

        if (unreadMessages && unreadMessages.length > 0) {
          for (const msg of unreadMessages) {
            await supabase
              .from('internal_messages')
              .update({ read_by: [...msg.read_by, user.id] })
              .eq('id', msg.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Create new conversation
  const createConversation = async (participantIds: string[], title?: string, isGroup: boolean = false) => {
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

      await fetchConversations();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Send message
  const sendMessage = async (conversationId: string, content: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('internal_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          read_by: [user.id],
        });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('internal_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      await fetchMessages(conversationId);
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('internal-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
        },
        (payload) => {
          const newMessage = payload.new as InternalMessage;
          if (messages[newMessage.conversation_id]) {
            fetchMessages(newMessage.conversation_id);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, messages]);

  useEffect(() => {
    fetchConversations();
  }, [user?.id, profile?.company_id]);

  return {
    conversations,
    messages,
    loading,
    fetchMessages,
    createConversation,
    sendMessage,
    refetch: fetchConversations,
  };
};
