
import { Database } from "@/integrations/supabase/types";
import { Agent, AgentChannel } from "@/types/agent";
import { Conversation, Channel } from "@/types/conversation";
import { Contact } from "@/types/contact";
import { CalendarEvent, EventChannel, ReminderTime } from "@/types/calendar";

export type Tables = Database['public']['Tables'];
export type DbAgent = Tables['agents']['Row'];
export type DbAgentKnowledge = Tables['agent_knowledge']['Row'];
export type DbAgentProcess = Tables['agent_processes']['Row'];
export type DbConversation = Tables['conversations']['Row'];
export type DbMessage = Tables['messages']['Row'];
export type DbContact = Tables['contacts']['Row'];
export type DbNote = Tables['notes']['Row'];
export type DbTask = Tables['tasks']['Row'];
export type DbCalendarEvent = Tables['calendar_events']['Row'];
export type DbCompany = Tables['companies']['Row'];
export type DbProfile = Tables['profiles']['Row'];

// Mapping helpers to convert from database types to application types
export const mapDbAgentToAgent = (dbAgent: DbAgent): Agent => ({
  id: dbAgent.id,
  name: dbAgent.name,
  function: dbAgent.function,
  status: dbAgent.status,
  tone: dbAgent.tone || '',
  description: dbAgent.description || '',
  channels: dbAgent.channels.map(c => c as AgentChannel),
  knowledgeFiles: [],
  knowledgeQA: [],
  knowledgeURLs: [],
  template: dbAgent.template,
  processes: [],
  integrations: [],
  createdAt: dbAgent.created_at,
  updatedAt: dbAgent.updated_at,
  metrics: {
    conversations: 0,
    successRate: 0,
    humanTransfers: 0,
  }
});

export const mapDbConversationToConversation = (dbConv: DbConversation): Conversation => ({
  id: dbConv.id,
  name: dbConv.name,
  channel: dbConv.channel as Channel,
  preview: dbConv.preview || '',
  time: dbConv.time,
  unread: dbConv.unread,
  avatar: dbConv.avatar
});

export const mapDbContactToContact = (dbContact: DbContact): Contact => ({
  id: dbContact.id,
  name: dbContact.name,
  email: dbContact.email || undefined,
  phone: undefined,
  company: undefined,
  tags: [],
  channel: undefined,
  lastInteraction: undefined,
  status: "active",
  source: "manual",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: []
});

export const mapDbCalendarEventToCalendarEvent = (dbEvent: DbCalendarEvent): CalendarEvent => ({
  id: dbEvent.id,
  title: dbEvent.title,
  start: dbEvent.start,
  end: dbEvent.end,
  channel: dbEvent.channel as EventChannel,
  description: dbEvent.description || undefined,
  location: dbEvent.location || undefined,
  reminderMinutes: dbEvent.reminder_minutes as ReminderTime,
  isFromGoogle: dbEvent.is_from_google || false,
  status: dbEvent.status,
  color: dbEvent.color || undefined
});
