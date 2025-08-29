
import React, { useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { prepareChartData, CHART_COLORS } from "./dashboardUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { TooltipProvider, Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const AgentActivationChart: React.FC = React.memo(() => {
  const chartData = prepareChartData();
  const isMobile = useIsMobile();
  
  // Process data only once using useMemo
  const processedData = useMemo(() => {
    return chartData.agentActivationData.map(item => ({
      ...item,
      fullName: item.name, // Store the full name for tooltips
      name: item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name // Shortened name for display
    }));
  }, [chartData.agentActivationData]);
  
  // Memoize container style based on mobile state
  const containerStyle = useMemo(() => {
    return isMobile ? "h-[280px]" : "h-[320px]";
  }, [isMobile]);
  
  // Custom renderer for the legend to handle long names gracefully
  const renderLegend = useCallback((props: any) => {
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 text-xs">
        {payload.map((entry: any, index: number) => (
          <TooltipProvider key={`legend-${index}`}>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center cursor-help">
                  <div 
                    className="w-3 h-3 rounded-sm mr-1" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span>{entry.value}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{entry.payload.fullName}</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }, []);

  // Custom tooltip formatter - memoized
  const customTooltipFormatter = useCallback((value: number, name: string, props: any) => {
    return [`${value} conversas`, props.payload.fullName];
  }, []);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Ativação dos Agentes</CardTitle>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Distribuição de conversas por agente</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <CardDescription>Conversas por agente</CardDescription>
      </CardHeader>
      <CardContent className={containerStyle}>
        <div className="w-full h-full">
          <ResponsiveContainer width="100%" height={isMobile ? "80%" : "85%"}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false} // Remove direct labels to prevent overlap
                outerRadius={isMobile ? 60 : 80}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={customTooltipFormatter} />
              <Legend 
                content={renderLegend} 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ position: 'absolute', width: '100%', bottom: 0 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

AgentActivationChart.displayName = "AgentActivationChart";
