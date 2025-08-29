import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoMode } from "@/hooks/useDemoMode";

export const DashboardHeader: React.FC = () => {
  const { profile } = useAuth();
  const { isDemoMode } = useDemoMode();
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
      // Clear cache and force refresh
      if (typeof window !== 'undefined') {
        // Dispatch custom event to trigger metric recalculation
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
      }
      // Small delay for visual feedback
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
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Olá, {profile?.name || 'Usuário'}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {currentDate} • {currentTime}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>
    </div>
  );
};