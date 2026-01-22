export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "bot";
  timestamp: string;
  attachment?: Attachment;
  deliveryStatus?: MessageDeliveryStatus;
  whatsappMessageId?: string;
  // Campos para mídia indisponível
  mediaUnavailable?: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  // Campos para ações de mensagem
  isPinned?: boolean;
  isFavorite?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  // Campos para mensagens com reply/citação
  quotedMessageId?: string;
  quotedContent?: string;
  quotedSender?: string;
  quotedAttachmentType?: 'image' | 'video' | 'audio' | 'document';
}

export interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
  onEndConversation?: (conversationId: string) => void;
}
