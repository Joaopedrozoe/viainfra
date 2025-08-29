import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { calculateDashboardMetrics, CHART_COLORS } from "./dashboardUtils";

const chartConfig = {
  messages: {
    label: "Mensagens",
  },
};

export const ChannelDistributionChart: React.FC = () => {
  const metrics = calculateDashboardMetrics();
  
  // Preparar dados para o gráfico com cores
  const chartData = metrics.channelDistribution.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Canal</CardTitle>
        <CardDescription>
          Percentual de mensagens por canal
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="w-full h-64 sm:h-80">
          <ChartContainer config={chartConfig}>
            <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => 
                  percentage > 5 ? `${name}: ${percentage.toFixed(1)}%` : ''
                }
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  `${value} mensagens`,
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