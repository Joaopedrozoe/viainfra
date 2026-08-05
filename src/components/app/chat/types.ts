export type AttachmentType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'sticker'
  | 'contact';

export interface Attachment {
  type: AttachmentType;
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  // Campos específicos para localização
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
  // Campos específicos para contato (vCard)
  contactName?: string;
  contactPhones?: string[];
  vcard?: string;
}


export type MessageDeliveryStatus = 'sending' | 'sent' | 'sent_confirmed' | 'delivered' | 'read' | 'played' | 'pending' | 'failed';

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "bot";
  timestamp: string;
  attachment?: Attachment;
  deliveryStatus?: MessageDeliveryStatus;
  whatsappMessageId?: string;
  senderName?: string;
  // Campos para mídia indisponível
  mediaUnavailable?: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'location';
  // Campos para ações de mensagem
  isPinned?: boolean;
  isFavorite?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  // Campos para mensagens com reply/citação
  quotedMessageId?: string;
  quotedContent?: string;
  quotedSender?: string;
  quotedAttachmentType?: 'image' | 'video' | 'audio' | 'document' | 'location';
}

export interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
  onEndConversation?: (conversationId: string) => void;
}

export interface ChatInputProps {
  onSendMessage: (message: string, attachment?: File) => void;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  contactName?: string;
  onSendTemplate?: () => void;
  sendingTemplate?: boolean;
}
