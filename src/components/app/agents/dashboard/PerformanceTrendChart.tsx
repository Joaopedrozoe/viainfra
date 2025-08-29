
import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { prepareChartData } from "./dashboardUtils";

export const PerformanceTrendChart: React.FC = React.memo(() => {
  const chartData = prepareChartData();
  const isMobile = useIsMobile();
  
  // Memoize margin calculations to avoid recalculating on every render
  const chartMargins = useMemo(() => {
    return isMobile ? 
      { top: 5, right: 10, left: 10, bottom: 15 } : 
      { top: 5, right: 30, left: 0, bottom: 25 };
  }, [isMobile]);

  // Memoize style properties
  const containerStyle = useMemo(() => {
    return isMobile ? "h-[220px] overflow-x-auto pb-6" : "h-[300px] pb-6";
  }, [isMobile]);
  
  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle>Tendência de Performance (7 dias)</CardTitle>
        <CardDescription>Taxa de sucesso e transferências humanas</CardDescription>
      </CardHeader>
      <CardContent 
        className={containerStyle}
      >
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData.performanceTrendData}
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                dy={isMobile ? 0 : 5}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left"
                tick={{ fontSize: isMobile ? 10 : 11 }}
                width={35}
                tickCount={5}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: isMobile ? 10 : 11 }}
                width={35}
                tickCount={5}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip />
              <Legend 
                wrapperStyle={isMobile ? { fontSize: '10px' } : { fontSize: '12px' }}
                height={30}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="successRate"
                name="Taxa de Sucesso (%)"
                stroke="#10b981"
                activeDot={{ r: 5 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humanTransfers"
                name="Transferências Humanas"
                stroke="#f43f5e"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

PerformanceTrendChart.displayName = "PerformanceTrendChart";
