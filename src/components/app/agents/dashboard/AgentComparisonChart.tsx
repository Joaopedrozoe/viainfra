
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { prepareChartData } from "./dashboardUtils";

export const AgentComparisonChart: React.FC = () => {
  const chartData = prepareChartData();
  const isMobile = useIsMobile();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de Agentes</CardTitle>
        <CardDescription>Taxa de sucesso por agente</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "h-[400px] overflow-x-auto" : "h-[300px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData.agentComparisonData.slice(0, isMobile ? 5 : 10)}
            margin={isMobile ? { top: 20, right: 10, left: 0, bottom: 50 } : { top: 20, right: 30, left: 20, bottom: 5 }}
            layout={isMobile ? "vertical" : "horizontal"}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isMobile ? (
              <>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={90} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
              </>
            )}
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId={isMobile ? undefined : "left"} 
              dataKey="successRate" 
              name="Taxa de Sucesso (%)" 
              fill="#9b87f5" 
            />
            <Bar 
              yAxisId={isMobile ? undefined : "right"} 
              dataKey="conversations" 
              name="Total de Conversas" 
              fill="#33C3F0" 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
