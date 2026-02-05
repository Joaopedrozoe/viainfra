import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, Clock, CheckCircle, Share2, TrendingUp, Info } from "lucide-react";
import { fetchDashboardMetrics, formatResponseTime, getPerformanceColor, DashboardMetrics, invalidateDashboardCache } from "./dashboardUtils";
import { useAuth } from "@/contexts/auth";

export const MetricsOverview: React.FC = () => {
  const { company } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadMetrics = async () => {
    if (!company?.id) return;
    
    setIsLoading(true);
    try {
      const data = await fetchDashboardMetrics(company.id);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [company?.id]);
  
  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      invalidateDashboardCache();
      loadMetrics();
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [company?.id]);
  
  if (isLoading || !metrics) {
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
      tooltip: "Conversas com status 'aberto' ou 'pendente'",
      value: metrics.activeConversations.toLocaleString(),
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Mensagens Hoje",
      tooltip: "Total de mensagens recebidas e enviadas hoje",
      value: metrics.todayMessages.toLocaleString(),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
    },
    {
      title: "Tempo de Resposta",
      tooltip: "Média de tempo entre mensagem do cliente e resposta do agente",
      value: formatResponseTime(metrics.averageResponseTime),
      icon: Clock,
      color: getPerformanceColor(metrics.averageResponseTime),
      bgColor: "bg-amber-50 dark:bg-amber-950/30"
    },
    {
      title: "Taxa de Resolução",
      tooltip: "Percentual de conversas resolvidas sobre o total",
      value: `${metrics.resolutionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: metrics.resolutionRate >= 50 ? "text-emerald-600" : "text-amber-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
    },
    {
      title: "Canais Conectados",
      tooltip: "Instâncias WhatsApp ativas sobre o total configurado",
      value: `${metrics.connectedChannels}/${metrics.totalChannels}`,
      icon: Share2,
      color: metrics.connectedChannels > 0 ? "text-violet-600" : "text-muted-foreground",
      bgColor: "bg-violet-50 dark:bg-violet-950/30"
    }
  ];
  
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
        {cards.map((card, index) => (
          <Card key={index} className="shadow-sm border border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {card.title}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{card.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
    </TooltipProvider>
  );
};
