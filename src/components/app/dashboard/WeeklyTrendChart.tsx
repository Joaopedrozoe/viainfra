import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { calculateDashboardMetrics, DashboardMetrics } from "./dashboardUtils";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useAuth } from "@/contexts/auth";

const chartConfig = {
  conversations: {
    label: "Conversas",
    color: "hsl(var(--primary))",
  },
  messages: {
    label: "Mensagens", 
    color: "#6B7280", // gray-500 (cinza mais escuro)
  },
};

export const WeeklyTrendChart: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadMetrics = () => {
      setIsLoading(true);
      try {
        const calculatedMetrics = calculateDashboardMetrics(isDemoMode, [], profile?.company_id);
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMetrics();
  }, [isDemoMode, profile?.company_id]);
  
  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setIsLoading(true);
      try {
        const calculatedMetrics = calculateDashboardMetrics(isDemoMode, [], profile?.company_id);
        setMetrics(calculatedMetrics);
      } catch (error) {
        console.error('Error refreshing metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [isDemoMode, profile?.company_id]);
  
  if (isLoading || !metrics || !metrics.weeklyTrend) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência Semanal</CardTitle>
          <CardDescription>Conversas e mensagens dos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="w-full h-64 sm:h-80 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência Semanal</CardTitle>
        <CardDescription>
          Conversas e mensagens dos últimos 7 dias
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="w-full h-64 sm:h-80">
          <ChartContainer config={chartConfig}>
            <LineChart 
              data={metrics.weeklyTrend} 
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                tick={{ fontSize: 11 }}
                axisLine={false}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="conversations"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#6B7280"
                strokeWidth={2}
                dot={{ fill: "#6B7280", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};