import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Clock, CheckCircle, Share2, TrendingUp } from "lucide-react";
import { calculateDashboardMetrics, formatResponseTime, getPerformanceColor, DashboardMetrics } from "./dashboardUtils";
import { useDemoMode } from "@/hooks/useDemoMode";
import { usePreviewConversation } from "@/contexts/PreviewConversationContext";
import { useConversations } from "@/hooks/useConversations";

export const MetricsOverview: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const { previewConversations } = usePreviewConversation();
  const { conversations: supabaseConversations, loading } = useConversations();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  
  useEffect(() => {
    if (loading) return;
    
    try {
      // Usar apenas conversas do preview para os cálculos, 
      // mas considerar conversas reais do Supabase para métricas
      const calculatedMetrics = calculateDashboardMetrics(isDemoMode, previewConversations);
      
      // Sobrescrever métricas com dados reais se houver conversas do Supabase
      if (supabaseConversations.length > 0) {
        const activeCount = supabaseConversations.filter(c => c.status === 'open' || c.status === 'pending').length;
        const resolvedCount = supabaseConversations.filter(c => c.status === 'resolved').length;
        const totalMessages = supabaseConversations.filter(c => c.lastMessage).length; // Count conversations with messages
        
        calculatedMetrics.activeConversations = activeCount;
        calculatedMetrics.todayMessages = totalMessages;
        calculatedMetrics.resolutionRate = supabaseConversations.length > 0 
          ? (resolvedCount / supabaseConversations.length) * 100 
          : 0;
      }
      
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [isDemoMode, previewConversations, supabaseConversations, loading]);
  
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="shadow-sm border border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const cards = [
    {
      title: "Conversas Ativas",
      value: metrics.activeConversations.toLocaleString(),
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Mensagens Hoje",
      value: metrics.todayMessages.toLocaleString(),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
    },
    {
      title: "Tempo de Resposta",
      value: formatResponseTime(metrics.averageResponseTime),
      icon: Clock,
      color: getPerformanceColor(metrics.averageResponseTime),
      bgColor: "bg-amber-50 dark:bg-amber-950/30"
    },
    {
      title: "Taxa de Resolução",
      value: `${metrics.resolutionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
    },
    {
      title: "Canais Online",
      value: `${metrics.connectedChannels}/${metrics.totalChannels}`,
      icon: Share2,
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-950/30"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-sm border border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
              {card.title}
            </CardTitle>
            <div className={`p-2 sm:p-2.5 rounded-lg ${card.bgColor} flex-shrink-0`}>
              <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className={`text-xl sm:text-3xl font-bold ${card.color} truncate`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};