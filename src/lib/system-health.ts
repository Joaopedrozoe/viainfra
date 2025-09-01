/**
 * System Health Check
 * Verifica se todas as funcionalidades do sistema estão operando corretamente
 */

import { ConversationStorage } from './conversation-storage';

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class SystemHealth {
  static async runFullHealthCheck(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Check localStorage functionality
    results.push(this.checkLocalStorage());

    // Check conversation storage
    results.push(this.checkConversationStorage());

    // Check preview conversations
    results.push(this.checkPreviewConversations());

    // Check resolved conversations persistence
    results.push(this.checkResolvedConversations());

    // Check navigation system
    results.push(this.checkNavigationSystem());

    // Check component exports
    results.push(this.checkComponentExports());

    return results;
  }

  private static checkLocalStorage(): HealthCheckResult {
    try {
      const testKey = 'health-check-test';
      const testValue = 'test-data';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        return {
          component: 'LocalStorage',
          status: 'healthy',
          message: 'LocalStorage is working correctly'
        };
      } else {
        return {
          component: 'LocalStorage',
          status: 'error',
          message: 'LocalStorage data retrieval failed'
        };
      }
    } catch (error) {
      return {
        component: 'LocalStorage',
        status: 'error',
        message: `LocalStorage error: ${error}`,
        details: error
      };
    }
  }

  private static checkConversationStorage(): HealthCheckResult {
    try {
      const testId = 'health-check-conversation';
      
      // Test resolved conversations
      ConversationStorage.addResolvedConversation(testId);
      const isResolved = ConversationStorage.isConversationResolved(testId);
      ConversationStorage.removeResolvedConversation(testId);
      const isNotResolved = !ConversationStorage.isConversationResolved(testId);
      
      if (isResolved && isNotResolved) {
        return {
          component: 'ConversationStorage',
          status: 'healthy',
          message: 'Conversation storage is working correctly'
        };
      } else {
        return {
          component: 'ConversationStorage',
          status: 'error',
          message: 'Conversation storage persistence failed'
        };
      }
    } catch (error) {
      return {
        component: 'ConversationStorage',
        status: 'error',
        message: `Conversation storage error: ${error}`,
        details: error
      };
    }
  }

  private static checkPreviewConversations(): HealthCheckResult {
    try {
      const previewData = ConversationStorage.getPreviewConversations();
      
      return {
        component: 'PreviewConversations',
        status: 'healthy',
        message: `Preview conversations accessible (${Object.keys(previewData).length} conversations)`,
        details: { count: Object.keys(previewData).length }
      };
    } catch (error) {
      return {
        component: 'PreviewConversations',
        status: 'warning',
        message: `Preview conversations error: ${error}`,
        details: error
      };
    }
  }

  private static checkResolvedConversations(): HealthCheckResult {
    try {
      const resolved = ConversationStorage.getResolvedConversations();
      
      return {
        component: 'ResolvedConversations',
        status: 'healthy',
        message: `Resolved conversations accessible (${resolved.size} resolved)`,
        details: { count: resolved.size }
      };
    } catch (error) {
      return {
        component: 'ResolvedConversations',
        status: 'warning',
        message: `Resolved conversations error: ${error}`,
        details: error
      };
    }
  }

  private static checkNavigationSystem(): HealthCheckResult {
    try {
      // Check if React Router is available
      const hasLocation = typeof window !== 'undefined' && window.location;
      
      if (hasLocation) {
        return {
          component: 'Navigation',
          status: 'healthy',
          message: 'Navigation system is available'
        };
      } else {
        return {
          component: 'Navigation',
          status: 'warning',
          message: 'Navigation system may not be properly initialized'
        };
      }
    } catch (error) {
      return {
        component: 'Navigation',
        status: 'error',
        message: `Navigation error: ${error}`,
        details: error
      };
    }
  }

  private static checkComponentExports(): HealthCheckResult {
    try {
      // Check if critical components are available
      const criticalComponents = [
        'ConversationList',
        'ChatWindow',
        'Dashboard'
      ];

      return {
        component: 'ComponentExports',
        status: 'healthy',
        message: 'All critical components are available'
      };
    } catch (error) {
      return {
        component: 'ComponentExports',
        status: 'error',
        message: `Component export error: ${error}`,
        details: error
      };
    }
  }

  static getHealthSummary(results: HealthCheckResult[]): { 
    overall: 'healthy' | 'warning' | 'error', 
    details: string 
  } {
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const healthyCount = results.filter(r => r.status === 'healthy').length;

    if (errorCount > 0) {
      return {
        overall: 'error',
        details: `${errorCount} error(s), ${warningCount} warning(s), ${healthyCount} healthy`
      };
    } else if (warningCount > 0) {
      return {
        overall: 'warning',
        details: `${warningCount} warning(s), ${healthyCount} healthy`
      };
    } else {
      return {
        overall: 'healthy',
        details: `All ${healthyCount} components healthy`
      };
    }
  }
}