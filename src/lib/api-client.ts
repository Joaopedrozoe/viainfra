import { environment } from './environment';

// API Client para comunicação com o backend Node.js
export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = environment.API_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async signIn(email: string, password: string) {
    return this.request<{ token: string; user: any; profile: any; company: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signUp(email: string, password: string, name: string) {
    return this.request<{ token: string; user: any; profile: any; company: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getProfile() {
    return this.request<{ user: any; profile: any; company: any }>('/auth/me');
  }

  async signOut() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  // Conversations
  async getConversations() {
    return this.request<any[]>('/conversations');
  }

  async getConversationMessages(conversationId: string) {
    return this.request<any[]>(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content }),
    });
  }

  // Contacts
  async getContacts() {
    return this.request<any[]>('/contacts');
  }

  async createContact(contact: any) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async updateContact(id: string, contact: any) {
    return this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  // Agents
  async getAgents() {
    return this.request<any[]>('/agents');
  }

  async createAgent(agent: any) {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: any) {
    return this.request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  // Channels
  async getChannels() {
    return this.request<any[]>('/channels');
  }

  async createChannel(channel: any) {
    return this.request('/channels', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  }

  async connectChannel(id: string) {
    return this.request(`/channels/${id}/connect`, {
      method: 'PUT',
    });
  }

  // Calendar Events
  async getCalendarEvents() {
    return this.request<any[]>('/calendar/events');
  }

  async createCalendarEvent(event: any) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // WhatsApp Evolution API integration
  async getWhatsAppQRCode(instanceName: string) {
    return this.request<{ qrcode: string }>(`/whatsapp/${instanceName}/qrcode`);
  }

  async getWhatsAppStatus(instanceName: string) {
    return this.request<{ status: string }>(`/whatsapp/${instanceName}/status`);
  }
}

export const apiClient = new ApiClient();