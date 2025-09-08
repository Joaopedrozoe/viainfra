// Environment configuration for production deployment
export const environment = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  // Evolution API Configuration (WhatsApp)
  EVOLUTION_API_URL: import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080',
  
  // Environment
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  
  // Feature flags
  isProduction: import.meta.env.VITE_APP_ENV === 'production',
  isDevelopment: import.meta.env.VITE_APP_ENV === 'development',
  
  // API endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      me: '/auth/me',
      logout: '/auth/logout'
    },
    conversations: '/conversations',
    messages: '/messages',
    contacts: '/contacts',
    agents: '/agents',
    channels: '/channels',
    calendar: '/calendar/events',
    whatsapp: '/whatsapp'
  }
};

export default environment;