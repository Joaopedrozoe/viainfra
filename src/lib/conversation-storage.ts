/**
 * Centralized conversation state management
 * Handles resolved conversations and other conversation-related storage
 */

const RESOLVED_CONVERSATIONS_KEY = 'resolved-conversations';
const PREVIEW_CONVERSATIONS_KEY = 'preview-conversations';

export class ConversationStorage {
  // Resolved conversations management
  static getResolvedConversations(): Set<string> {
    try {
      const saved = localStorage.getItem(RESOLVED_CONVERSATIONS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error('Error loading resolved conversations:', error);
      return new Set();
    }
  }

  static addResolvedConversation(conversationId: string): void {
    try {
      const current = this.getResolvedConversations();
      current.add(conversationId);
      localStorage.setItem(RESOLVED_CONVERSATIONS_KEY, JSON.stringify(Array.from(current)));
      console.log('✅ Conversation resolved and persisted:', conversationId);
    } catch (error) {
      console.error('Error saving resolved conversation:', error);
    }
  }

  static removeResolvedConversation(conversationId: string): void {
    try {
      const current = this.getResolvedConversations();
      current.delete(conversationId);
      localStorage.setItem(RESOLVED_CONVERSATIONS_KEY, JSON.stringify(Array.from(current)));
      console.log('🔄 Conversation unresolve and persisted:', conversationId);
    } catch (error) {
      console.error('Error removing resolved conversation:', error);
    }
  }

  static isConversationResolved(conversationId: string): boolean {
    return this.getResolvedConversations().has(conversationId);
  }

  // Preview conversations management  
  static getPreviewConversations(): any {
    try {
      const saved = localStorage.getItem(PREVIEW_CONVERSATIONS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading preview conversations:', error);
      return {};
    }
  }

  static savePreviewConversations(conversations: any): void {
    try {
      localStorage.setItem(PREVIEW_CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving preview conversations:', error);
    }
  }

  // Clear all conversation data (for logout, etc.)
  static clearAll(): void {
    try {
      localStorage.removeItem(RESOLVED_CONVERSATIONS_KEY);
      localStorage.removeItem(PREVIEW_CONVERSATIONS_KEY);
      console.log('🧹 All conversation storage cleared');
    } catch (error) {
      console.error('Error clearing conversation storage:', error);
    }
  }
}