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
}

export interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
  onEndConversation?: (conversationId: string) => void;
}
