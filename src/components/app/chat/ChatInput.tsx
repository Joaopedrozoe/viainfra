import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic, MicOff, FileUp, X, Image, FileText, Film, Music, Reply, Smile,
  MessageSquarePlus, Loader2, MapPin, User, Search, Crosshair, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Attachment, ChatInputProps, Message } from "./types";
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  validateWhatsAppFile,
  validateAsDocument,
  getWhatsAppAttachmentType,
  WHATSAPP_ACCEPT_ATTRIBUTE,
} from "@/lib/whatsapp-media";
import { supabase } from "@/integrations/supabase/client";

const getFileType = (file: File): Attachment['type'] => getWhatsAppAttachmentType(file);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const getFileIcon = (type: Attachment['type']) => {
  switch (type) {
    case 'image':
    case 'sticker':
      return Image;
    case 'video': return Film;
    case 'audio': return Music;
    default: return FileText;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
};

// Um item da fila de anexos a enviar (drag&drop/paste/seleção múltipla)
interface QueuedFile {
  id: string;
  file: File;
  kind: Attachment['type'];
  previewUrl: string | null;
}

let queuedFileSeq = 0;

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
          {!message.whatsappMessageId && (
            <p className="text-[10px] text-amber-500/80 mt-0.5 italic">
              citação somente no inbox
            </p>
          )}
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

// Diálogo para envio de localização
const LocationDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { latitude: number; longitude: number; name: string; address: string }) => void;
}) => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) {
      setLatitude("");
      setLongitude("");
      setName("");
      setAddress("");
    }
  }, [open]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada neste navegador.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setLocating(false);
      },
      () => {
        toast.error("Não foi possível obter sua localização.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const validCoords = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar localização</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating} className="gap-2">
            {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
            Usar minha localização
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-23.5505" />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-46.6333" />
            </div>
          </div>
          <div>
            <Label htmlFor="loc-name">Nome (opcional)</Label>
            <Input id="loc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Escritório" />
          </div>
          <div>
            <Label htmlFor="loc-address">Endereço (opcional)</Label>
            <Input id="loc-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, cidade" />
          </div>
          {validCoords && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink size={12} /> Ver no OpenStreetMap
            </a>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            type="button"
            disabled={!validCoords}
            onClick={() => {
              onConfirm({ latitude: lat, longitude: lng, name, address });
              onOpenChange(false);
            }}
          >
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CompanyContact {
  id: string;
  name: string;
  phone: string | null;
}

// Diálogo para escolher e enviar um cartão de contato (contatos da própria empresa)
const ContactPickerDialog = ({
  open,
  onOpenChange,
  companyId,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string | null;
  onConfirm: (contact: { fullName: string; phone: string }) => void;
}) => {
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !companyId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let query = supabase
        .from('contacts')
        .select('id, name, phone')
        .eq('company_id', companyId)
        .not('phone', 'is', null)
        .order('name')
        .limit(50);
      if (search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (!cancelled) {
        if (!error) setContacts((data || []) as CompanyContact[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, companyId, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar contato</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-72">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}
          {!loading && contacts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum contato encontrado.</p>
          )}
          <div className="space-y-1">
            {contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (!c.phone) {
                    toast.error("Este contato não possui telefone.");
                    return;
                  }
                  onConfirm({ fullName: c.name, phone: c.phone });
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/70 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <User size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ChatInput = memo(({ 
  onSendMessage, 
  replyToMessage, 
  onCancelReply,
  contactName,
  onSendTemplate,
  sendingTemplate,
  companyId,
}: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [acceptOverride, setAcceptOverride] = useState<string | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detectar tema do sistema/app
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // Observer para mudanças de tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Libera as URLs de preview criadas para evitar vazamento de memória
  useEffect(() => {
    return () => {
      queuedFiles.forEach((qf) => {
        if (qf.previewUrl) URL.revokeObjectURL(qf.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Valida e adiciona arquivos à fila de anexos (drag&drop, paste ou seletor)
  const addFilesToQueue = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const accepted: QueuedFile[] = [];

    for (const file of files) {
      const validation = validateWhatsAppFile(file);
      if (!validation.ok) {
        if (validation.suggestDocument) {
          // Tenta reenviar automaticamente como documento (Meta aceita quase qualquer extensão)
          const asDoc = validateAsDocument(file);
          if (asDoc.ok) {
            toast.info(`"${file.name}" será enviado como documento (formato não suportado como mídia).`);
            accepted.push({
              id: `qf-${++queuedFileSeq}`,
              file,
              kind: 'document',
              previewUrl: null,
            });
            continue;
          }
        }
        toast.error(validation.error || `Arquivo "${file.name}" não suportado pela API oficial do WhatsApp`);
        continue;
      }

      let previewUrl: string | null = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      accepted.push({
        id: `qf-${++queuedFileSeq}`,
        file,
        kind: validation.kind,
        previewUrl,
      });
    }

    if (accepted.length > 0) {
      setQueuedFiles((prev) => [...prev, ...accepted]);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (isSending) return;
    if (newMessage.trim() === "" && queuedFiles.length === 0) return;
    setIsSending(true);
    try {
      if (queuedFiles.length === 0) {
        await Promise.resolve(onSendMessage(newMessage));
      } else {
        // Envio sequencial: legenda vai apenas no primeiro arquivo (como no WhatsApp oficial)
        for (let i = 0; i < queuedFiles.length; i++) {
          const caption = i === 0 ? newMessage : "";
          // eslint-disable-next-line no-await-in-loop
          await Promise.resolve(onSendMessage(caption, queuedFiles[i].file));
        }
      }
      setNewMessage("");
      queuedFiles.forEach((qf) => { if (qf.previewUrl) URL.revokeObjectURL(qf.previewUrl); });
      setQueuedFiles([]);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, queuedFiles, onSendMessage, isSending]);

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
    const files = Array.from(e.target.files || []);
    addFilesToQueue(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFilesToQueue]);

  const handleFileUpload = useCallback((accept?: string) => {
    setAcceptOverride(accept ?? null);
    // aguarda o accept ser aplicado ao input antes de abrir o seletor
    setTimeout(() => fileInputRef.current?.click(), 0);
  }, []);

  const removeQueuedFile = useCallback((id: string) => {
    setQueuedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Drag & drop na área de composição/conversa
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      dragCounterRef.current += 1;
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    addFilesToQueue(files);
  }, [addFilesToQueue]);

  // Paste de imagens/arquivos direto no textarea
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files: File[] = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFilesToQueue(files);
    }
  }, [addFilesToQueue]);

  // Handler para inserir emoji no cursor
  const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = newMessage.slice(0, start) + emoji + newMessage.slice(end);
      
      setNewMessage(newText);
      
      // Mover cursor para depois do emoji
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + emoji.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    } else {
      // Fallback: adicionar no final
      setNewMessage(prev => prev + emoji);
    }
    
    setIsEmojiPickerOpen(false);
  }, [newMessage]);

  const handleSendLocation = useCallback(async (data: { latitude: number; longitude: number; name: string; address: string }) => {
    const attachment: Attachment = {
      type: 'location',
      url: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
      latitude: data.latitude,
      longitude: data.longitude,
      locationName: data.name || undefined,
      locationAddress: data.address || undefined,
    };
    setIsSending(true);
    try {
      await Promise.resolve(onSendMessage("", attachment));
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage]);

  const handleSendContact = useCallback(async (contact: { fullName: string; phone: string }) => {
    const attachment: Attachment = {
      type: 'contact',
      url: '',
      contactName: contact.fullName,
      contactPhones: [contact.phone],
    };
    setIsSending(true);
    try {
      await Promise.resolve(onSendMessage("", attachment));
    } finally {
      setIsSending(false);
    }
  }, [onSendMessage]);

  const inputPlaceholder = useMemo(() => {
    if (replyToMessage) return "Digite sua resposta...";
    return isRecording ? "Gravando..." : "Digite uma mensagem...";
  }, [isRecording, replyToMessage]);

  const recordingButtonClass = useMemo(() => {
    return cn(
      "p-2 rounded-full transition-colors",
      isRecording ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-foreground"
    );
  }, [isRecording]);

  return (
    <div
      className="relative bg-background border-t border-border p-4 shadow-sm"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Overlay de drag & drop */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg pointer-events-none">
          <p className="text-primary font-medium">Solte os arquivos para anexar</p>
        </div>
      )}

      {/* Reply Preview */}
      {replyToMessage && onCancelReply && (
        <ReplyPreview 
          message={replyToMessage} 
          contactName={contactName}
          onCancel={onCancelReply} 
        />
      )}

      {/* Preview dos arquivos em fila */}
      {queuedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {queuedFiles.map((qf) => {
            const FileIcon = getFileIcon(qf.kind);
            return (
              <div key={qf.id} className="relative flex items-center gap-2 p-2 pr-3 bg-muted/50 rounded-lg border border-border max-w-[220px]">
                {qf.previewUrl ? (
                  <img src={qf.previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <FileIcon size={18} className="text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{qf.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(qf.file.size)}</p>
                </div>
                <button
                  onClick={() => removeQueuedFile(qf.id)}
                  className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Remover arquivo"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

       <div className="flex space-x-2 items-end">
         <input
           ref={fileInputRef}
           type="file"
           multiple
           className="hidden"
           onChange={handleFileSelect}
           accept={acceptOverride ?? WHATSAPP_ACCEPT_ATTRIBUTE}
         />
         <button
           type="button"
           className={recordingButtonClass}
           onClick={toggleRecording}
           disabled={isSending}
           aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
         >
           {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
         </button>
         <Popover>
           <PopoverTrigger asChild>
             <Button type="button" variant="ghost" size="icon" disabled={isSending} aria-label="Escolher tipo de arquivo" title="Escolher tipo de arquivo">
               <FileUp size={20} />
             </Button>
           </PopoverTrigger>
           <PopoverContent className="w-48 p-2" side="top" align="start">
             <div className="grid gap-1">
               <Button type="button" variant="ghost" className="justify-start" onClick={() => handleFileUpload("image/*")}>Imagem ou sticker</Button>
               <Button type="button" variant="ghost" className="justify-start" onClick={() => handleFileUpload("video/*")}>Vídeo</Button>
               <Button type="button" variant="ghost" className="justify-start" onClick={() => handleFileUpload("audio/*")}>Áudio</Button>
               <Button type="button" variant="ghost" className="justify-start" onClick={() => handleFileUpload("application/*,text/*")}>Documento</Button>
               <Button type="button" variant="ghost" className="justify-start" onClick={() => handleFileUpload()}>Todos os formatos</Button>
               <div className="my-1 border-t border-border" />
               <Button type="button" variant="ghost" className="justify-start gap-2" onClick={() => setLocationDialogOpen(true)}>
                 <MapPin size={16} /> Localização
               </Button>
               <Button type="button" variant="ghost" className="justify-start gap-2" onClick={() => setContactDialogOpen(true)}>
                 <User size={16} /> Contato
               </Button>
             </div>
           </PopoverContent>
         </Popover>

        {onSendTemplate && (
          <button
            className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors disabled:opacity-50"
            onClick={onSendTemplate}
            disabled={sendingTemplate}
            aria-label="Enviar template de abertura"
            title="Enviar template de abertura"
            type="button"
          >
            <MessageSquarePlus size={20} className={cn(sendingTemplate && "animate-pulse")} />
          </button>
        )}
        

        
        {/* Emoji Picker Button */}
        <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <button
              className="p-2 text-muted-foreground hover:text-foreground rounded-full transition-colors"
              aria-label="Selecionar emoji"
              type="button"
            >
              <Smile size={20} />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 border-0" 
            side="top" 
            align="start"
            sideOffset={8}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
              emojiStyle={EmojiStyle.NATIVE}
              lazyLoadEmojis={true}
              searchPlaceHolder="Buscar emoji..."
              previewConfig={{ showPreview: false }}
              height={350}
              width={320}
              skinTonesDisabled={false}
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            placeholder={inputPlaceholder}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="w-full min-h-10 max-h-32 resize-none py-2 bg-muted/30 border-0 focus:ring-1 focus:ring-primary/50"
            disabled={isRecording}
            aria-label="Digite uma mensagem"
            rows={1}
          />
        </div>
         <Button 
           onClick={handleSendMessage} 
           className="bg-primary hover:bg-primary/90"
           disabled={(!newMessage.trim() && queuedFiles.length === 0) || isRecording || isSending}
           aria-label="Enviar mensagem"
         >
           {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendIcon />}
         </Button>
      </div>

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        onConfirm={handleSendLocation}
      />
      <ContactPickerDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={companyId}
        onConfirm={handleSendContact}
      />
    </div>
  );
});

ChatInput.displayName = "ChatInput";
