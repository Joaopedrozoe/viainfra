// Validation utilities for production environment

export const validateApiConnection = (config: any): boolean => {
  if (!config) return false;
  
  // Check for required fields based on integration type
  switch (config.type) {
    case 'whatsapp':
      return !!(config.token && config.phoneNumberId && config.webhookUrl);
    case 'evolution':
      return !!(config.apiKey && config.instanceName && config.baseUrl);
    default:
      return false;
  }
};

export const validateChannelConfig = (channel: any): boolean => {
  if (!channel.name || !channel.type) return false;
  
  // Validate integration config
  if (!validateApiConnection(channel.integration)) return false;
  
  return true;
};

export const validateContactData = (contact: any): boolean => {
  return !!(contact.name && (contact.phone || contact.email));
};

export const validateBotConfig = (bot: any): boolean => {
  if (!bot.name || !bot.flows) return false;
  
  // Check if bot has at least one start node
  const hasStartNode = bot.flows.nodes?.some((node: any) => node.type === 'start');
  if (!hasStartNode) return false;
  
  return true;
};

export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if missing (assumes Brazil +55)
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }
  
  return cleaned;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};