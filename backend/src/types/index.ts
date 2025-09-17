// Database types for backend API responses
import { Request } from 'express';
import { Socket } from 'socket.io';

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
  name: string;
  role: 'admin' | 'user' | 'agent' | 'attendant';
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithoutPassword extends Omit<User, 'password_hash'> {}

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
  // Relations
  contact?: Contact;
  channel?: Channel;
  assigned_user?: UserWithoutPassword;
  messages?: Message[];
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

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  company_name?: string;
  company_slug?: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
  company: Company;
}

export interface CreateConversationRequest {
  contact_id: string;
  channel_id: string;
  bot_id?: string;
}

export interface SendMessageRequest {
  content: string;
  message_type?: 'text' | 'image' | 'audio' | 'document';
  metadata?: Record<string, any>;
}

export interface CreateContactRequest {
  name?: string;
  phone: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface CreateChannelRequest {
  name: string;
  type: 'whatsapp' | 'facebook' | 'instagram' | 'telegram' | 'email' | 'website';
  phone_number?: string;
  instance_id?: string;
  api_key?: string;
  webhook_url?: string;
  settings?: Record<string, any>;
}

export interface UpdateChannelRequest {
  name?: string;
  status?: 'connected' | 'disconnected' | 'pending' | 'error';
  phone_number?: string;
  instance_id?: string;
  api_key?: string;
  webhook_url?: string;
  settings?: Record<string, any>;
}

// Evolution API types
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

// Agent types
export interface Agent {
  id: string;
  name: string;
  function: 'SDR' | 'Suporte' | 'Vendas' | 'Genérico';
  status: 'active' | 'training' | 'error';
  tone: string;
  description: string;
  channels: string[];
  knowledgeFiles: string[];
  knowledgeQA: { question: string; answer: string }[];
  knowledgeURLs: string[];
  template: 'SDR' | 'Suporte N1' | 'Vendas' | 'Genérico';
  processes: { id: string; order: number; description: string }[];
  integrations?: {
    type: 'n8n' | 'zapier' | 'custom';
    webhookUrl?: string;
    headers?: string;
    payloadTemplate?: string;
    enabled: boolean;
  }[];
  company_id: string;
  created_at: string;
  updated_at: string;
  metrics: {
    conversations: number;
    successRate: number;
    humanTransfers: number;
  };
}

export interface CreateAgentRequest {
  name: string;
  function: 'SDR' | 'Suporte' | 'Vendas' | 'Genérico';
  tone: string;
  description: string;
  channels: string[];
  template: 'SDR' | 'Suporte N1' | 'Vendas' | 'Genérico';
}

// Department types
export interface Department {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  company_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day?: boolean;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Express Request types
export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword & { company_id: string };
  body: any;
  query: any;
  params: any;
  headers: any;
}

export interface AuthenticatedSocket extends Socket {
  user?: UserWithoutPassword & { company_id: string };
}