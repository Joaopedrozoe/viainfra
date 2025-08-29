export type ChannelType = 'instagram' | 'facebook' | 'whatsapp' | 'email' | 'website' | 'telegram';
export type ChannelStatus = 'connected' | 'disconnected' | 'pending' | 'error';
export type IntegrationProvider = 'Meta' | 'WhatsApp Cloud API' | 'Twilio' | 'SendGrid' | 'Custom' | 'Telegram API';

export interface WeeklySchedule {
  monday: { start: string; end: string; enabled: boolean };
  tuesday: { start: string; end: string; enabled: boolean };
  wednesday: { start: string; end: string; enabled: boolean };
  thursday: { start: string; end: string; enabled: boolean };
  friday: { start: string; end: string; enabled: boolean };
  saturday: { start: string; end: string; enabled: boolean };
  sunday: { start: string; end: string; enabled: boolean };
}

export interface ChannelIntegration {
  provider: IntegrationProvider;
  appId?: string;
  pageId?: string;
  businessAccountId?: string;
  phoneNumberId?: string;
  webhookUrl?: string;
  verifyToken?: string;
  accessToken?: string;
  lastSync?: string;
  configuration?: Record<string, any>;
}

export interface ChannelSettings {
  autoReply: boolean;
  businessHours?: {
    enabled: boolean;
    schedule: WeeklySchedule;
  };
  welcomeMessage?: string;
  fallbackMessage?: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

export interface ChannelMetrics {
  totalMessages: number;
  todayMessages: number;
  responseTime: number; // em segundos
  lastActivity: string;
  deliveryRate: number; // percentual
  errorRate: number; // percentual
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  description?: string;
  integration: ChannelIntegration;
  settings: ChannelSettings;
  metrics: ChannelMetrics;
  createdAt: string;
  updatedAt: string;
  companyId?: string;
}

export interface ChannelWizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface WebhookEvent {
  id: string;
  channelId: string;
  type: string;
  payload: Record<string, any>;
  timestamp: string;
  processed: boolean;
}