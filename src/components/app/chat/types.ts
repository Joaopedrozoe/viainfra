export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  filename?: string;
  mimeType?: string;
  size?: number;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "bot";
  timestamp: string;
  attachment?: Attachment;
}

export interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
  onEndConversation?: (conversationId: string) => void;
}
