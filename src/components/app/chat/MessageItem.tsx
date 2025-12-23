import { memo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Message, MessageDeliveryStatus } from "./types";
import { format, isThisYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Download, Play, Pause, Volume2, Check, CheckCheck, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type MessageItemProps = {
  message: Message;
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

export const MessageItem = memo(({ message }: MessageItemProps) => {
  if (!message || !message.timestamp) {
    return null;
  }
  
  const formattedTimestamp = formatMessageTimestamp(message.timestamp);
  const { attachment, deliveryStatus } = message;
  const isAgentMessage = message.sender === 'agent';
  const isTempMessage = message.id.startsWith('temp-');
  
  // Determinar status efetivo
  const effectiveStatus: MessageDeliveryStatus | undefined = isTempMessage 
    ? 'sending' 
    : deliveryStatus;
  
  return (
    <div
      className={cn(
        "flex",
        isAgentMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] p-3 rounded-lg relative",
          isAgentMessage
            ? "bg-viainfra-primary text-white rounded-tr-none"
            : "bg-card border border-border rounded-tl-none",
          effectiveStatus === 'failed' && isAgentMessage && "ring-2 ring-destructive/50"
        )}
      >
        {/* Texto da mensagem */}
        {message.content && !message.content.startsWith('[') && (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
        
        {/* Anexo */}
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
        
        {/* Placeholder para mídia sem URL */}
        {!attachment && message.content.startsWith('[') && (
          <div className="text-sm opacity-70 italic">{message.content}</div>
        )}
        
        {/* Timestamp e status de entrega */}
        <div className={cn(
          "text-xs mt-1 flex items-center justify-end gap-0.5",
          isAgentMessage ? "text-white/70" : "text-muted-foreground"
        )}>
          <span>{formattedTimestamp}</span>
          <DeliveryStatusIcon status={effectiveStatus} isAgentMessage={isAgentMessage} />
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";
