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

const PAGE = 1000;
const MAX_PAGES = 30;

// Mensagens da empresa via join (sem lista gigante de IDs e sem limite de 1000 linhas)
async function fetchCompanyMessagesSince(companyId: string, sinceIso: string) {
  const rows: { conversation_id: string | null; sender_type: string; created_at: string }[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id, sender_type, created_at, conversations!inner(company_id)')
      .eq('conversations.company_id', companyId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    rows.push(...((data || []) as any[]).map(r => ({ conversation_id: r.conversation_id, sender_type: r.sender_type, created_at: r.created_at })));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function countConversations(companyId: string, status?: string[]) {
  let q = supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
  if (status) q = q.in('status', status);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

export async function fetchConversationStats(companyId: string) {
  try {
    const today = startOfDay(new Date()).toISOString();
    const [total, active, resolved, todayRes] = await Promise.all([
      countConversations(companyId),
      countConversations(companyId, ['open', 'pending']),
      countConversations(companyId, ['resolved']),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', today),
    ]);
    return {
      activeConversations: active,
      totalConversations: total,
      resolvedConversations: resolved,
      todayConversations: todayRes.count || 0,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0
    };
  } catch (error) {
    console.error('Error fetching conversation stats:', error);
    return { activeConversations: 0, totalConversations: 0, resolvedConversations: 0, todayConversations: 0, resolutionRate: 0 };
  }
}

export async function fetchTodayMessages(companyId: string) {
  try {
    const today = startOfDay(new Date()).toISOString();
    const { count, error } = await supabase
      .from('messages')
      .select('id, conversations!inner(company_id)', { count: 'exact', head: true })
      .eq('conversations.company_id', companyId)
      .gte('created_at', today);
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching today messages:', error);
    return 0;
  }
}

/** Tempo médio (s) entre mensagem do cliente e a próxima resposta da equipe, hoje. */
export function computeAverageResponseTime(rows: { conversation_id: string | null; sender_type: string; created_at: string }[]): number {
  const pending = new Map<string, number>();
  let sum = 0, n = 0;
  for (const r of rows) {
    if (!r.conversation_id) continue;
    const ts = new Date(r.created_at).getTime();
    if (r.sender_type === 'user') {
      if (!pending.has(r.conversation_id)) pending.set(r.conversation_id, ts);
    } else if (r.sender_type === 'agent') {
      const start = pending.get(r.conversation_id);
      if (start !== undefined) {
        const gap = (ts - start) / 1000;
        if (gap >= 0 && gap <= 86400) { sum += gap; n++; }
        pending.delete(r.conversation_id);
      }
    }
  }
  return n > 0 ? sum / n : 0;
}

export async function fetchTodayResponseTime(companyId: string) {
  try {
    const rows = await fetchCompanyMessagesSince(companyId, startOfDay(new Date()).toISOString());
    return computeAverageResponseTime(rows);
  } catch (error) {
    console.error('Error fetching response time:', error);
    return 0;
  }
}

export async function fetchHourlyActivity(companyId: string): Promise<{ hour: string; messages: number }[]> {
  const hourlyMap: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourlyMap[i] = 0;
  try {
    const messages = await fetchCompanyMessagesSince(companyId, startOfDay(new Date()).toISOString());
    messages.forEach(msg => { hourlyMap[getHours(new Date(msg.created_at))] += 1; });
  } catch (error) {
    console.error('Error fetching hourly activity:', error);
  }
  return Object.entries(hourlyMap).map(([hour, count]) => ({ hour: `${hour.padStart(2, '0')}:00`, messages: count }));
}

export async function fetchWeeklyTrend(companyId: string): Promise<{ day: string; date: string; conversations: number; messages: number }[]> {
  const dailyMap: Record<string, { conversations: number; messages: number }> = {};
  for (let i = 6; i >= 0; i--) dailyMap[format(subDays(new Date(), i), 'yyyy-MM-dd')] = { conversations: 0, messages: 0 };
  try {
    const sevenDaysAgo = subDays(startOfDay(new Date()), 6).toISOString();
    const [messages, convRes] = await Promise.all([
      fetchCompanyMessagesSince(companyId, sevenDaysAgo),
      supabase.from('conversations').select('created_at').eq('company_id', companyId).gte('created_at', sevenDaysAgo).limit(5000),
    ]);
    if (convRes.error) throw convRes.error;
    messages.forEach(m => { const k = format(new Date(m.created_at), 'yyyy-MM-dd'); if (dailyMap[k]) dailyMap[k].messages += 1; });
    (convRes.data || []).forEach(c => { const k = format(new Date(c.created_at), 'yyyy-MM-dd'); if (dailyMap[k]) dailyMap[k].conversations += 1; });
  } catch (error) {
    console.error('Error fetching weekly trend:', error);
  }
  return Object.entries(dailyMap).map(([dateKey, data]) => {
    const date = new Date(dateKey + 'T12:00:00');
    return { day: format(date, 'EEE', { locale: ptBR }), date: format(date, 'dd/MM'), ...data };
  });
}

export async function fetchChannelDistribution(companyId: string): Promise<{ name: string; value: number; percentage: number }[]> {
  try {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('channel')
      .eq('company_id', companyId)
      .limit(10000);

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
      fetchConnectedChannels(companyId),
    ]);
    const averageResponseTime = await fetchTodayResponseTime(companyId);

    const metrics: DashboardMetrics = {
      activeConversations: conversationStats.activeConversations,
      totalConversations: conversationStats.totalConversations,
      todayMessages,
      averageResponseTime,
      firstResponseTime: 0,
      resolutionRate: conversationStats.resolutionRate,
      connectedChannels: channels.connected,
      totalChannels: channels.total,
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
