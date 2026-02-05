import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { fetchHourlyActivity } from "./dashboardUtils";
import { useAuth } from "@/contexts/auth";

const chartConfig = {
  messages: {
    label: "Mensagens",
    color: "hsl(var(--primary))",
  },
};

export const ActivityChart: React.FC = () => {
  const { company } = useAuth();
  const [hourlyData, setHourlyData] = useState<{ hour: string; messages: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = async () => {
    if (!company?.id) return;
    
    setIsLoading(true);
    try {
      const data = await fetchHourlyActivity(company.id);
      setHourlyData(data);
    } catch (error) {
      console.error('Error loading hourly activity:', error);
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

  const totalMessages = hourlyData.reduce((sum, item) => sum + item.messages, 0);
  const hasData = totalMessages > 0;
  
  if (isLoading) {
    return (
      <Card className="shadow-sm border border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Skeleton className="w-full h-64 sm:h-80" />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="shadow-sm border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Mensagens por Hora (Hoje)</CardTitle>
          <CardDescription>Volume de mensagens ao longo do dia</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhuma atividade registrada</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Dados aparecerão conforme mensagens forem recebidas ao longo do dia
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-sm border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Mensagens por Hora (Hoje)</CardTitle>
        <CardDescription>
          {totalMessages.toLocaleString()} mensagens hoje
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="w-full h-64 sm:h-80">
          <ChartContainer config={chartConfig}>
            <AreaChart 
              data={hourlyData} 
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
