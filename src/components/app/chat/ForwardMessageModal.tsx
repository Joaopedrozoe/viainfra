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
import { Search, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  id: string;
  contactName: string;
  contactAvatar: string | null;
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
  const [isSending, setIsSending] = useState(false);
  const { profile } = useAuth();

  // Carregar conversas
  useEffect(() => {
    if (!open) return;

    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            contacts (
              name,
              avatar_url
            )
          `)
          .eq('status', 'open')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const mapped: Conversation[] = (data || []).map((conv: any) => ({
          id: conv.id,
          contactName: conv.contacts?.name || 'Cliente',
          contactAvatar: conv.contacts?.avatar_url || null,
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

  // Encaminhar mensagem
  const handleForward = async (targetConversationId: string) => {
    if (!message || !profile) return;

    setIsSending(true);
    try {
      // Criar mensagem encaminhada
      const forwardContent = `↪️ Encaminhada:\n${message.content}`;
      
      const { error } = await supabase.from('messages').insert({
        conversation_id: targetConversationId,
        sender_type: 'agent',
        sender_id: profile.id,
        content: forwardContent,
        metadata: {
          forwarded: true,
          originalMessageId: message.id,
          originalTimestamp: message.timestamp,
        },
      });

      if (error) throw error;

      toast.success('Mensagem encaminhada!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao encaminhar mensagem:', error);
      toast.error('Erro ao encaminhar mensagem');
    } finally {
      setIsSending(false);
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
                  onClick={() => handleForward(conv.id)}
                  disabled={isSending}
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
                  </div>
                  <Send className="w-4 h-4 text-muted-foreground" />
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
