import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { getDemoChannelsExpanded } from "@/data/mockChannelsExpanded";
import { formatResponseTime } from "./dashboardUtils";
import { useDemoMode } from "@/hooks/useDemoMode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export const ChannelHealthPanel: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const { profile } = useAuth();
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadChannels = async () => {
    setIsLoading(true);
    try {
      // Carrega os canais salvos (mesma fonte que a página de Canais usa) - ISOLADO POR EMPRESA
      const savedChannels = getDemoChannelsExpanded(profile?.company_id);
      
      // Filtra apenas canais conectados para mostrar no dashboard
      const activeChannels = savedChannels.filter(ch => ch.status === 'connected');
      
      setChannels(activeChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (profile?.company_id) {
      loadChannels();
    }
  }, [isDemoMode, profile?.company_id]);
  
  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadChannels();
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [isDemoMode]);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'disconnected':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'pending':
        return 'Pendente';
      case 'error':
        return 'Erro';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Status dos Canais</CardTitle>
          <CardDescription>
            Saúde e performance dos canais de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="h-64 sm:h-80 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Status dos Canais</CardTitle>
        <CardDescription>
          Saúde e performance dos canais de atendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="h-64 sm:h-80 overflow-y-auto space-y-3 sm:space-y-4 pr-2">
          {channels.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhum canal configurado
            </div>
          ) : (
            channels.map((channel) => (
              <div 
                key={channel.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3 flex-shrink-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(channel.status)}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{channel.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {channel.status === 'connected' && channel.metrics ? 
                        formatResponseTime(channel.metrics.responseTime) : 
                        '0s'
                      }
                    </div>
                    <div className="text-muted-foreground">
                      {channel.status === 'connected' && channel.metrics ? 
                        `${channel.metrics.todayMessages} msgs hoje` : 
                        '0 msgs hoje'
                      }
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={`${getStatusColor(channel.status)} text-xs whitespace-nowrap self-start sm:self-center`}
                  >
                    {getStatusText(channel.status)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};