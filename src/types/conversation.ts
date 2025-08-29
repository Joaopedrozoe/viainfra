
export type Channel = "whatsapp" | "instagram" | "messenger" | "telegram";

export interface Conversation {
  id: string;
  name: string;
  channel: Channel;
  preview: string;
  time: string;
  unread: number;
  avatar?: string;
}
