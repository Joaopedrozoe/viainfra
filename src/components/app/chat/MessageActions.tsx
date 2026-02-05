import { memo } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Pencil,
  Pin,
  PinOff,
  Star,
  StarOff,
  Forward,
  Trash2,
  Reply,
  Info,
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
  onReply?: (message: Message) => void;
}

// Helper component for menu items with tooltips
const MenuItemWithTooltip = ({
  icon: Icon,
  label,
  tooltip,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tooltip?: string;
  onClick: () => void;
  className?: string;
}) => {
  if (!tooltip) {
    return (
      <ContextMenuItem onClick={onClick} className={className}>
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </ContextMenuItem>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <ContextMenuItem onClick={onClick} className={className}>
            <Icon className="w-4 h-4 mr-2" />
            {label}
            <Info className="w-3 h-3 ml-auto text-muted-foreground" />
          </ContextMenuItem>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px]">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const MessageActions = memo(({
  message,
  children,
  onCopy,
  onEdit,
  onPin,
  onFavorite,
  onForward,
  onDelete,
  onReply,
}: MessageActionsProps) => {
  const isAgentMessage = message.sender === 'agent';
  const isPinned = message.isPinned;
  const isFavorite = message.isFavorite;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {/* Responder - disponível para todas as mensagens */}
        {onReply && (
          <ContextMenuItem onClick={() => onReply(message)}>
            <Reply className="w-4 h-4 mr-2" />
            Responder
          </ContextMenuItem>
        )}

        {/* Copiar - disponível para todas as mensagens com conteúdo */}
        {message.content && (
          <ContextMenuItem onClick={() => onCopy(message.content)}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar texto
          </ContextMenuItem>
        )}

        {/* Editar - apenas para mensagens do agente com tooltip de limitação */}
        {isAgentMessage && (
          <MenuItemWithTooltip
            icon={Pencil}
            label="Editar"
            tooltip="Edição no WhatsApp funciona apenas em mensagens enviadas há menos de 15 minutos"
            onClick={() => onEdit(message)}
          />
        )}

        <ContextMenuSeparator />

        {/* Fixar/Desafixar - com indicador de local */}
        <MenuItemWithTooltip
          icon={isPinned ? PinOff : Pin}
          label={isPinned ? "Desafixar" : "Fixar"}
          tooltip="Organização interna do CRM - não afeta o WhatsApp"
          onClick={() => onPin(message)}
        />

        {/* Favoritar/Desfavoritar - com indicador de local */}
        <MenuItemWithTooltip
          icon={isFavorite ? StarOff : Star}
          label={isFavorite ? "Remover favorito" : "Favoritar"}
          tooltip="Organização interna do CRM - não afeta o WhatsApp"
          onClick={() => onFavorite(message)}
        />

        <ContextMenuSeparator />

        {/* Encaminhar - envia mensagem real */}
        <ContextMenuItem onClick={() => onForward(message)}>
          <Forward className="w-4 h-4 mr-2" />
          Encaminhar
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Apagar - tooltip dinâmico baseado no tipo de mensagem */}
        <MenuItemWithTooltip
          icon={Trash2}
          label="Apagar"
          tooltip={isAgentMessage 
            ? "Tenta apagar para todos no WhatsApp (limite: ~1h após envio)" 
            : "Mensagens recebidas só podem ser removidas do CRM"}
          onClick={() => onDelete(message)}
          className="text-destructive focus:text-destructive"
        />
      </ContextMenuContent>
    </ContextMenu>
  );
});

MessageActions.displayName = "MessageActions";
