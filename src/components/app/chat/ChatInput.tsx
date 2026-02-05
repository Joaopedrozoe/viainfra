import { useState, useCallback, memo, useMemo, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, FileUp, X, Image, FileText, Film, Music, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { Attachment, ChatInputProps, Message } from "./types";

const getFileType = (file: File): Attachment['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
};

const getFileIcon = (type: Attachment['type']) => {
  switch (type) {
    case 'image': return Image;
    case 'video': return Film;
    case 'audio': return Music;
    default: return FileText;
  }
};

// Component for reply preview bar
const ReplyPreview = memo(({
  message,
  contactName,
  onCancel,
}: {
  message: Message;
  contactName?: string;
  onCancel: () => void;
}) => {
  const senderLabel = message.sender === 'user' 
    ? (message.senderName || contactName || 'Cliente')
    : message.sender === 'agent'
    ? 'Você'
    : 'Bot';

  return (
    <div className="mb-3 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
      <div className="flex items-start gap-3">
        <Reply className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary mb-1">
            Respondendo a {senderLabel}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {message.content || (message.attachment ? `[${message.attachment.type}]` : '[Mensagem]')}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          aria-label="Cancelar resposta"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

ReplyPreview.displayName = "ReplyPreview";

export const ChatInput = memo(({ 
  onSendMessage, 
  replyToMessage, 
  onCancelReply,
  contactName,
}: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() === "" && !selectedFile) return;
    onSendMessage(newMessage, selectedFile || undefined);
    setNewMessage("");
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [newMessage, selectedFile, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limite de 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo: 10MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Preview para imagens
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  const inputPlaceholder = useMemo(() => {
    if (replyToMessage) return "Digite sua resposta...";
    return isRecording ? "Gravando..." : "Digite uma mensagem...";
  }, [isRecording, replyToMessage]);

  const recordingButtonClass = useMemo(() => {
    return cn(
      "p-2 rounded-full transition-colors",
      isRecording ? "text-destructive hover:text-destructive/80" : "text-gray-500 hover:text-gray-700"
    );
  }, [isRecording]);

  const fileType = selectedFile ? getFileType(selectedFile) : null;
  const FileIcon = fileType ? getFileIcon(fileType) : null;

  return (
    <div className="bg-white p-4">
      {/* Reply Preview */}
      {replyToMessage && onCancelReply && (
        <ReplyPreview 
          message={replyToMessage} 
          contactName={contactName}
          onCancel={onCancelReply} 
        />
      )}

      {/* Preview do arquivo selecionado */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {FileIcon && <FileIcon size={24} className="text-gray-500" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={removeFile}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
              aria-label="Remover arquivo"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <button
          className={recordingButtonClass}
          onClick={toggleRecording}
          aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full transition-colors"
          onClick={handleFileUpload}
          aria-label="Enviar arquivo"
        >
          <FileUp size={20} />
        </button>
        <div className="flex-1">
          <Textarea
            placeholder={inputPlaceholder}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-10 max-h-32 resize-none py-2"
            disabled={isRecording}
            aria-label="Digite uma mensagem"
            rows={1}
          />
        </div>
        <Button 
          onClick={handleSendMessage} 
          className="bg-viainfra-primary hover:bg-viainfra-primary/90"
          disabled={(!newMessage.trim() && !selectedFile) || isRecording}
          aria-label="Enviar mensagem"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13"></path>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
          </svg>
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
