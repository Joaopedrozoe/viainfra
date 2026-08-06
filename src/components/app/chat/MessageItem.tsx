import { memo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Message, MessageDeliveryStatus, AttachmentType, MessageReaction } from "./types";
import { ReactionChips, ReactionPicker } from "./MessageReactions";
import { format, isThisYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Download, Play, Pause, Volume2, Check, CheckCheck, Clock, AlertCircle, Loader2, Pin, Star, Reply, Image, Video, Mic, File, MapPin, ExternalLink, User } from "lucide-react";

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
  reactions?: MessageReaction[];
  onReact?: (message: Message, emoji: string) => void;
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
const MEDIA_PLACEHOLDERS = ['[Imagem]', '[Áudio]', '[Áudio de voz]', '[Vídeo]', '[Documento', '[Sticker]', '[Mídia]', '[Localização]', '[Contato', '📍'];

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
    case 'pending':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Clock className={cn(iconClass, "text-white/60")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Aguardando confirmação do WhatsApp
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case 'sent':
    case 'sent_confirmed':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Check className={cn(iconClass, "text-white/80")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {status === 'sent_confirmed' ? 'Confirmado pelo servidor WhatsApp' : 'Enviado via WhatsApp'}
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
              Entregue no dispositivo
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    case 'read':
    case 'played':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCheck className={cn(iconClass, "text-blue-300")} />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {status === 'played' ? 'Reproduzido' : 'Lido'}
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

/**
 * Carrega mídia com fallback por blob quando a URL pública é bloqueada
 * (extensão de navegador, antivírus, proxy corporativo).
 */
const useResilientMedia = (url: string) => {
  const [src, setSrc] = useState(url);
  const [failed, setFailed] = useState(false);
  const recoveringRef = useRef(false);

  useEffect(() => {
    setSrc(url);
    setFailed(false);
    recoveringRef.current = false;
  }, [url]);

  const handleError = useCallback(async () => {
    if (recoveringRef.current) {
      setFailed(true);
      return;
    }
    recoveringRef.current = true;
    const blobUrl = await fetchAttachmentBlobUrl(url);
    if (blobUrl && blobUrl !== url) setSrc(blobUrl);
    else setFailed(true);
  }, [url]);

  return { src, failed, handleError };
};

const BlockedAttachment = ({
  url,
  label,
  icon,
  filename,
}: {
  url: string;
  label: string;
  icon: React.ReactNode;
  filename?: string;
}) => (
  <div className="mt-2 rounded-lg border border-border/50 bg-muted/50 p-3 space-y-2">
    <div className="flex items-center gap-2 text-sm">
      {icon}
      <span className="flex-1 truncate">{label}</span>
    </div>
    <p className="text-xs text-muted-foreground">{ATTACHMENT_BLOCKED_MESSAGE}</p>
    <div className="flex gap-3 text-xs">
      <button
        type="button"
        onClick={() => void openAttachment(url, filename)}
        className="text-primary hover:underline"
      >
        Tentar novamente
      </button>
      <button
        type="button"
        onClick={() => void copyAttachmentLink(url)}
        className="text-muted-foreground hover:underline"
      >
        Copiar link
      </button>
    </div>
  </div>
);

const ImageAttachment = ({ url, alt }: { url: string; alt?: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { src, failed, handleError } = useResilientMedia(url);

  if (failed) {
    return <BlockedAttachment url={url} label={alt || "Imagem"} icon={<Image size={18} />} />;
  }

  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="w-full h-48 bg-muted animate-pulse rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Carregando imagem...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt || "Imagem"}
        loading="lazy"
        className={cn(
          "max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
          isLoading && "hidden"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          void handleError();
        }}
        onClick={() => void openAttachment(url)}
      />
    </div>
  );
};

const VideoAttachment = ({ url, mimeType }: { url: string; mimeType?: string }) => {
  const { src, failed, handleError } = useResilientMedia(url);

  if (failed) {
    return <BlockedAttachment url={url} label="Vídeo" icon={<Video size={18} />} />;
  }

  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      <video
        src={src}
        controls
        className="max-w-full max-h-64 rounded-lg bg-black"
        preload="metadata"
        onError={() => void handleError()}
      >
        <source src={src} type={mimeType || 'video/mp4'} />
        Seu navegador não suporta vídeo.
      </video>
    </div>
  );
};

const AudioAttachment = ({ url, mimeType }: { url: string; mimeType?: string }) => {
  const { src, failed, handleError } = useResilientMedia(url);

  if (failed) {
    return <BlockedAttachment url={url} label="Áudio" icon={<Volume2 size={18} />} />;
  }

  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <Volume2 size={16} className="text-muted-foreground flex-shrink-0" />
      <audio
        src={src}
        className="flex-1 h-8 min-w-0"
        controls
        onError={() => void handleError()}
        preload="metadata"
      >
        <source src={src} type={mimeType || 'audio/ogg'} />
        Seu navegador não suporta áudio.
      </audio>
    </div>
  );
};

const DocumentAttachment = ({ url, filename }: { url: string; filename?: string }) => {
  const displayName = filename || 'Documento';

  return (
    <button
      type="button"
      onClick={() => void openAttachment(url, displayName)}
      className="mt-2 w-full flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left"
    >
      <FileText size={24} className="text-muted-foreground flex-shrink-0" />
      <span className="flex-1 text-sm truncate">{displayName}</span>
      <Download size={18} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
};

// Componente para exibir localização
const LocationAttachment = ({ 
  url, 
  latitude, 
  longitude, 
  name, 
  address 
}: { 
  url: string; 
  latitude?: number; 
  longitude?: number; 
  name?: string; 
  address?: string;
}) => {
  const lat = latitude || 0;
  const lng = longitude || 0;
  
  // Gerar URL do mapa estático para preview
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=300x150&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
  
  // URL do Google Maps para abrir
  const mapsUrl = url || `https://www.google.com/maps?q=${lat},${lng}`;
  
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer border border-border/50"
    >
      {/* Preview do mapa usando OpenStreetMap (alternativa sem API key) */}
      <div className="relative">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}
          width="280"
          height="150"
          style={{ border: 0, pointerEvents: 'none' }}
          loading="lazy"
          title="Localização"
          className="w-full"
        />
        <div className="absolute inset-0 bg-transparent" />
      </div>
      
      {/* Info da localização */}
      <div className="p-3 bg-muted/50 flex items-center gap-2">
        <MapPin size={20} className="text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {name && (
            <div className="font-medium text-sm truncate">{name}</div>
          )}
          {address && (
            <div className="text-xs text-muted-foreground truncate">{address}</div>
          )}
          {!name && !address && (
            <div className="text-sm">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
          )}
        </div>
        <ExternalLink size={16} className="text-muted-foreground flex-shrink-0" />
      </div>
    </a>
  );
};

// Componente para exibir sticker (sem bolha, como no WhatsApp)
const StickerAttachment = ({ url }: { url: string }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="mt-2 text-xs text-muted-foreground italic">Sticker não disponível</div>
    );
  }

  return (
    <img
      src={url}
      alt="Sticker"
      loading="lazy"
      onError={() => setError(true)}
      className="mt-2 w-32 h-32 object-contain"
    />
  );
};

// Componente para exibir contato compartilhado (vCard)
const ContactAttachment = ({
  name,
  phones,
  vcard,
}: {
  name?: string;
  phones?: string[];
  vcard?: string;
}) => {
  const displayPhones = phones && phones.length > 0 ? phones : [];
  const vcardHref = vcard
    ? `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`
    : undefined;

  return (
    <div className="mt-2 rounded-lg border border-border/50 bg-muted/50 p-3">
      <div className="flex items-center gap-2">
        <User size={20} className="text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{name || 'Contato'}</div>
          {displayPhones.map((p) => (
            <a
              key={p}
              href={`tel:${p.replace(/[^\d+]/g, '')}`}
              className="block text-xs text-muted-foreground hover:underline truncate"
            >
              {p}
            </a>
          ))}
        </div>
      </div>
      {vcardHref && (
        <a
          href={vcardHref}
          download={`${(name || 'contato').replace(/[^\w\-]+/g, '_')}.vcf`}
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Download size={14} /> Salvar contato
        </a>
      )}
    </div>
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
  attachmentType?: AttachmentType;
  isAgentMessage: boolean;
}) => {
  // Ícone baseado no tipo de anexo
  const AttachmentIcon = () => {
    switch (attachmentType) {
      case 'image':
        return <Image size={14} className="flex-shrink-0" />;
      case 'sticker':
        return <Image size={14} className="flex-shrink-0" />;
      case 'video':
        return <Video size={14} className="flex-shrink-0" />;
      case 'audio':
        return <Mic size={14} className="flex-shrink-0" />;
      case 'document':
        return <File size={14} className="flex-shrink-0" />;
      case 'location':
        return <MapPin size={14} className="flex-shrink-0" />;
      case 'contact':
        return <User size={14} className="flex-shrink-0" />;
      default:
        return null;
    }
  };

  // Texto do tipo de anexo
  const attachmentLabel = {
    image: 'Imagem',
    video: 'Vídeo',
    audio: 'Áudio',
    document: 'Documento',
    location: 'Localização',
    sticker: 'Sticker',
    contact: 'Contato'
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
  reactions,
  onReact,
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
  // Se persistida (não temp) e sem status explícito mas com whatsappMessageId → considerar enviada
  const effectiveStatus: MessageDeliveryStatus | undefined = isTempMessage 
    ? 'sending' 
    : (deliveryStatus ?? (message.whatsappMessageId ? 'sent' : undefined));

  // Se não houver handlers, renderizar sem ContextMenu
  const hasActions = onCopy || onEdit || onPin || onFavorite || onForward || onDelete || onReply;

  const messageBubble = (
    <div
      className={cn(
        "max-w-[70%] px-4 py-3 rounded-2xl relative group shadow-sm",
        isAgentMessage
          ? "bg-primary text-primary-foreground rounded-tr-md"
          : "bg-muted/60 rounded-tl-md",
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
        <div className="whitespace-pre-wrap emoji-text">{formatMessageContent(message.content, !!attachment)}</div>
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
          {attachment.type === 'location' && (
            <LocationAttachment 
              url={attachment.url} 
              latitude={attachment.latitude}
              longitude={attachment.longitude}
              name={attachment.locationName}
              address={attachment.locationAddress}
            />
          )}
          {attachment.type === 'sticker' && (
            <StickerAttachment url={attachment.url} />
          )}
          {attachment.type === 'contact' && (
            <ContactAttachment
              name={attachment.contactName || attachment.filename}
              phones={attachment.contactPhones}
              vcard={attachment.vcard}
            />
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
              {message.mediaType === 'sticker' && 'Sticker não disponível'}
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
        "text-[10px] mt-1.5 flex items-center justify-end gap-1",
        isAgentMessage ? "text-primary-foreground/70" : "text-muted-foreground"
      )}>
        {isEdited && <span className="italic">(editado)</span>}
        <span>{formattedTimestamp}</span>
        <DeliveryStatusIcon status={effectiveStatus} isAgentMessage={isAgentMessage} />
      </div>

      {/* Reações (emoji) */}
      {!!reactions?.length && (
        <ReactionChips
          reactions={reactions}
          isAgentMessage={isAgentMessage}
          onToggle={onReact ? (emoji) => onReact(message, emoji) : undefined}
        />
      )}

      {onReact && !isTempMessage && (
        <ReactionPicker
          isAgentMessage={isAgentMessage}
          onSelect={(emoji) => onReact(message, emoji)}
        />
      )}
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
          onReact={onReact}
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
