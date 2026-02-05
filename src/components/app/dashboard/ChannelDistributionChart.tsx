import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2 } from "lucide-react";
import { fetchChannelDistribution, CHART_COLORS } from "./dashboardUtils";
import { useAuth } from "@/contexts/auth";

const chartConfig = {
  messages: {
    label: "Conversas",
  },
};

export const ChannelDistributionChart: React.FC = () => {
  const { company } = useAuth();
  const [channelData, setChannelData] = useState<{ name: string; value: number; percentage: number; fill?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = async () => {
    if (!company?.id) return;
    
    setIsLoading(true);
    try {
      const data = await fetchChannelDistribution(company.id);
      // Adicionar cores aos dados
      const dataWithColors = data.map((item, index) => ({
        ...item,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }));
      setChannelData(dataWithColors);
    } catch (error) {
      console.error('Error loading channel distribution:', error);
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

  const totalConversations = channelData.reduce((sum, item) => sum + item.value, 0);
  const hasData = channelData.length > 0 && totalConversations > 0;
  
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
          <CardTitle>Distribuição por Canal</CardTitle>
          <CardDescription>Conversas por canal de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center text-center">
            <Share2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhum canal com conversas</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              A distribuição será exibida quando houver conversas em canais ativos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Canal</CardTitle>
        <CardDescription>
          {totalConversations.toLocaleString()} conversas em {channelData.length} canal(is)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="w-full h-64 sm:h-80">
          <ChartContainer config={chartConfig}>
            <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => 
                  percentage > 5 ? `${name}: ${percentage.toFixed(1)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  `${value} conversas`,
                  name
                ]}
                labelFormatter={(label) => `Canal: ${label}`}
              />
              <ChartLegend 
                content={<ChartLegendContent />}
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
