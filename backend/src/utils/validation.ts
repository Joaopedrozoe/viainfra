import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').optional(),
  company_slug: z.string().min(2, 'Slug da empresa deve ter pelo menos 2 caracteres').optional(),
});

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'user', 'agent', 'attendant']).default('user'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  role: z.enum(['admin', 'user', 'agent', 'attendant']).optional(),
  is_active: z.boolean().optional(),
});

// Contact schemas
export const createContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  email: z.string().email('Email inválido').optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  metadata: z.record(z.any()).optional(),
});

// Channel schemas
export const createChannelSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['whatsapp', 'facebook', 'instagram', 'telegram', 'email', 'website']),
  phone_number: z.string().optional(),
  instance_id: z.string().optional(),
  api_key: z.string().optional(),
  webhook_url: z.string().url('URL do webhook inválida').optional(),
  settings: z.record(z.any()).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  status: z.enum(['connected', 'disconnected', 'pending', 'error']).optional(),
  phone_number: z.string().optional(),
  instance_id: z.string().optional(),
  api_key: z.string().optional(),
  webhook_url: z.string().url('URL do webhook inválida').optional(),
  settings: z.record(z.any()).optional(),
});

// Conversation schemas
export const createConversationSchema = z.object({
  contact_id: z.string().uuid('Contact ID deve ser um UUID válido'),
  channel_id: z.string().uuid('Channel ID deve ser um UUID válido'),
  bot_id: z.string().uuid('Bot ID deve ser um UUID válido').optional(),
});

export const updateConversationSchema = z.object({
  status: z.enum(['active', 'closed', 'transferred']).optional(),
  assigned_to: z.string().uuid('User ID deve ser um UUID válido').optional(),
  metadata: z.record(z.any()).optional(),
});

// Message schemas
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Conteúdo da mensagem é obrigatório'),
  message_type: z.enum(['text', 'image', 'audio', 'document', 'location', 'contact']).default('text'),
  metadata: z.record(z.any()).optional(),
});

// Agent schemas
export const createAgentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  function: z.enum(['SDR', 'Suporte', 'Vendas', 'Genérico']),
  tone: z.string().min(5, 'Tom deve ter pelo menos 5 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  channels: z.array(z.string()).min(1, 'Pelo menos um canal deve ser selecionado'),
  template: z.enum(['SDR', 'Suporte N1', 'Vendas', 'Genérico']),
});

export const updateAgentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  function: z.enum(['SDR', 'Suporte', 'Vendas', 'Genérico']).optional(),
  tone: z.string().min(5, 'Tom deve ter pelo menos 5 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').optional(),
  channels: z.array(z.string()).optional(),
  status: z.enum(['active', 'training', 'error']).optional(),
});

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  description: z.string().optional(),
});

// Calendar schemas
export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  start_date: z.string().datetime('Data de início deve estar no formato ISO'),
  end_date: z.string().datetime('Data de fim deve estar no formato ISO'),
  all_day: z.boolean().default(false),
});

export const updateCalendarEventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  description: z.string().optional(),
  start_date: z.string().datetime('Data de início deve estar no formato ISO').optional(),
  end_date: z.string().datetime('Data de fim deve estar no formato ISO').optional(),
  all_day: z.boolean().optional(),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.coerce.number().min(1, 'Limit deve ser maior que 0').max(100, 'Limit máximo é 100').default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Query parameter validation
export const idParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file !== undefined, 'Arquivo é obrigatório'),
});