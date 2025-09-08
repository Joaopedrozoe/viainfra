import { environment } from './environment';
import { logger } from './logger';

// Production-ready API client para comunicação com o backend Node.js
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

    // Add timeout to request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), environment.API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error details from response
        let error;
        try {
          error = await response.json();
        } catch {
          error = { message: 'Network error' };
        }
        
        // Handle specific HTTP errors
        if (response.status === 401) {
          // Unauthorized - remove invalid token
          this.removeToken();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        if (response.status >= 500) {
          throw new Error('Erro interno do servidor. Tente novamente.');
        }
        
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Tempo limite da requisição excedido');
      }
      
      // Log error only in development
      logger.error('API Request failed:', { url, error: error.message });
      throw error;
    }
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

  async resolveConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}/resolve`, {
      method: 'PUT',
    });
  }

  async assignConversation(conversationId: string, userId: string) {
    return this.request(`/conversations/${conversationId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
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

  async getContactHistory(id: string) {
    return this.request<any[]>(`/contacts/${id}/history`);
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

  async deleteAgent(id: string) {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async getAgentMetrics(id: string) {
    return this.request<any>(`/agents/${id}/metrics`);
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

  async updateChannel(id: string, channel: any) {
    return this.request(`/channels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(channel),
    });
  }

  async deleteChannel(id: string) {
    return this.request(`/channels/${id}`, {
      method: 'DELETE',
    });
  }

  async connectChannel(id: string) {
    return this.request(`/channels/${id}/connect`, {
      method: 'PUT',
    });
  }

  async disconnectChannel(id: string) {
    return this.request(`/channels/${id}/disconnect`, {
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

  async updateCalendarEvent(id: string, event: any) {
    return this.request(`/calendar/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  async deleteCalendarEvent(id: string) {
    return this.request(`/calendar/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Users Management
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async createUser(user: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Departments
  async getDepartments() {
    return this.request<any[]>('/departments');
  }

  async createDepartment(department: any) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
  }

  async updateDepartment(id: string, department: any) {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(department),
    });
  }

  async deleteDepartment(id: string) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics and Metrics
  async getDashboardMetrics() {
    return this.request<any>('/analytics/dashboard');
  }

  async getChannelMetrics() {
    return this.request<any>('/analytics/channels');
  }

  async getAgentPerformance() {
    return this.request<any>('/analytics/agents');
  }

  // WhatsApp Evolution API integration
  async getWhatsAppQRCode(instanceName: string) {
    return this.request<{ qrcode: string }>(`/whatsapp/${instanceName}/qrcode`);
  }

  async getWhatsAppStatus(instanceName: string) {
    return this.request<{ status: string }>(`/whatsapp/${instanceName}/status`);
  }

  async createWhatsAppInstance(instanceName: string, webhookUrl?: string) {
    return this.request(`/whatsapp/instance`, {
      method: 'POST',
      body: JSON.stringify({ instanceName, webhookUrl }),
    });
  }

  async sendWhatsAppMessage(instanceName: string, number: string, message: string) {
    return this.request(`/whatsapp/${instanceName}/send`, {
      method: 'POST',
      body: JSON.stringify({ number, message }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();