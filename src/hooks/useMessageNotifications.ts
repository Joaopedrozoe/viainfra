import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useNotifications } from './useNotifications';

export const useMessageNotifications = () => {
  const { company } = useAuth();
  const { notifyNewMessage } = useNotifications();
  const lastMessageIdRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!company?.id) return;

    // Subscrever a mudanças na tabela de mensagens
    const channel = supabase
      .channel('new-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Evitar notificações duplicadas
          if (lastMessageIdRef.current.has(newMessage.id)) return;
          lastMessageIdRef.current.add(newMessage.id);

          // Só notificar mensagens de usuários (não de agentes ou bots)
          if (newMessage.sender_type !== 'user') return;

          // Buscar informações da conversa e contato
          const { data: conversation } = await supabase
            .from('conversations')
            .select(`
              id,
              company_id,
              contacts!conversations_contact_id_fkey (
                name
              )
            `)
            .eq('id', newMessage.conversation_id)
            .eq('company_id', company.id)
            .single();

          if (conversation) {
            const contactName = (conversation.contacts as any)?.name || 'Cliente';
            notifyNewMessage(contactName, newMessage.content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [company?.id, notifyNewMessage]);
};
