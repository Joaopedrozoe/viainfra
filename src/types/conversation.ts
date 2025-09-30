
export type Channel = "whatsapp" | "instagram" | "messenger" | "telegram" | "web" | "internal";

export interface Conversation {
  id: string;
  name: string;
  channel: Channel;
  preview: string;
  time: string;
  unread: number;
  avatar?: string;
  departmentId?: string;
}
