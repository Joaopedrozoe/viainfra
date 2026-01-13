import { memo } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Copy,
  Pencil,
  Pin,
  PinOff,
  Star,
  StarOff,
  Forward,
  Trash2,
} from "lucide-react";
import { Message } from "./types";

export interface MessageActionsProps {
  message: Message;
  children: React.ReactNode;
  onCopy: (content: string) => void;
  onEdit: (message: Message) => void;
  onPin: (message: Message) => void;
  onFavorite: (message: Message) => void;
  onForward: (message: Message) => void;
  onDelete: (message: Message) => void;
}

export const MessageActions = memo(({
  message,
  children,
  onCopy,
  onEdit,
  onPin,
  onFavorite,
  onForward,
  onDelete,
}: MessageActionsProps) => {
  const isAgentMessage = message.sender === 'agent';
  const isPinned = message.isPinned;
  const isFavorite = message.isFavorite;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {/* Copiar - disponível para todas as mensagens com conteúdo */}
        {message.content && (
          <ContextMenuItem onClick={() => onCopy(message.content)}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar texto
          </ContextMenuItem>
        )}

        {/* Editar - apenas para mensagens do agente */}
        {isAgentMessage && (
          <ContextMenuItem onClick={() => onEdit(message)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Fixar/Desafixar */}
        <ContextMenuItem onClick={() => onPin(message)}>
          {isPinned ? (
            <>
              <PinOff className="w-4 h-4 mr-2" />
              Desafixar
            </>
          ) : (
            <>
              <Pin className="w-4 h-4 mr-2" />
              Fixar
            </>
          )}
        </ContextMenuItem>

        {/* Favoritar/Desfavoritar */}
        <ContextMenuItem onClick={() => onFavorite(message)}>
          {isFavorite ? (
            <>
              <StarOff className="w-4 h-4 mr-2" />
              Remover favorito
            </>
          ) : (
            <>
              <Star className="w-4 h-4 mr-2" />
              Favoritar
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Encaminhar */}
        <ContextMenuItem onClick={() => onForward(message)}>
          <Forward className="w-4 h-4 mr-2" />
          Encaminhar
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Apagar */}
        <ContextMenuItem 
          onClick={() => onDelete(message)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Apagar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

MessageActions.displayName = "MessageActions";
