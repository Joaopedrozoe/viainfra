// Evolution API client for WhatsApp integration
// Documentation: https://doc.evolution-api.com/v1/pt/get-started/introduction

import { environment } from './environment';

export interface EvolutionInstance {
  instanceName: string;
  status: 'open' | 'connecting' | 'close';
  qrcode?: string;
  phone?: string;
}

export interface EvolutionMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      url: string;
      caption?: string;
    };
    audioMessage?: {
      url: string;
    };
    videoMessage?: {
      url: string;
      caption?: string;
    };
    documentMessage?: {
      title?: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

export interface EvolutionWebhook {
  event: string;
  instance: string;
  data: EvolutionMessage | any;
}

export class EvolutionAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = (baseUrl || environment.EVOLUTION_API_URL).replace(/\/$/, '');
    this.apiKey = apiKey || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Evolution API request failed:', error);
      throw error;
    }
  }

  // Instance Management
  async createInstance(instanceName: string, webhookUrl?: string) {
    const payload: any = {
      instanceName,
      token: this.apiKey,
      qrcode: true,
      markMessagesRead: true,
      delayMessage: 1000,
      alwaysOnline: true,
      readMessages: true,
      readStatus: true,
      syncFullHistory: true,
    };

    if (webhookUrl) {
      payload.webhook = {
        url: webhookUrl,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE',
          'CALL',
          'NEW_JWT_TOKEN'
        ],
      };
    }

    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteInstance(instanceName: string) {
    return this.request(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    });
  }

  async getInstanceQR(instanceName: string) {
    return this.request(`/instance/connect/${instanceName}`);
  }

  async getInstanceStatus(instanceName: string) {
    return this.request(`/instance/connectionState/${instanceName}`);
  }

  async restartInstance(instanceName: string) {
    return this.request(`/instance/restart/${instanceName}`, {
      method: 'PUT',
    });
  }

  // Message Operations
  async sendTextMessage(instanceName: string, number: string, text: string) {
    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatPhoneNumber(number),
        text,
      }),
    });
  }

  async sendMediaMessage(instanceName: string, number: string, mediaUrl: string, caption?: string, mediaType: 'image' | 'video' | 'audio' | 'document' = 'image') {
    const payload: any = {
      number: this.formatPhoneNumber(number),
      mediaMessage: {
        mediatype: mediaType,
        media: mediaUrl,
      },
    };

    if (caption) {
      payload.mediaMessage.caption = caption;
    }

    return this.request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendButtonMessage(instanceName: string, number: string, text: string, buttons: Array<{id: string, displayText: string}>) {
    return this.request(`/message/sendButtons/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: this.formatPhoneNumber(number),
        buttonMessage: {
          text,
          buttons: buttons.map(btn => ({
            buttonId: btn.id,
            buttonText: { displayText: btn.displayText },
            type: 1,
          })),
          headerType: 1,
        },
      }),
    });
  }

  // Webhook Management
  async setWebhook(instanceName: string, webhookUrl: string, events?: string[]) {
    const defaultEvents = [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE', 
      'MESSAGES_DELETE',
      'SEND_MESSAGE',
      'CONNECTION_UPDATE',
      'CALL',
      'NEW_JWT_TOKEN'
    ];

    return this.request(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        url: webhookUrl,
        events: events || defaultEvents,
        webhook_by_events: true,
      }),
    });
  }

  // Utility Methods
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (default to Brazil +55)
    if (cleaned.length === 11 && cleaned.startsWith('55')) {
      return cleaned;
    }
    
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    
    if (cleaned.length === 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  }

  static parseWebhookPayload(payload: any): EvolutionWebhook | null {
    try {
      if (!payload.event || !payload.instance || !payload.data) {
        return null;
      }

      return {
        event: payload.event,
        instance: payload.instance,
        data: payload.data,
      };
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return null;
    }
  }

  static extractPhoneNumber(remoteJid: string): string {
    return remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  }

  static isGroupMessage(remoteJid: string): boolean {
    return remoteJid.includes('@g.us');
  }

  static extractMessageContent(message: EvolutionMessage): string {
    const msgContent = message.message;
    
    if (msgContent.conversation) {
      return msgContent.conversation;
    }
    
    if (msgContent.extendedTextMessage?.text) {
      return msgContent.extendedTextMessage.text;
    }
    
    if (msgContent.imageMessage?.caption) {
      return msgContent.imageMessage.caption;
    }
    
    if (msgContent.videoMessage?.caption) {
      return msgContent.videoMessage.caption;
    }
    
    if (msgContent.imageMessage) {
      return '[Imagem]';
    }
    
    if (msgContent.videoMessage) {
      return '[Vídeo]';
    }
    
    if (msgContent.audioMessage) {
      return '[Áudio]';
    }
    
    return '[Mensagem não suportada]';
  }
}

// Utility functions for webhook processing
export const evolutionUtils = {
  normalizePhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Add Brazil country code if needed
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    
    if (cleaned.length === 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  },

  formatPhoneForWhatsApp: (phone: string): string => {
    const normalized = evolutionUtils.normalizePhoneNumber(phone);
    return `${normalized}@s.whatsapp.net`;
  },

  isValidPhoneNumber: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  createConversationFromMessage: (message: EvolutionMessage) => {
    const phoneNumber = EvolutionAPI.extractPhoneNumber(message.key.remoteJid);
    const content = EvolutionAPI.extractMessageContent(message);
    
    return {
      id: `whatsapp-${phoneNumber}-${Date.now()}`,
      contactId: phoneNumber,
      phone: phoneNumber,
      name: message.pushName || phoneNumber,
      channel: 'whatsapp' as const,
      lastMessage: content,
      timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
      unread: !message.key.fromMe ? 1 : 0,
      status: 'active' as const,
    };
  },

  createMessageFromWebhook: (webhook: EvolutionWebhook) => {
    const message = webhook.data as EvolutionMessage;
    const phoneNumber = EvolutionAPI.extractPhoneNumber(message.key.remoteJid);
    const content = EvolutionAPI.extractMessageContent(message);
    
    return {
      id: message.key.id,
      conversationId: `whatsapp-${phoneNumber}`,
      content,
      timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
      isFromUser: !message.key.fromMe,
      senderName: message.pushName || phoneNumber,
      channel: 'whatsapp' as const,
      status: 'sent' as const,
    };
  }
};

export default EvolutionAPI;