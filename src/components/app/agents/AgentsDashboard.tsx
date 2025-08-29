
import React, { useMemo } from "react";
import { MetricCards } from "./dashboard/MetricCards";
import { PerformanceTrendChart } from "./dashboard/PerformanceTrendChart";
import { AgentActivationChart } from "./dashboard/AgentActivationChart";
import { ChannelDistributionChart } from "./dashboard/ChannelDistributionChart";
import { AgentComparisonChart } from "./dashboard/AgentComparisonChart";
import { prepareChartData } from "./dashboard/dashboardUtils";
import { AgentsDashboardProps } from "./AgentsDashboardProps";

export const AgentsDashboard: React.FC<AgentsDashboardProps> = ({ agents, isLoading }) => {
  // Centralize data preparation at dashboard level
  // This ensures we only calculate the data once for all child components
  useMemo(() => {
    // Pre-warm the cache by calling prepareChartData() once at the dashboard level
    prepareChartData();
  }, []);
  
  if (isLoading) {
    return <div className="p-8 text-center">Carregando dashboard...</div>;
  }
  
  if (agents.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum agente encontrado
        </h3>
        <p className="text-gray-500 mb-6">
          Você ainda não tem nenhum agente AI configurado para mostrar no dashboard.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-10">
      {/* Summary metrics */}
      <MetricCards />
      
      {/* Performance trend chart */}
      <div className="mb-8">
        <PerformanceTrendChart />
      </div>
      
      {/* Two column layout, responsive for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Agent activation chart */}
        <AgentActivationChart />
        
        {/* Channel distribution chart */}
        <ChannelDistributionChart />
      </div>
      
      {/* Agent comparison */}
      <div className="mt-8">
        <AgentComparisonChart />
      </div>
    </div>
  );
};

AgentsDashboard.displayName = "AgentsDashboard";
