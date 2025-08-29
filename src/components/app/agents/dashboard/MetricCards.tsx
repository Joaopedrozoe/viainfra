
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { consolidateAgentMetrics } from "./dashboardUtils";

export const MetricCards: React.FC = () => {
  const metrics = consolidateAgentMetrics();
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base lg:text-lg">Total de Conversas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl lg:text-3xl font-bold">{metrics.totalConversations.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base lg:text-lg">Taxa de Sucesso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl lg:text-3xl font-bold">{metrics.averageSuccessRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base lg:text-lg">Transferências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl lg:text-3xl font-bold">{metrics.totalHumanTransfers.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base lg:text-lg">Taxa de Transferência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl lg:text-3xl font-bold">{metrics.humanTransferRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
};
