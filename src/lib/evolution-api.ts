// Evolution API Integration
import { EvolutionMessage, EvolutionWebhook } from '@/types/database';

export class EvolutionAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Gerenciar instâncias
  async createInstance(instanceName: string, webhookUrl?: string) {
    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        webhook: webhookUrl ? {
          webhook: {
            url: webhookUrl,
            events: [
              'MESSAGES_UPSERT',
              'CONNECTION_UPDATE',
              'PRESENCE_UPDATE'
            ]
          }
        } : undefined
      })
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

  // Enviar mensagens
  async sendTextMessage(instanceName: string, number: string, text: string) {
    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: number,
        text: text
      })
    });
  }

  async sendMediaMessage(instanceName: string, number: string, mediaUrl: string, caption?: string) {
    return this.request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: number,
        mediaMessage: {
          media: mediaUrl,
          caption: caption
        }
      })
    });
  }

  async sendButtonMessage(instanceName: string, number: string, text: string, buttons: Array<{id: string, displayText: string}>) {
    return this.request(`/message/sendButtons/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: number,
        buttonMessage: {
          text: text,
          buttons: buttons.map(btn => ({
            type: 1,
            reply: {
              id: btn.id,
              title: btn.displayText
            }
          }))
        }
      })
    });
  }

  // Webhook handling
  static parseWebhookPayload(payload: any): EvolutionWebhook | null {
    try {
      // Validate webhook structure
      if (!payload.event || !payload.instance) {
        return null;
      }

      return {
        event: payload.event,
        instance: payload.instance,
        data: payload.data || {}
      };
    } catch (error) {
      console.error('Error parsing Evolution webhook:', error);
      return null;
    }
  }

  static extractPhoneNumber(remoteJid: string): string {
    // Remove @s.whatsapp.net suffix and return clean phone number
    return remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
  }

  static isGroupMessage(remoteJid: string): boolean {
    return remoteJid.includes('@g.us');
  }

  static extractMessageContent(message: EvolutionMessage): string {
    const msg = message.message;
    
    if (msg.conversation) {
      return msg.conversation;
    }
    
    if (msg.imageMessage?.caption) {
      return msg.imageMessage.caption;
    }
    
    if (msg.audioMessage) {
      return '[Áudio]';
    }
    
    if (msg.documentMessage) {
      return `[Documento: ${msg.documentMessage.title || 'Arquivo'}]`;
    }
    
    return '[Mensagem não suportada]';
  }
}

// Utility functions for webhook processing
export const evolutionUtils = {
  normalizePhoneNumber: (phone: string): string => {
    // Remove all non-numeric characters and add country code if missing
    const cleaned = phone.replace(/\D/g, '');
    
    // If number doesn't start with country code, assume Brazil (+55)
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  },

  formatPhoneForWhatsApp: (phone: string): string => {
    const normalized = evolutionUtils.normalizePhoneNumber(phone);
    return `${normalized}@s.whatsapp.net`;
  },

  isValidPhoneNumber: (phone: string): boolean => {
    const normalized = evolutionUtils.normalizePhoneNumber(phone);
    return normalized.length >= 10 && normalized.length <= 15;
  }
};