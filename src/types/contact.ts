
export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  content: string;
  tasks: Task[];
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
  tags: string[];
  channel?: string;
  lastInteraction?: string;
  status: "active" | "inactive";
  source: "conversation" | "manual";
  createdAt: string;
  updatedAt: string;
  notes: Note[];
  metadata?: any;
}

export interface ContactGroup {
  id: string;
  name: string;
  criteria: ContactFilter;
  contacts: string[]; // contact IDs
  createdAt: string;
}

export interface ContactFilter {
  channels?: string[];
  tags?: string[];
  status?: "active" | "inactive";
  hasEmail?: boolean;
  hasPendingTasks?: boolean;
  lastInteractionDays?: number;
  source?: "conversation" | "manual";
}

export interface MessageCampaign {
  id: string;
  name: string;
  contactIds: string[];
  channel: string;
  template: string;
  scheduledFor?: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  sentAt?: string;
  metrics: {
    sent: number;
    delivered: number;
    failed: number;
  };
  createdAt: string;
}
