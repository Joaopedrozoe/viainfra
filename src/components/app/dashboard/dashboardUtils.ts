import { getDemoConversations } from "@/data/mockConversations";
import { getDemoChannelsExpanded } from "@/data/mockChannelsExpanded";

export interface DashboardMetrics {
  // Conversas
  activeConversations: number;
  totalConversations: number;
  todayMessages: number;
  
  // Performance
  averageResponseTime: number; // em segundos
  resolutionRate: number; // percentual
  
  // Canais
  connectedChannels: number;
  totalChannels: number;
  
  // Atividade
  hourlyActivity: { hour: string; messages: number }[];
  weeklyTrend: { day: string; conversations: number; messages: number }[];
  channelDistribution: { name: string; value: number; percentage: number }[];
}

// Cache para evitar recálculos desnecessários
let cachedMetrics: DashboardMetrics | null = null;
let lastCalculation = 0;
const CACHE_DURATION = 30000; // 30 segundos

export const calculateDashboardMetrics = (): DashboardMetrics => {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (cachedMetrics && (now - lastCalculation) < CACHE_DURATION) {
    return cachedMetrics;
  }
  
  const conversations = getDemoConversations();
  const channels = getDemoChannelsExpanded();
  
  // Conversas ativas (simulado - consideramos conversas com unread > 0 como ativas)
  const activeConversations = conversations.filter(c => c.unread > 0).length;
  const totalConversations = conversations.length;
  
  // Mensagens hoje (simulado baseado nos canais)
  const todayMessages = channels.reduce((sum, channel) => sum + channel.metrics.todayMessages, 0);
  
  // Tempo médio de resposta (dos canais conectados)
  const connectedChannels = channels.filter(c => c.status === 'connected');
  const averageResponseTime = connectedChannels.length > 0 
    ? connectedChannels.reduce((sum, c) => sum + c.metrics.responseTime, 0) / connectedChannels.length
    : 0;
  
  // Taxa de resolução (simulada - consideramos conversas com unread = 0 como resolvidas)
  const resolvedConversations = conversations.filter(c => c.unread === 0).length;
  const resolutionRate = totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0;
  
  // Distribuição por canal
  const channelCounts = channels.reduce((acc, channel) => {
    acc[channel.name] = channel.metrics.totalMessages;
    return acc;
  }, {} as Record<string, number>);
  
  const totalChannelMessages = Object.values(channelCounts).reduce((sum, count) => sum + count, 0);
  const channelDistribution = Object.entries(channelCounts).map(([name, value]) => ({
    name,
    value,
    percentage: totalChannelMessages > 0 ? (value / totalChannelMessages) * 100 : 0
  }));
  
  // Atividade por hora (últimas 24h - simulada)
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    // Simula padrão realista: mais atividade durante horário comercial
    let messages = Math.random() * 20;
    if (i >= 9 && i <= 18) {
      messages = Math.random() * 50 + 30; // Horário comercial
    } else if (i >= 19 && i <= 22) {
      messages = Math.random() * 30 + 10; // Noite
    } else {
      messages = Math.random() * 10; // Madrugada
    }
    return {
      hour: `${hour}:00`,
      messages: Math.round(messages)
    };
  });
  
  // Tendência semanal (últimos 7 dias - simulada)
  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    
    // Simula padrão semanal: menos atividade nos fins de semana
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseConversations = isWeekend ? 15 : 35;
    const baseMessages = isWeekend ? 80 : 180;
    
    return {
      day: dayName,
      conversations: Math.round(baseConversations + (Math.random() * 20)),
      messages: Math.round(baseMessages + (Math.random() * 100))
    };
  });
  
  const metrics: DashboardMetrics = {
    activeConversations,
    totalConversations,
    todayMessages,
    averageResponseTime,
    resolutionRate,
    connectedChannels: connectedChannels.length,
    totalChannels: channels.length,
    hourlyActivity,
    weeklyTrend,
    channelDistribution
  };
  
  // Atualiza cache
  cachedMetrics = metrics;
  lastCalculation = now;
  
  return metrics;
};

// Função para formatar tempo de resposta
export const formatResponseTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}min`;
  } else {
    return `${Math.round(seconds / 3600)}h`;
  }
};

// Função para determinar cor baseada na performance
export const getPerformanceColor = (responseTime: number): string => {
  if (responseTime <= 60) return "text-green-600"; // Excelente
  if (responseTime <= 300) return "text-orange-600"; // Bom (mudei de yellow para orange)
  return "text-red-600"; // Precisa melhorar
};

// Cores para gráficos
export const CHART_COLORS = [
  "hsl(var(--primary))",
  "#6B7280", // gray-500 (cinza mais escuro)
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
];