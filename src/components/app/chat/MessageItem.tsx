import { memo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Message, MessageDeliveryStatus } from "./types";
import { format, isThisYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Download, Play, Pause, Volume2, Check, CheckCheck, Clock, AlertCircle, Loader2, Pin, Star, Reply, Image, Video, Mic, File } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageActions } from "./MessageActions";

export type MessageItemProps = {
  message: Message;
  onCopy?: (content: string) => void;
  onEdit?: (message: Message) => void;
  onPin?: (message: Message) => void;
  onFavorite?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReply?: (message: Message) => void;
};

const formatMessageTimestamp = (dateString: string) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    if (isThisYear(date)) {
      return format(date, "dd/MM, HH:mm", { locale: ptBR });
    }
    
    return format(date, "dd/MM/yyyy, HH:mm", { locale: ptBR });
  } catch {
    return '';
  }
};

// Padrões de placeholder de mídia
const MEDIA_PLACEHOLDERS = ['[Imagem]', '[Áudio]', '[Áudio de voz]', '[Vídeo]', '[Documento', '[Sticker]', '[Mídia]'];

// Verifica se o conteúdo é apenas um placeholder de mídia (com ou sem nome de participante de grupo)
const isMediaPlaceholder = (content: string): boolean => {
  if (!content) return false;
  // Mensagem direta: "[Imagem]" ou "[Áudio de voz]"
  if (MEDIA_PLACEHOLDERS.some(p => content.startsWith(p))) return true;
  // Mensagem de grupo: "*NomeParticipante*:\n[Imagem]"
  const groupMatch = content.match(/^\*[^*]+\*:\n(\[.+\])$/);
  if (groupMatch && MEDIA_PLACEHOLDERS.some(p => groupMatch[1].startsWith(p))) return true;
  return false;
};

// Extrai apenas o placeholder de mídia do conteúdo
const extractMediaPlaceholder = (content: string): string => {
  if (!content) return '[Mídia não disponível]';
  // Mensagem direta
  if (content.startsWith('[')) return content;
  // Mensagem de grupo
  const groupMatch = content.match(/^\*([^*]+)\*:\n(\[.+\])$/);
  if (groupMatch) return `${groupMatch[1]}: ${groupMatch[2]}`;
  return content;
};

// Formata conteúdo da mensagem, removendo placeholder de mídia se attachment existe
const formatMessageContent = (content: string, hasAttachment: boolean): string => {
  if (!hasAttachment) return content;
  // Se tem attachment, remover o placeholder de mídia
  // Mensagem de grupo: manter só o nome do participante
  const groupMatch = content.match(/^\*([^*]+)\*:\n(\[.+\])$/);
  if (groupMatch) {
    return `*${groupMatch[1]}*:`;
  }
  // Mensagem direta com caption: pode ter texto + placeholder
  const directMatch = content.match(/^(\[.+\])$/);
  if (directMatch) return ''; // Só placeholder, remover
  return content;
};

const DeliveryStatusIcon = ({ status, isAgentMessage }: { status?: MessageDeliveryStatus; isAgentMessage: boolean }) => {
  if (!isAgentMessage) return null;
  
  const iconClass = "w-3.5 h-3.5 inline-block ml-1";
  
  switch (status) {
    case 'sending':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Loader2 className={cn(iconClass, "animate-spin text-white/60")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Enviando...
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case 'sent':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Check className={cn(iconClass, "text-white/80")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Enviado via WhatsApp
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case 'delivered':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCheck className={cn(iconClass, "text-white")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Entregue
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case 'failed':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className={cn(iconClass, "text-red-300")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs bg-destructive text-destructive-foreground">
              Falha no envio - será reenviada automaticamente
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      // Mensagem sem status (ainda não confirmada via WhatsApp)
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className={cn(iconClass, "text-white/50")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Aguardando confirmação
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
  }
};

const ImageAttachment = ({ url, alt }: { url: string; alt?: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = () => {
    if (retryCount < 2) {
      // Retry with cache-busting parameter
      setRetryCount(prev => prev + 1);
    } else {
      setIsLoading(false);
      setError(true);
    }
  };

  // Add cache-busting on retry
  const imageUrl = retryCount > 0 ? `${url}?retry=${retryCount}` : url;

  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      {isLoading && !error && (
        <div className="w-full h-48 bg-muted animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Carregando imagem...</span>
        </div>
      )}
      {error ? (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full h-32 bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground text-sm hover:bg-muted/80 transition-colors cursor-pointer"
        >
          <FileText size={24} className="mb-2" />
          <span>Clique para abrir imagem</span>
        </a>
      ) : (
        <img
          src={imageUrl}
          alt={alt || "Imagem"}
          className={cn(
            "max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
            isLoading && "hidden"
          )}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
          onClick={() => window.open(url, '_blank')}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

const VideoAttachment = ({ url, mimeType }: { url: string; mimeType?: string }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
      >
        <Play size={20} className="text-muted-foreground" />
        <span className="flex-1 text-sm">Clique para abrir vídeo</span>
        <Download size={18} className="text-muted-foreground" />
      </a>
    );
  }

  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      <video
        src={url}
        controls
        className="max-w-full max-h-64 rounded-lg bg-black"
        preload="metadata"
        onError={() => setError(true)}
      >
        <source src={url} type={mimeType || 'video/mp4'} />
        Seu navegador não suporta vídeo.
      </video>
    </div>
  );
};

const AudioAttachment = ({ url, mimeType }: { url: string; mimeType?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle audio play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => setError(true));
      }
    }
  };

  if (error) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
      >
        <Volume2 size={20} className="text-muted-foreground" />
        <span className="flex-1 text-sm">Clique para baixar áudio</span>
        <Download size={18} className="text-muted-foreground" />
      </a>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-background hover:bg-background/80 transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <Volume2 size={16} className="text-muted-foreground" />
      <audio
        ref={audioRef}
        src={url}
        className="flex-1 h-8"
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(true)}
        preload="metadata"
      >
        {/* Fallback source with explicit mime type for better compatibility */}
        <source src={url} type={mimeType || 'audio/ogg'} />
        Seu navegador não suporta áudio.
      </audio>
    </div>
  );
};

const DocumentAttachment = ({ url, filename }: { url: string; filename?: string }) => {
  const displayName = filename || 'Documento';
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 p-3 bg-black/5 rounded-lg hover:bg-black/10 transition-colors"
    >
      <FileText size={24} className="text-gray-500" />
      <span className="flex-1 text-sm truncate">{displayName}</span>
      <Download size={18} className="text-gray-400" />
    </a>
  );
};

// Componente para exibir mensagem citada (reply/quote)
const QuotedMessage = ({ 
  content, 
  sender, 
  attachmentType,
  isAgentMessage
}: {
  content?: string;
  sender?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'document';
  isAgentMessage: boolean;
}) => {
  // Ícone baseado no tipo de anexo
  const AttachmentIcon = () => {
    switch (attachmentType) {
      case 'image':
        return <Image size={14} className="flex-shrink-0" />;
      case 'video':
        return <Video size={14} className="flex-shrink-0" />;
      case 'audio':
        return <Mic size={14} className="flex-shrink-0" />;
      case 'document':
        return <File size={14} className="flex-shrink-0" />;
      default:
        return null;
    }
  };

  // Texto do tipo de anexo
  const attachmentLabel = {
    image: 'Imagem',
    video: 'Vídeo',
    audio: 'Áudio',
    document: 'Documento'
  }[attachmentType || ''] || '';

  return (
    <div 
      className={cn(
        "border-l-4 p-2 rounded mb-2 cursor-pointer transition-colors",
        isAgentMessage 
          ? "border-green-300 bg-white/10 hover:bg-white/20" 
          : "border-green-500 bg-muted/50 hover:bg-muted/70"
      )}
    >
      {/* Remetente da mensagem original */}
      {sender && (
        <div className="flex items-center gap-1 mb-0.5">
          <Reply size={12} className={cn(
            "flex-shrink-0",
            isAgentMessage ? "text-green-300" : "text-green-600"
          )} />
          <span className={cn(
            "text-xs font-medium truncate",
            isAgentMessage ? "text-green-300" : "text-green-600"
          )}>
            {sender}
          </span>
        </div>
      )}
      
      {/* Conteúdo da mensagem citada */}
      <div className={cn(
        "text-sm line-clamp-2 flex items-center gap-1",
        isAgentMessage ? "text-white/70" : "text-muted-foreground"
      )}>
        <AttachmentIcon />
        {attachmentType && !content && (
          <span className="italic">{attachmentLabel}</span>
        )}
        {content && <span>{content}</span>}
        {!content && !attachmentType && (
          <span className="italic">Mensagem</span>
        )}
      </div>
    </div>
  );
};

export const MessageItem = memo(({ 
  message,
  onCopy,
  onEdit,
  onPin,
  onFavorite,
  onForward,
  onDelete,
  onReply,
}: MessageItemProps) => {
  if (!message || !message.timestamp) {
    return null;
  }
  
  const formattedTimestamp = formatMessageTimestamp(message.timestamp);
  const { attachment, deliveryStatus } = message;
  const isAgentMessage = message.sender === 'agent';
  const isTempMessage = message.id.startsWith('temp-');
  const isPinned = message.isPinned;
  const isFavorite = message.isFavorite;
  const isEdited = !!message.editedAt;
  
  // Determinar status efetivo
  const effectiveStatus: MessageDeliveryStatus | undefined = isTempMessage 
    ? 'sending' 
    : deliveryStatus;

  // Se não houver handlers, renderizar sem ContextMenu
  const hasActions = onCopy || onEdit || onPin || onFavorite || onForward || onDelete || onReply;

  const messageBubble = (
    <div
      className={cn(
        "max-w-[70%] p-3 rounded-lg relative group",
        isAgentMessage
          ? "bg-viainfra-primary text-white rounded-tr-none"
          : "bg-card border border-border rounded-tl-none",
        effectiveStatus === 'failed' && isAgentMessage && "ring-2 ring-destructive/50"
      )}
    >
      {/* Indicadores de fixada/favorita - ícones discretos no canto */}
      {(isPinned || isFavorite) && (
        <div className="absolute -top-1.5 -right-1.5 flex gap-0.5">
          {isPinned && (
            <div className="bg-amber-500 text-white p-0.5 rounded-full shadow-sm" title="Mensagem fixada">
              <Pin className="w-2.5 h-2.5" />
            </div>
          )}
          {isFavorite && (
            <div className="bg-yellow-500 text-white p-0.5 rounded-full shadow-sm" title="Mensagem favorita">
              <Star className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      )}

      {/* Mensagem citada (reply/quote) */}
      {message.quotedContent || message.quotedMessageId ? (
        <QuotedMessage
          content={message.quotedContent}
          sender={message.quotedSender}
          attachmentType={message.quotedAttachmentType}
          isAgentMessage={isAgentMessage}
        />
      ) : null}

      {/* Texto da mensagem - exibir se não for apenas placeholder de mídia */}
      {message.content && !isMediaPlaceholder(message.content) && (
        <div className="whitespace-pre-wrap">{formatMessageContent(message.content, !!attachment)}</div>
      )}
      
      {/* Anexo com mídia real */}
      {attachment && (
        <>
          {attachment.type === 'image' && (
            <ImageAttachment url={attachment.url} alt={attachment.filename} />
          )}
          {attachment.type === 'video' && (
            <VideoAttachment url={attachment.url} mimeType={attachment.mimeType} />
          )}
          {attachment.type === 'audio' && (
            <AudioAttachment url={attachment.url} mimeType={attachment.mimeType} />
          )}
          {attachment.type === 'document' && (
            <DocumentAttachment url={attachment.url} filename={attachment.filename} />
          )}
        </>
      )}
      
      {/* Mídia marcada como indisponível pelo script de reparo */}
      {message.mediaUnavailable && !attachment && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400">
          <AlertCircle size={18} />
          <div className="flex-1">
            <span className="text-sm font-medium">Mídia expirada</span>
            <p className="text-xs opacity-70">
              {message.mediaType === 'image' && 'Imagem não disponível'}
              {message.mediaType === 'audio' && 'Áudio não disponível'}
              {message.mediaType === 'video' && 'Vídeo não disponível'}
              {message.mediaType === 'document' && 'Documento não disponível'}
              {!message.mediaType && 'Mídia não disponível'}
            </p>
          </div>
        </div>
      )}
      
      {/* Placeholder para mídia sem URL - mensagens antigas sem attachment e não processadas */}
      {!attachment && !message.mediaUnavailable && isMediaPlaceholder(message.content) && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-muted-foreground">
          <FileText size={20} />
          <span className="text-sm italic">{extractMediaPlaceholder(message.content)}</span>
        </div>
      )}
      
      {/* Timestamp e status de entrega */}
      <div className={cn(
        "text-xs mt-1 flex items-center justify-end gap-1",
        isAgentMessage ? "text-white/70" : "text-muted-foreground"
      )}>
        {isEdited && <span className="italic">(editado)</span>}
        <span>{formattedTimestamp}</span>
        <DeliveryStatusIcon status={effectiveStatus} isAgentMessage={isAgentMessage} />
      </div>
    </div>
  );
  
  return (
    <div
      className={cn(
        "flex",
        isAgentMessage ? "justify-end" : "justify-start"
      )}
    >
      {hasActions ? (
        <MessageActions
          message={message}
          onCopy={onCopy || (() => {})}
          onEdit={onEdit || (() => {})}
          onPin={onPin || (() => {})}
          onFavorite={onFavorite || (() => {})}
          onForward={onForward || (() => {})}
          onDelete={onDelete || (() => {})}
          onReply={onReply}
        >
          {messageBubble}
        </MessageActions>
      ) : (
        messageBubble
      )}
    </div>
  );
});

MessageItem.displayName = "MessageItem";
