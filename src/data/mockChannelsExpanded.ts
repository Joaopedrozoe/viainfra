import { Channel, ChannelType, ChannelStatus } from '@/types/channels';

// Default weekly schedule
const defaultSchedule = {
  monday: { start: '09:00', end: '18:00', enabled: true },
  tuesday: { start: '09:00', end: '18:00', enabled: true },
  wednesday: { start: '09:00', end: '18:00', enabled: true },
  thursday: { start: '09:00', end: '18:00', enabled: true },
  friday: { start: '09:00', end: '18:00', enabled: true },
  saturday: { start: '09:00', end: '14:00', enabled: true },
  sunday: { start: '09:00', end: '14:00', enabled: false }
};

export const mockChannelsExpanded: Channel[] = [
  {
    id: '1',
    name: 'WhatsApp Business',
    type: 'whatsapp',
    status: 'disconnected',
    description: 'Canal oficial do WhatsApp Business',
    integration: {
      provider: 'WhatsApp Cloud API',
      phoneNumberId: '+5511999999999',
      businessAccountId: 'demo-business-123',
      webhookUrl: 'https://app.example.com/webhooks/whatsapp',
      verifyToken: 'whatsapp-verify-token',
      lastSync: new Date().toISOString()
    },
    settings: {
      autoReply: true,
      businessHours: {
        enabled: true,
        schedule: defaultSchedule
      },
      welcomeMessage: 'Olá! Bem-vindo ao nosso atendimento via WhatsApp.',
      fallbackMessage: 'Desculpe, não entendi. Um atendente entrará em contato.',
      notifications: {
        email: true,
        push: true
      }
    },
    metrics: {
      totalMessages: 0,
      todayMessages: 0,
      responseTime: 0,
      lastActivity: '',
      deliveryRate: 0,
      errorRate: 0
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    companyId: 'demo-company-456'
  },
  {
    id: '2',
    name: 'Instagram Direct',
    type: 'instagram',
    status: 'disconnected',
    description: 'Mensagens diretas do Instagram',
    integration: {
      provider: 'Meta',
      appId: 'instagram-app-789',
      businessAccountId: 'ig-business-456',
      webhookUrl: 'https://app.example.com/webhooks/instagram',
      verifyToken: 'instagram-verify-token',
      lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    },
    settings: {
      autoReply: true,
      businessHours: {
        enabled: true,
        schedule: defaultSchedule
      },
      welcomeMessage: '👋 Olá! Obrigado por entrar em contato conosco.',
      fallbackMessage: 'Em breve um de nossos atendentes responderá sua mensagem.',
      notifications: {
        email: true,
        push: false
      }
    },
    metrics: {
      totalMessages: 0,
      todayMessages: 0,
      responseTime: 0,
      lastActivity: '',
      deliveryRate: 0,
      errorRate: 0
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    companyId: 'demo-company-456'
  },
  {
    id: '3',
    name: 'Facebook Messenger',
    type: 'facebook',
    status: 'pending',
    description: 'Página do Facebook Messenger',
    integration: {
      provider: 'Meta',
      appId: 'facebook-app-123',
      pageId: 'facebook-page-789',
      webhookUrl: 'https://app.example.com/webhooks/facebook',
      verifyToken: 'facebook-verify-token',
      configuration: {
        pageAccessToken: 'pending',
        setupStep: 'webhook_configuration'
      }
    },
    settings: {
      autoReply: false,
      businessHours: {
        enabled: false,
        schedule: defaultSchedule
      },
      notifications: {
        email: true,
        push: true
      }
    },
    metrics: {
      totalMessages: 0,
      todayMessages: 0,
      responseTime: 0,
      lastActivity: '',
      deliveryRate: 0,
      errorRate: 0
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    companyId: 'demo-company-456'
  },
  {
    id: '4',
    name: 'Email Corporativo',
    type: 'email',
    status: 'disconnected',
    description: 'Atendimento por email',
    integration: {
      provider: 'SendGrid',
      configuration: {
        fromEmail: 'atendimento@empresa.com',
        smtpHost: 'smtp.sendgrid.net',
        port: 587
      },
      lastSync: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    },
    settings: {
      autoReply: true,
      businessHours: {
        enabled: true,
        schedule: defaultSchedule
      },
      welcomeMessage: 'Recebemos seu email e responderemos em breve.',
      fallbackMessage: 'Seu email foi encaminhado para nossa equipe.',
      notifications: {
        email: false,
        push: true
      }
    },
    metrics: {
      totalMessages: 0,
      todayMessages: 0,
      responseTime: 0,
      lastActivity: '',
      deliveryRate: 0,
      errorRate: 0
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    companyId: 'demo-company-456'
  },
  {
    id: '5',
    name: 'Chat do Site',
    type: 'website',
    status: 'disconnected',
    description: 'Widget de chat incorporado no site',
    integration: {
      provider: 'Custom',
      webhookUrl: 'https://app.example.com/webhooks/website',
      configuration: {
        widgetId: 'widget-abc123',
        domains: ['https://empresa.com', 'https://www.empresa.com'],
        theme: 'light'
      },
      lastSync: new Date().toISOString()
    },
    settings: {
      autoReply: true,
      businessHours: {
        enabled: true,
        schedule: defaultSchedule
      },
      welcomeMessage: 'Olá! Como podemos ajudar você hoje?',
      fallbackMessage: 'Aguarde um momento, vamos conectar você com um atendente.',
      notifications: {
        email: true,
        push: true
      }
    },
    metrics: {
      totalMessages: 0,
      todayMessages: 0,
      responseTime: 0,
      lastActivity: '',
      deliveryRate: 0,
      errorRate: 0
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    updatedAt: new Date().toISOString(),
    companyId: 'demo-company-456'
  },
  {
    id: '6',
    name: 'Telegram Bot',
    type: 'telegram',
    status: 'error',
    description: 'Bot do Telegram com erro de conexão',
    integration: {
      provider: 'Telegram API',
      configuration: {
        botToken: 'error-expired-token',
        botUsername: '@empresabot',
        lastError: 'Token expirado'
      },
      webhookUrl: 'https://app.example.com/webhooks/telegram',
      lastSync: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    settings: {
      autoReply: true,
      businessHours: {
        enabled: false,
        schedule: defaultSchedule
      },
      notifications: {
        email: true,
        push: false
      }
    },
    metrics: {
      totalMessages: 234,
      todayMessages: 0,
      responseTime: 0,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      deliveryRate: 0,
      errorRate: 100
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    companyId: 'demo-company-456'
  }
];

// Funções para gerenciar os canais expandidos
export const getDemoChannelsExpanded = (): Channel[] => {
  const saved = localStorage.getItem('demo-channels-expanded');
  return saved ? JSON.parse(saved) : mockChannelsExpanded;
};

export const saveDemoChannelsExpanded = (channels: Channel[]): void => {
  localStorage.setItem('demo-channels-expanded', JSON.stringify(channels));
};

export const addDemoChannelExpanded = (channel: Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>): Channel => {
  const channels = getDemoChannelsExpanded();
  const newChannel: Channel = {
    ...channel,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const updatedChannels = [...channels, newChannel];
  saveDemoChannelsExpanded(updatedChannels);
  return newChannel;
};

export const updateDemoChannelExpanded = (channelId: string, updates: Partial<Channel>): void => {
  const channels = getDemoChannelsExpanded();
  const updatedChannels = channels.map(channel =>
    channel.id === channelId 
      ? { ...channel, ...updates, updatedAt: new Date().toISOString() } 
      : channel
  );
  saveDemoChannelsExpanded(updatedChannels);
};

export const deleteDemoChannelExpanded = (channelId: string): void => {
  const channels = getDemoChannelsExpanded();
  const updatedChannels = channels.filter(channel => channel.id !== channelId);
  saveDemoChannelsExpanded(updatedChannels);
};

export const toggleDemoChannelExpandedStatus = (channelId: string): void => {
  const channels = getDemoChannelsExpanded();
  const updatedChannels = channels.map(channel =>
    channel.id === channelId 
      ? { 
          ...channel, 
          status: (channel.status === 'connected' ? 'disconnected' : 'connected') as ChannelStatus,
          updatedAt: new Date().toISOString()
        } 
      : channel
  );
  saveDemoChannelsExpanded(updatedChannels);
};