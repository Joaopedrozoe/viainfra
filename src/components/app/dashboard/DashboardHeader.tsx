import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { invalidateDashboardCache } from "./dashboardUtils";

export const DashboardHeader: React.FC = () => {
  const { profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidar cache e forçar refresh
      invalidateDashboardCache();
      
      // Disparar evento customizado para todos os componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      }
      
      // Pequeno delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Olá, {profile?.name || 'Usuário'}! 👋
          </h1>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 text-xs font-normal">
            <Activity className="h-3 w-3 text-green-500" />
            <span>Tempo real</span>
          </Badge>
        </div>
        <p className="text-muted-foreground font-medium mt-1">
          {currentDate} • {currentTime}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 border-dashed"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>
    </div>
  );
};
