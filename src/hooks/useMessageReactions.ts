import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message, MessageReaction } from "@/components/app/chat/types";

interface UseMessageReactionsParams {
  conversationId?: string;
  remoteJid?: string;
}

/**
 * Carrega e mantém em tempo real as reações (emoji) das mensagens de uma conversa.
 * Envia/remove reações via API oficial do WhatsApp (edge function send-whatsapp-message).
 */
export const useMessageReactions = ({ conversationId, remoteJid }: UseMessageReactionsParams) => {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const conversationIdRef = useRef<string | undefined>(conversationId);
  conversationIdRef.current = conversationId;

  const mapRow = useCallback((row: any): MessageReaction => ({
    id: row.id,
    messageId: row.message_id,
    emoji: row.emoji,
    reactorType: row.reactor_type === 'agent' ? 'agent' : 'user',
    reactorName: row.reactor_name,
  }), []);

  useEffect(() => {
    if (!conversationId) {
      setReactions([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('id, message_id, emoji, reactor_type, reactor_name')
        .eq('conversation_id', conversationId);

      if (cancelled) return;
      if (error) {
        console.error('[reactions] Erro ao carregar reações:', error);
        return;
      }
      setReactions((data || []).map(mapRow));
    };

    load();

    const channel = supabase
      .channel(`message-reactions-${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (conversationIdRef.current !== conversationId) return;

          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) setReactions((prev) => prev.filter((r) => r.id !== oldId));
            return;
          }

          const row = mapRow(payload.new as any);
          setReactions((prev) => {
            const others = prev.filter((r) => r.id !== row.id);
            return [...others, row];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId, mapRow]);

  const reactionsByMessage = useMemo(() => {
    const map = new Map<string, MessageReaction[]>();
    for (const reaction of reactions) {
      const list = map.get(reaction.messageId) || [];
      list.push(reaction);
      map.set(reaction.messageId, list);
    }
    return map;
  }, [reactions]);

  const toggleReaction = useCallback(async (message: Message, emoji: string) => {
    if (!conversationId) return;

    const whatsappId = message.whatsappMessageId;
    if (!whatsappId || !remoteJid) {
      toast.error('Não é possível reagir a esta mensagem');
      return;
    }

    // Reação atual do atendente nesta mensagem
    const mine = reactions.find((r) => r.messageId === message.id && r.reactorType === 'agent');
    const nextEmoji = mine?.emoji === emoji ? '' : emoji;

    // Feedback otimista
    setReactions((prev) => {
      const others = prev.filter((r) => !(r.messageId === message.id && r.reactorType === 'agent'));
      if (!nextEmoji) return others;
      return [
        ...others,
        { id: mine?.id || `temp-${message.id}`, messageId: message.id, emoji: nextEmoji, reactorType: 'agent' },
      ];
    });

    const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        action: 'reactMessage',
        conversation_id: conversationId,
        local_message_id: message.id,
        remoteJid,
        messageId: whatsappId,
        fromMe: message.sender === 'agent',
        emoji: nextEmoji,
      },
    });

    if (error || (data && data.success === false)) {
      console.error('[reactions] Falha ao reagir:', error || data?.error);
      toast.error('Não foi possível enviar a reação');
      // Reverter otimismo
      setReactions((prev) => {
        const others = prev.filter((r) => !(r.messageId === message.id && r.reactorType === 'agent'));
        return mine ? [...others, mine] : others;
      });
    }
  }, [conversationId, remoteJid, reactions]);

  return { reactionsByMessage, toggleReaction };
};
