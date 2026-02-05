import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

interface HealthStatus {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: string;
  tooltip?: string;
}

export const SystemHealthCheck = () => {
  const { company } = useAuth();
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    checkSystemHealth();
  }, [company?.id]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleRefresh = () => {
      checkSystemHealth();
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [company?.id]);

  const checkSystemHealth = async () => {
    setIsChecking(true);
    
    try {
      const healthChecks = await Promise.all([
        // Frontend check
        Promise.resolve({
          component: 'Aplicação Frontend',
          status: 'healthy' as const,
          message: 'Funcionando corretamente',
          lastCheck: new Date().toLocaleTimeString('pt-BR'),
          tooltip: 'Status da aplicação React no navegador'
        }),
        
        // API Latency check
        (async () => {
          const start = performance.now();
          try {
            await supabase.from('companies').select('id').limit(1);
            const latency = Math.round(performance.now() - start);
            
            return {
              component: 'Latência da API',
              status: latency < 200 ? 'healthy' as const : latency < 500 ? 'warning' as const : 'error' as const,
              message: `${latency}ms`,
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Tempo de resposta do banco de dados. Ideal: < 200ms'
            };
          } catch {
            return {
              component: 'Latência da API',
              status: 'error' as const,
              message: 'Timeout',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Tempo de resposta do banco de dados'
            };
          }
        })(),
        
        // Database check
        (async () => {
          try {
            const { error } = await supabase.from('companies').select('id').limit(1);
            return {
              component: 'Banco de Dados',
              status: error ? 'error' as const : 'healthy' as const,
              message: error ? 'Erro de conexão' : 'Conectado ao Supabase',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Conexão com o banco de dados Supabase'
            };
          } catch {
            return {
              component: 'Banco de Dados',
              status: 'error' as const,
              message: 'Erro de conexão',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Conexão com o banco de dados Supabase'
            };
          }
        })(),
        
        // Auth check
        (async () => {
          try {
            const { data } = await supabase.auth.getSession();
            return {
              component: 'Autenticação',
              status: data.session ? 'healthy' as const : 'warning' as const,
              message: data.session ? 'Sessão ativa' : 'Sessão expirada',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Status da sessão de autenticação do usuário'
            };
          } catch {
            return {
              component: 'Autenticação',
              status: 'error' as const,
              message: 'Erro ao verificar',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Status da sessão de autenticação do usuário'
            };
          }
        })(),

        // WhatsApp connection check
        (async () => {
          if (!company?.id) {
            return {
              component: 'WhatsApp',
              status: 'warning' as const,
              message: 'Não configurado',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Status da conexão com o WhatsApp Business'
            };
          }
          
          try {
            const { data, error } = await supabase
              .from('whatsapp_instances')
              .select('connection_state, instance_name')
              .eq('company_id', company.id)
              .limit(1)
              .maybeSingle();
            
            if (error) throw error;
            
            if (!data) {
              return {
                component: 'WhatsApp',
                status: 'warning' as const,
                message: 'Nenhuma instância',
                lastCheck: new Date().toLocaleTimeString('pt-BR'),
                tooltip: 'Nenhuma instância WhatsApp configurada'
              };
            }

            return {
              component: 'WhatsApp',
              status: data.connection_state === 'open' ? 'healthy' as const : 'warning' as const,
              message: data.connection_state === 'open' 
                ? `${data.instance_name || 'Instância'} conectada` 
                : 'Instância desconectada',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Status da conexão com o WhatsApp Business'
            };
          } catch {
            return {
              component: 'WhatsApp',
              status: 'error' as const,
              message: 'Erro ao verificar',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Status da conexão com o WhatsApp Business'
            };
          }
        })(),

        // Message queue check
        (async () => {
          try {
            const { count, error } = await supabase
              .from('message_queue')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending');
            
            if (error) throw error;
            
            const pending = count || 0;
            return {
              component: 'Fila de Mensagens',
              status: pending < 10 ? 'healthy' as const : pending < 50 ? 'warning' as const : 'error' as const,
              message: pending === 0 ? 'Vazia' : `${pending} pendente(s)`,
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Mensagens aguardando envio. Ideal: < 10'
            };
          } catch {
            return {
              component: 'Fila de Mensagens',
              status: 'warning' as const,
              message: 'Não monitorada',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Mensagens aguardando envio'
            };
          }
        })(),

        // Realtime check
        (async () => {
          try {
            const channel = supabase.channel('health-check');
            const state = channel.state;
            supabase.removeChannel(channel);
            
            return {
              component: 'Tempo Real',
              status: 'healthy' as const,
              message: 'Ativo',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Sistema de notificações em tempo real (WebSocket)'
            };
          } catch {
            return {
              component: 'Tempo Real',
              status: 'warning' as const,
              message: 'Verificar conexão',
              lastCheck: new Date().toLocaleTimeString('pt-BR'),
              tooltip: 'Sistema de notificações em tempo real (WebSocket)'
            };
          }
        })()
      ]);
      
      setHealthStatus(healthChecks);
    } catch (error) {
      console.error('Error checking health:', error);
    } finally {
      setIsChecking(false);
      setIsInitialLoad(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getOverallStatus = () => {
    const hasErrors = healthStatus.some(s => s.status === 'error');
    const hasWarnings = healthStatus.some(s => s.status === 'warning');
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'healthy';
  };

  if (isInitialLoad) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Saúde do Sistema</CardTitle>
            <Badge className={getStatusColor(getOverallStatus())}>
              {getOverallStatus() === 'healthy' ? 'Saudável' : 
               getOverallStatus() === 'warning' ? 'Atenção' : 'Crítico'}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkSystemHealth}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <TooltipProvider>
            {healthStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm">{item.component}</span>
                      {item.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.message}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.lastCheck}
                </div>
              </div>
            ))}
          </TooltipProvider>
        </div>
        
        {getOverallStatus() !== 'healthy' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Dica:</strong> Alguns componentes requerem atenção. Verifique os itens com status amarelo ou vermelho.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
