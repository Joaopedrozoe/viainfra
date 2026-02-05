import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { fetchWeeklyTrend } from "./dashboardUtils";
import { useAuth } from "@/contexts/auth";

const chartConfig = {
  conversations: {
    label: "Conversas",
    color: "hsl(var(--primary))",
  },
  messages: {
    label: "Mensagens", 
    color: "#6B7280", // gray-500
  },
};

export const WeeklyTrendChart: React.FC = () => {
  const { company } = useAuth();
  const [weeklyData, setWeeklyData] = useState<{ day: string; date: string; conversations: number; messages: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = async () => {
    if (!company?.id) return;
    
    setIsLoading(true);
    try {
      const data = await fetchWeeklyTrend(company.id);
      setWeeklyData(data);
    } catch (error) {
      console.error('Error loading weekly trend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.id]);
  
  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [company?.id]);

  const totalMessages = weeklyData.reduce((sum, item) => sum + item.messages, 0);
  const totalConversations = weeklyData.reduce((sum, item) => sum + item.conversations, 0);
  const hasData = totalMessages > 0 || totalConversations > 0;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <Skeleton className="w-full h-64 sm:h-80" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico dos Últimos 7 Dias</CardTitle>
          <CardDescription>Evolução de conversas e mensagens</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Sem histórico recente</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              O histórico será exibido conforme atividades forem registradas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico dos Últimos 7 Dias</CardTitle>
        <CardDescription>
          {totalConversations.toLocaleString()} conversas • {totalMessages.toLocaleString()} mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="w-full h-64 sm:h-80">
          <ChartContainer config={chartConfig}>
            <LineChart 
              data={weeklyData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
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
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(_, payload) => {
                  if (payload?.[0]?.payload) {
                    return `${payload[0].payload.day} (${payload[0].payload.date})`;
                  }
                  return '';
                }}
              />
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
