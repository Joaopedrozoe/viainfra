
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { Message } from "./types";
import { format, isThisYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Download, Play, Pause, Volume2 } from "lucide-react";

type MessageItemProps = {
  message: Message;
};

const formatMessageTimestamp = (dateString: string) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Check if date is valid
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

const ImageAttachment = ({ url, alt }: { url: string; alt?: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      {isLoading && !error && (
        <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg" />
      )}
      {error ? (
        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          Erro ao carregar imagem
        </div>
      ) : (
        <img
          src={url}
          alt={alt || "Imagem"}
          className={cn(
            "max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity",
            isLoading && "hidden"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          onClick={() => window.open(url, '_blank')}
        />
      )}
    </div>
  );
};

const VideoAttachment = ({ url }: { url: string }) => {
  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      <video
        src={url}
        controls
        className="max-w-full max-h-64 rounded-lg"
        preload="metadata"
      />
    </div>
  );
};

const AudioAttachment = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-black/5 rounded-lg">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-2 rounded-full bg-white/50 hover:bg-white/80 transition-colors"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <Volume2 size={16} className="text-gray-500" />
      <audio
        src={url}
        className="flex-1"
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
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
  // Guard against invalid message
  if (!message || !message.timestamp) {
    return null;
  }
  
  const formattedTimestamp = formatMessageTimestamp(message.timestamp);
  const { attachment } = message;
  
  return (
    <div
      className={cn(
        "flex",
        message.sender === "agent" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] p-3 rounded-lg",
          message.sender === "agent"
            ? "bg-viainfra-primary text-white rounded-tr-none"
            : "bg-white border border-gray-200 rounded-tl-none"
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
              <VideoAttachment url={attachment.url} />
            )}
            {attachment.type === 'audio' && (
              <AudioAttachment url={attachment.url} />
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
        
        <div className={cn(
          "text-xs mt-1 text-right",
          message.sender === "agent" ? "text-white/70" : "text-gray-500"
        )}>
          {formattedTimestamp}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";
