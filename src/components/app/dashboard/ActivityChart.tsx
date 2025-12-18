import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { calculateDashboardMetrics, DashboardMetrics } from "./dashboardUtils";
import { useDemoMode } from "@/hooks/useDemoMode";

const chartConfig = {
  messages: {
    label: "Mensagens",
    color: "hsl(var(--primary))",
  },
};

export const ActivityChart: React.FC = () => {
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
  
  if (isLoading || !metrics || !metrics.hourlyActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade nas Últimas 24 Horas</CardTitle>
          <CardDescription>Volume de mensagens por hora</CardDescription>
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
        <CardTitle>Atividade nas Últimas 24 Horas</CardTitle>
        <CardDescription>
          Volume de mensagens por hora
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="w-full h-64 sm:h-80">
          <ChartContainer config={chartConfig}>
            <AreaChart 
              data={metrics.hourlyActivity} 
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
                className="text-xs"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                axisLine={false}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(value) => `${value}`}
              />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorMessages)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};