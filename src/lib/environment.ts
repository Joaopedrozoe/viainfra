// Environment configuration for production deployment
export const environment = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  // Evolution API Configuration (WhatsApp)
  EVOLUTION_API_URL: import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
  
  // Environment
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  
  // Optional configurations
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  ASSETS_URL: import.meta.env.VITE_ASSETS_URL || '',
  ANALYTICS_KEY: import.meta.env.VITE_ANALYTICS_KEY || '',
  
  // Feature flags
  isProduction: import.meta.env.VITE_APP_ENV === 'production',
  isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
  
  // API endpoints - paths relativos que serão combinados com API_URL
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      me: '/auth/me',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      verify: '/auth/verify'
    },
    conversations: '/conversations',
    messages: '/messages',
    contacts: '/contacts',
    agents: '/agents',
    channels: '/channels',
    calendar: '/calendar/events',
    whatsapp: '/whatsapp',
    companies: '/companies',
    users: '/users',
    departments: '/departments',
    permissions: '/permissions',
    analytics: '/analytics',
    health: '/health'
  },
  
  // WhatsApp/Evolution API specific settings
  whatsapp: {
    defaultTimeout: 30000,
    retryAttempts: 3,
    webhookEvents: [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'MESSAGES_DELETE',
      'SEND_MESSAGE',
      'CONNECTION_UPDATE',
      'CALL',
      'NEW_JWT_TOKEN'
    ]
  }
};

export default environment;