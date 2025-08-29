import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, CheckCircle, Share2, TrendingUp } from "lucide-react";
import { calculateDashboardMetrics, formatResponseTime, getPerformanceColor, DashboardMetrics } from "./dashboardUtils";
import { useDemoMode } from "@/hooks/useDemoMode";

export const MetricsOverview: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadMetrics = () => {
      setIsLoading(true);
      try {
        const calculatedMetrics = calculateDashboardMetrics(isDemoMode);
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMetrics();
  }, [isDemoMode]);
  
  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setIsLoading(true);
      try {
        const calculatedMetrics = calculateDashboardMetrics(isDemoMode);
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error('Error refreshing metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [isDemoMode]);
  
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Mensagens Hoje",
      value: metrics.todayMessages.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Tempo de Resposta",
      value: formatResponseTime(metrics.averageResponseTime),
      icon: Clock,
      color: getPerformanceColor(metrics.averageResponseTime),
      bgColor: "bg-yellow-50"
    },
    {
      title: "Taxa de Resolução",
      value: `${metrics.resolutionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Canais Online",
      value: `${metrics.connectedChannels}/${metrics.totalChannels}`,
      icon: Share2,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
              {card.title}
            </CardTitle>
            <div className={`p-1.5 sm:p-2 rounded-md ${card.bgColor} flex-shrink-0`}>
              <card.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className={`text-lg sm:text-2xl font-bold ${card.color} truncate`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};