
export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "bot";
  timestamp: string;
}

export interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}
