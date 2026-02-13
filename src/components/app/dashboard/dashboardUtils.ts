import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format, startOfHour, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DashboardMetrics {
  // Conversas
  activeConversations: number;
  totalConversations: number;
  todayMessages: number;
  
  // Performance
  averageResponseTime: number; // em segundos
  firstResponseTime: number; // tempo médio da primeira resposta
  resolutionRate: number; // percentual
  
  // Canais
  connectedChannels: number;
  totalChannels: number;
  
  // Atividade - DADOS REAIS
  hourlyActivity: { hour: string; messages: number }[];
  weeklyTrend: { day: string; date: string; conversations: number; messages: number }[];
  channelDistribution: { name: string; value: number; percentage: number }[];
  
  // Sistema
  apiLatency?: number;
  whatsappStatus?: 'connected' | 'disconnected' | 'error';
  queuedMessages?: number;
}

// Cache para evitar recálculos desnecessários
let cachedMetrics: DashboardMetrics | null = null;
let cachedCompanyId: string | null = null;
let lastCalculation = 0;
const CACHE_DURATION = 30000; // 30 segundos

// =====================================================
// FUNÇÕES ASSÍNCRONAS PARA BUSCAR DADOS REAIS
// =====================================================

export async function fetchConversationStats(companyId: string) {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, status, created_at')
      .eq('company_id', companyId);

    if (error) throw error;

    const total = conversations?.length || 0;
    const open = conversations?.filter(c => c.status === 'open').length || 0;
    const pending = conversations?.filter(c => c.status === 'pending').length || 0;
    const resolved = conversations?.filter(c => c.status === 'resolved').length || 0;
    
    const today = startOfDay(new Date());
    const todayConversations = conversations?.filter(c => 
      new Date(c.created_at) >= today
    ).length || 0;

    return {
      activeConversations: open + pending,
      totalConversations: total,
      resolvedConversations: resolved,
      todayConversations,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0
    };
  } catch (error) {
    console.error('Error fetching conversation stats:', error);
    return {
      activeConversations: 0,
      totalConversations: 0,
      resolvedConversations: 0,
      todayConversations: 0,
      resolutionRate: 0
    };
  }
}

export async function fetchTodayMessages(companyId: string) {
  try {
    const today = startOfDay(new Date()).toISOString();
    
    // Get conversation IDs for this company first
    const { data: companyConvs, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', companyId);

    if (convError) throw convError;
    const convIds = (companyConvs || []).map(c => c.id);
    if (convIds.length === 0) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .gte('created_at', today);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching today messages:', error);
    return 0;
  }
}

export async function fetchHourlyActivity(companyId: string): Promise<{ hour: string; messages: number }[]> {
  try {
    const today = startOfDay(new Date()).toISOString();
    
    // Get conversation IDs for this company
    const { data: companyConvs, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', companyId);

    if (convError) throw convError;
    const convIds = (companyConvs || []).map(c => c.id);

    // Inicializar todas as horas com 0
    const hourlyMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = 0;
    }

    if (convIds.length === 0) {
      return Object.entries(hourlyMap).map(([hour, count]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        messages: count
      }));
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('created_at')
      .in('conversation_id', convIds)
      .gte('created_at', today)
      .order('created_at');

    if (error) throw error;

    messages?.forEach(msg => {
      const hour = getHours(new Date(msg.created_at));
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    });

    return Object.entries(hourlyMap).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      messages: count
    }));
  } catch (error) {
    console.error('Error fetching hourly activity:', error);
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      messages: 0
    }));
  }
}

export async function fetchWeeklyTrend(companyId: string): Promise<{ day: string; date: string; conversations: number; messages: number }[]> {
  try {
    const sevenDaysAgo = subDays(startOfDay(new Date()), 6).toISOString();
    
    // Get conversation IDs for this company
    const { data: companyConvs, error: convIdError } = await supabase
      .from('conversations')
      .select('id')
      .eq('company_id', companyId);

    if (convIdError) throw convIdError;
    const convIds = (companyConvs || []).map(c => c.id);

    // Buscar conversas dos últimos 7 dias (already filtered by company)
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('created_at')
      .eq('company_id', companyId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at');

    if (conversationsError) throw conversationsError;

    // Criar mapa para os últimos 7 dias
    const dailyMap: Record<string, { conversations: number; messages: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dailyMap[dateKey] = { conversations: 0, messages: 0 };
    }

    // Buscar mensagens filtradas por conversas da empresa
    if (convIds.length > 0) {
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('created_at')
        .in('conversation_id', convIds)
        .gte('created_at', sevenDaysAgo)
        .order('created_at');

      if (messagesError) throw messagesError;

      messages?.forEach(msg => {
        const dateKey = format(new Date(msg.created_at), 'yyyy-MM-dd');
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].messages += 1;
        }
      });
    }

    // Contar conversas por dia
    conversations?.forEach(conv => {
      const dateKey = format(new Date(conv.created_at), 'yyyy-MM-dd');
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].conversations += 1;
      }
    });

    return Object.entries(dailyMap).map(([dateKey, data]) => {
      const date = new Date(dateKey + 'T12:00:00');
      return {
        day: format(date, 'EEE', { locale: ptBR }),
        date: format(date, 'dd/MM'),
        conversations: data.conversations,
        messages: data.messages
      };
    });
  } catch (error) {
    console.error('Error fetching weekly trend:', error);
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        day: format(date, 'EEE', { locale: ptBR }),
        date: format(date, 'dd/MM'),
        conversations: 0,
        messages: 0
      };
    });
  }
}

export async function fetchChannelDistribution(companyId: string): Promise<{ name: string; value: number; percentage: number }[]> {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('channel')
      .eq('company_id', companyId);

    if (error) throw error;

    // Contar por canal
    const channelCounts: Record<string, number> = {};
    conversations?.forEach(conv => {
      const channel = conv.channel || 'Desconhecido';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    const total = Object.values(channelCounts).reduce((sum, count) => sum + count, 0);

    // Mapear nomes dos canais para exibição
    const channelNames: Record<string, string> = {
      'whatsapp': 'WhatsApp',
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'telegram': 'Telegram',
      'email': 'E-mail',
      'web': 'Chat Web',
      'website': 'Website'
    };

    return Object.entries(channelCounts).map(([channel, count]) => ({
      name: channelNames[channel] || channel,
      value: count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  } catch (error) {
    console.error('Error fetching channel distribution:', error);
    return [];
  }
}

export async function fetchWhatsAppStatus(companyId: string): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('connection_state')
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return 'disconnected';

    return data.connection_state === 'open' ? 'connected' : 'disconnected';
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    return 'error';
  }
}

export async function fetchQueueStatus(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching queue status:', error);
    return 0;
  }
}

export async function fetchConnectedChannels(companyId: string): Promise<{ connected: number; total: number }> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('id, connection_state')
      .eq('company_id', companyId);

    if (error) throw error;

    const total = data?.length || 0;
    const connected = data?.filter(i => i.connection_state === 'open').length || 0;

    return { connected, total };
  } catch (error) {
    console.error('Error fetching connected channels:', error);
    return { connected: 0, total: 0 };
  }
}

// =====================================================
// FUNÇÃO PRINCIPAL PARA BUSCAR TODAS AS MÉTRICAS
// =====================================================

export async function fetchDashboardMetrics(companyId: string): Promise<DashboardMetrics> {
  const now = Date.now();
  
  // Verificar cache (must match company)
  if (cachedMetrics && cachedCompanyId === companyId && (now - lastCalculation) < CACHE_DURATION) {
    return cachedMetrics;
  }

  try {
    // Executar todas as queries em paralelo
    const [
      conversationStats,
      todayMessages,
      hourlyActivity,
      weeklyTrend,
      channelDistribution,
      whatsappStatus,
      queuedMessages,
      channels
    ] = await Promise.all([
      fetchConversationStats(companyId),
      fetchTodayMessages(companyId),
      fetchHourlyActivity(companyId),
      fetchWeeklyTrend(companyId),
      fetchChannelDistribution(companyId),
      fetchWhatsAppStatus(companyId),
      fetchQueueStatus(),
      fetchConnectedChannels(companyId)
    ]);

    const metrics: DashboardMetrics = {
      activeConversations: conversationStats.activeConversations,
      totalConversations: conversationStats.totalConversations,
      todayMessages,
      averageResponseTime: 0, // Será calculado quando tivermos dados de timing
      firstResponseTime: 0,
      resolutionRate: conversationStats.resolutionRate,
      connectedChannels: channels.connected,
      totalChannels: Math.max(channels.total, 1), // Pelo menos 1 para evitar divisão por zero
      hourlyActivity,
      weeklyTrend,
      channelDistribution,
      whatsappStatus,
      queuedMessages
    };

    // Atualizar cache
    cachedMetrics = metrics;
    cachedCompanyId = companyId;
    lastCalculation = now;

    return metrics;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    
    // Retornar métricas vazias em caso de erro
    return {
      activeConversations: 0,
      totalConversations: 0,
      todayMessages: 0,
      averageResponseTime: 0,
      firstResponseTime: 0,
      resolutionRate: 0,
      connectedChannels: 0,
      totalChannels: 1,
      hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        messages: 0
      })),
      weeklyTrend: Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          day: format(date, 'EEE', { locale: ptBR }),
          date: format(date, 'dd/MM'),
          conversations: 0,
          messages: 0
        };
      }),
      channelDistribution: []
    };
  }
}

// Função para invalidar cache (usado pelo refresh)
export function invalidateDashboardCache(): void {
  cachedMetrics = null;
  cachedCompanyId = null;
  lastCalculation = 0;
}

// =====================================================
// FUNÇÕES LEGADAS (MANTIDAS PARA COMPATIBILIDADE)
// =====================================================

// @deprecated - Use fetchDashboardMetrics instead
export const calculateDashboardMetrics = (isDemoMode: boolean = true, previewConversations: any[] = []): DashboardMetrics => {
  // Retorna métricas vazias - o componente deve usar fetchDashboardMetrics
  return {
    activeConversations: 0,
    totalConversations: 0,
    todayMessages: 0,
    averageResponseTime: 0,
    firstResponseTime: 0,
    resolutionRate: 0,
    connectedChannels: 0,
    totalChannels: 1,
    hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      messages: 0
    })),
    weeklyTrend: Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        day: format(date, 'EEE', { locale: ptBR }),
        date: format(date, 'dd/MM'),
        conversations: 0,
        messages: 0
      };
    }),
    channelDistribution: []
  };
};

// Função para formatar tempo de resposta
export const formatResponseTime = (seconds: number): string => {
  if (seconds === 0) return '--';
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
  if (responseTime === 0) return "text-muted-foreground";
  if (responseTime <= 60) return "text-green-600"; // Excelente
  if (responseTime <= 300) return "text-orange-600"; // Bom
  return "text-red-600"; // Precisa melhorar
};

// Cores para gráficos
export const CHART_COLORS = [
  "hsl(var(--primary))",
  "#6B7280", // gray-500
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
];
