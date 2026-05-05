import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "./types";
import { Search, Send, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  id: string;
  contactName: string;
  contactAvatar: string | null;
  channel: string;
  lastMessage: string;
}

interface ForwardMessageModalProps {
  message: Message | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForwardMessageModal({
  message,
  open,
  onOpenChange,
}: ForwardMessageModalProps) {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const { profile, company } = useAuth();

  // Carregar conversas (filtrando pela empresa atual)
  useEffect(() => {
    if (!open) return;

    const loadConversations = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('conversations')
          .select(`
            id,
            channel,
            company_id,
            contacts (
              name,
              avatar_url
            )
          `)
          .eq('status', 'open')
          .order('updated_at', { ascending: false })
          .limit(100);

        if (company?.id) {
          query = query.eq('company_id', company.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        const mapped: Conversation[] = (data || []).map((conv: any) => ({
          id: conv.id,
          contactName: conv.contacts?.name || 'Cliente',
          contactAvatar: conv.contacts?.avatar_url || null,
          channel: conv.channel || 'web',
          lastMessage: '',
        }));

        setConversations(mapped);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [open]);

  // Filtrar conversas
  const filteredConversations = conversations.filter((conv) =>
    conv.contactName.toLowerCase().includes(search.toLowerCase())
  );

  // Encaminhar mensagem - AGORA COM ENVIO REAL PARA WHATSAPP
  const handleForward = async (targetConversation: Conversation) => {
    if (!message || !profile) return;

    setSendingTo(targetConversation.id);
    try {
      // Resolver attachment de message.attachment OU message.metadata.attachment
      const attachment = message.attachment || (message as any).metadata?.attachment;
      const hasAttachment = !!(attachment && attachment.url && attachment.type);

      // Para anexos: enviar APENAS o conteúdo original como caption (sem prefixo "↪️")
      // Para texto puro: prefixar com indicador de encaminhamento
      const forwardContent = hasAttachment
        ? (message.content?.trim() || undefined)
        : `↪️ Encaminhada:\n${message.content}`;

      const metadata: Record<string, unknown> = {
        forwarded: true,
        originalMessageId: message.id,
        originalTimestamp: message.timestamp,
      };

      if (hasAttachment) {
        metadata.attachment = attachment;
      }

      // Validar attachment se presente
      if (attachment && (!attachment.url || !attachment.type)) {
        console.error('[Forward] Attachment inválido:', attachment);
        toast.error('Anexo inválido: URL ou tipo ausente. Não é possível encaminhar.');
        setSendingTo(null);
        return;
      }

      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: targetConversation.id,
          sender_type: 'agent',
          sender_id: profile.id,
          content: forwardContent || (hasAttachment ? '' : '[Encaminhado]'),
          metadata: metadata as any,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Se a conversa destino for WhatsApp, enviar mensagem real
      if (targetConversation.channel === 'whatsapp' && insertedMessage) {
        const payload: Record<string, unknown> = {
          conversation_id: targetConversation.id,
          message_id: insertedMessage.id,
          agent_name: profile.name || 'Atendente',
        };

        if (hasAttachment) {
          payload.attachment = attachment;
          // Para mídia: caption opcional (apenas se houver texto original)
          if (message.content?.trim()) {
            payload.message_content = message.content.trim();
          }
        } else {
          payload.message_content = forwardContent;
        }

        console.log('[Forward] Enviando para WhatsApp:', {
          conversationId: targetConversation.id,
          hasAttachment,
          attachmentType: attachment?.type,
        });

        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          'send-whatsapp-message',
          { body: payload }
        );

        if (sendError || !sendResult?.success) {
          console.error('[Forward] Erro ao enviar via WhatsApp:', sendError || sendResult?.error);
          
          await supabase
            .from('messages')
            .update({
              metadata: {
                ...metadata,
                whatsappStatus: 'failed',
                whatsappError: sendResult?.error || sendError?.message || 'Erro desconhecido',
              },
            })
            .eq('id', insertedMessage.id);

          toast.warning('Encaminhamento parcial: falha no envio para WhatsApp.', {
            description: sendResult?.error || 'Veja o console para detalhes.',
          });
        } else {
          console.log('[Forward] Mensagem enviada com sucesso via WhatsApp:', sendResult);
          toast.success('Mensagem encaminhada via WhatsApp!');
        }
      } else {
        toast.success('Mensagem encaminhada!');
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao encaminhar mensagem:', error);
      toast.error('Erro ao encaminhar mensagem');
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encaminhar mensagem</DialogTitle>
          <DialogDescription>
            Selecione uma conversa para encaminhar a mensagem.
          </DialogDescription>
        </DialogHeader>

        {/* Preview da mensagem */}
        {message && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="text-muted-foreground text-xs mb-1">Mensagem a encaminhar:</p>
            <p className="line-clamp-3">{message.content}</p>
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista de conversas */}
        <ScrollArea className="h-[300px] pr-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleForward(conv)}
                  disabled={sendingTo !== null}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={conv.contactAvatar || undefined} />
                    <AvatarFallback>
                      {conv.contactName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{conv.contactName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{conv.channel}</p>
                  </div>
                  {sendingTo === conv.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Send className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
