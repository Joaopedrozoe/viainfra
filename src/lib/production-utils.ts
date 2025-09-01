// Production utilities for real API integration

export const API_ENDPOINTS = {
  EVOLUTION: {
    INSTANCES: '/manager/instances',
    MESSAGES: '/message/sendText',
    WEBHOOK: '/webhook/set',
    STATUS: '/instance/status'
  },
  WHATSAPP: {
    MESSAGES: '/messages',
    WEBHOOKS: '/webhooks',
    MEDIA: '/media'
  }
};

export const createEvolutionApiClient = (baseUrl: string, apiKey: string) => {
  const client = {
    async get(endpoint: string) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.json();
    },
    
    async post(endpoint: string, data: any) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return response.json();
    }
  };

  return {
    // Instance management
    async getInstances() {
      return client.get(API_ENDPOINTS.EVOLUTION.INSTANCES);
    },
    
    async getInstanceStatus(instanceName: string) {
      return client.get(`${API_ENDPOINTS.EVOLUTION.STATUS}/${instanceName}`);
    },
    
    // Message handling
    async sendMessage(instanceName: string, message: any) {
      return client.post(`/${instanceName}${API_ENDPOINTS.EVOLUTION.MESSAGES}`, message);
    },
    
    // Webhook configuration
    async setWebhook(instanceName: string, webhookUrl: string) {
      return client.post(`/${instanceName}${API_ENDPOINTS.EVOLUTION.WEBHOOK}`, {
        url: webhookUrl,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGE_RECEIVED',
          'CONNECTION_UPDATE'
        ]
      });
    }
  };
};

export const processIncomingMessage = (webhook: any) => {
  const { data } = webhook;
  
  if (data.messageType === 'conversation') {
    return {
      id: data.key.id,
      from: data.key.remoteJid,
      message: data.message?.conversation || data.message?.extendedTextMessage?.text,
      timestamp: new Date(data.messageTimestamp * 1000).toISOString(),
      type: 'text'
    };
  }
  
  // Handle other message types (image, audio, etc.)
  return null;
};

export const createConversationFromMessage = (message: any) => {
  const phoneNumber = message.from.replace('@s.whatsapp.net', '');
  
  return {
    id: `conv-${phoneNumber}-${Date.now()}`,
    name: phoneNumber,
    channel: 'whatsapp' as const,
    preview: message.message || 'Nova mensagem',
    time: message.timestamp,
    unread: 1,
    phone: phoneNumber,
    lastMessage: message.message
  };
};

export const generateWebhookUrl = (baseUrl: string, instanceName: string) => {
  return `${baseUrl}/webhooks/evolution/${instanceName}`;
};

export const validateProductionConfig = () => {
  const errors: string[] = [];
  
  // Check environment variables that should be set in production
  const requiredEnvVars = [
    'DATABASE_URL',
    'EVOLUTION_API_BASE_URL',
    'WEBHOOK_BASE_URL'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing environment variable: ${envVar}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};