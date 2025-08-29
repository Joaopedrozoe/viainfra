
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { prepareChartData } from "./dashboardUtils";

export const ChannelDistributionChart: React.FC = () => {
  const chartData = prepareChartData();
  const isMobile = useIsMobile();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Canal</CardTitle>
        <CardDescription>Conversas por canal</CardDescription>
      </CardHeader>
      <CardContent className={isMobile ? "h-[250px] overflow-x-auto" : "h-[300px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData.channelData}
            margin={isMobile ? { top: 20, right: 10, left: 10, bottom: 30 } : { top: 20, right: 30, left: 20, bottom: 5 }}
            layout={isMobile ? "vertical" : "horizontal"}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isMobile ? (
              <>
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" />
                <YAxis />
              </>
            )}
            <Tooltip formatter={(value) => [`${value} conversas`, 'Quantidade']} />
            <Legend />
            <Bar dataKey="value" name="Conversas" fill="#B10B28" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
