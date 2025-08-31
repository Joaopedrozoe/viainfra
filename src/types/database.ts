// Database types for PostgreSQL integration
export interface Company {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'user' | 'agent';
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'whatsapp' | 'facebook' | 'instagram' | 'telegram' | 'email' | 'website';
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  phone_number?: string;
  instance_id?: string; // Para Evolution API
  api_key?: string;
  webhook_url?: string;
  settings: Record<string, any>;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  flow_data: {
    nodes: any[];
    edges: any[];
  };
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelBot {
  id: string;
  channel_id: string;
  bot_id: string;
  is_active: boolean;
  trigger_conditions: Record<string, any>;
  created_at: string;
}

export interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  metadata: Record<string, any>;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  channel_id: string;
  bot_id?: string;
  status: 'active' | 'closed' | 'transferred';
  assigned_to?: string;
  last_message_at: string;
  company_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document' | 'location' | 'contact';
  sender_type: 'contact' | 'agent' | 'bot';
  sender_id?: string;
  external_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  conversation_id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  form_data: Record<string, any>;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  channel_id: string;
  event_type: string;
  payload: Record<string, any>;
  processed: boolean;
  processing_error?: string;
  created_at: string;
}

// Evolution API Types
export interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageType: string;
  message: {
    conversation?: string;
    imageMessage?: any;
    audioMessage?: any;
    documentMessage?: any;
  };
  messageTimestamp: number;
  pushName?: string;
  participant?: string;
}

export interface EvolutionWebhook {
  event: 'messages.upsert' | 'presence.update' | 'connection.update';
  instance: string;
  data: {
    messages?: EvolutionMessage[];
    presences?: any[];
    state?: string;
  };
}