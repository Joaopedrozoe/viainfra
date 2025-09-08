import { getDemoChannelsExpanded } from "@/data/mockChannelsExpanded";
import { apiClient } from "@/lib/api-client";
import { useDemoMode } from "@/hooks/useDemoMode";

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

export const calculateDashboardMetrics = (isDemoMode: boolean = true, previewConversations: any[] = []): DashboardMetrics => {
  const now = Date.now();
  
  // Limpa cache para forçar recálculo sempre (temporário para garantir dados zerados)
  cachedMetrics = null;
  
  let conversations: any[] = previewConversations || [];
  let channels: any[] = [];
  
  // Usar previewConversations se fornecidas
  if (previewConversations.length > 0) {
    conversations = previewConversations;
  }
  
  if (isDemoMode) {
    // No modo demo, usa os mesmos dados zerados da página de canais
    channels = getDemoChannelsExpanded().map(channel => {
      // Aplica a mesma lógica da página de canais - sem API real = desconectado
      const hasRealApiConnection = false; // mesmo valor da função checkRealApiConnection
      
      if (!hasRealApiConnection) {
        return {
          ...channel,
          status: 'disconnected',
          metrics: {
            ...channel.metrics,
            totalMessages: conversations.length > 0 ? Math.round(Math.random() * 100) : 0,
            todayMessages: conversations.length > 0 ? Math.round(Math.random() * 20) : 0,
            responseTime: conversations.length > 0 ? Math.round(Math.random() * 60) : 0,
            lastActivity: conversations.length > 0 ? new Date().toISOString() : '',
            deliveryRate: conversations.length > 0 ? 95 + Math.round(Math.random() * 5) : 0,
            errorRate: conversations.length > 0 ? Math.round(Math.random() * 3) : 0
          }
        };
      }
      return channel;
    });
  } else {
    // Para dados reais, retorna dados básicos (sem fetch async por enquanto)
    channels = getDemoChannelsExpanded().map(channel => ({
      ...channel,
      status: 'disconnected',
      metrics: {
        ...channel.metrics,
        totalMessages: conversations.length > 0 ? Math.round(Math.random() * 100) : 0,
        todayMessages: conversations.length > 0 ? Math.round(Math.random() * 20) : 0,
        responseTime: conversations.length > 0 ? Math.round(Math.random() * 60) : 0,
        lastActivity: conversations.length > 0 ? new Date().toISOString() : '',
        deliveryRate: conversations.length > 0 ? 95 + Math.round(Math.random() * 5) : 0,
        errorRate: conversations.length > 0 ? Math.round(Math.random() * 3) : 0
      }
    }));
  }
  
  // Conversas ativas (consideramos conversas com unread > 0 como ativas)
  const activeConversations = conversations.filter(c => c.unread && c.unread > 0).length;
  const totalConversations = conversations.length;
  
  // Mensagens hoje - zerado quando não há conversas
  const todayMessages = conversations.length > 0 ? channels.reduce((sum, channel) => {
    const messages = channel.metrics?.todayMessages || channel.today_messages || 0;
    return sum + (typeof messages === 'number' ? messages : 0);
  }, 0) : 0;
  
  // Tempo médio de resposta (dos canais conectados)
  const connectedChannels = channels.filter(c => c.status === 'connected');
  const averageResponseTime = conversations.length > 0 && connectedChannels.length > 0 
    ? connectedChannels.reduce((sum, c) => {
        const responseTime = c.metrics?.responseTime || c.response_time || 0;
        return sum + (typeof responseTime === 'number' ? responseTime : 0);
      }, 0) / connectedChannels.length
    : 0;
  
  // Taxa de resolução (conversas com unread = 0 como resolvidas)
  const resolvedConversations = conversations.filter(c => !c.unread || c.unread === 0).length;
  const resolutionRate = totalConversations > 0 ? (resolvedConversations / totalConversations) * 100 : 0;
  
  // Distribuição por canal - zerado quando não há conversas
  const channelCounts = conversations.length > 0 ? channels.reduce((acc, channel) => {
    const name = channel.name || channel.type || 'Desconhecido';
    const totalMessages = channel.metrics?.totalMessages || channel.total_messages || 0;
    acc[name] = typeof totalMessages === 'number' ? totalMessages : 0;
    return acc;
  }, {} as Record<string, number>) : {};
  
  const totalChannelMessages = Object.values(channelCounts).reduce((sum: number, count: number) => sum + count, 0);
  const channelDistribution = Object.entries(channelCounts).map(([name, value]) => ({
    name,
    value: Number(value),
    percentage: Number(totalChannelMessages) > 0 ? (Number(value) / Number(totalChannelMessages)) * 100 : 0
  }));
  
  // Atividade por hora - zerado quando não há conversas
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return {
      hour: `${hour}:00`,
      messages: conversations.length > 0 ? Math.round(Math.random() * (i >= 9 && i <= 18 ? 50 : 10)) : 0
    };
  });
  
  // Tendência semanal - zerado quando não há conversas
  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    
    return {
      day: dayName,
      conversations: conversations.length > 0 ? Math.round(Math.random() * 20 + 10) : 0,
      messages: conversations.length > 0 ? Math.round(Math.random() * 100 + 50) : 0
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