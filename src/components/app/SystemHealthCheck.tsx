import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface HealthStatus {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: string;
}

export const SystemHealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setIsChecking(true);
    
    // Simulate health checks
    setTimeout(() => {
      setHealthStatus([
        {
          component: 'Frontend Application',
          status: 'healthy',
          message: 'Aplicação funcionando corretamente',
          lastCheck: new Date().toLocaleTimeString('pt-BR')
        },
        {
          component: 'Database Connection',
          status: 'warning',
          message: 'Usando dados demo - conecte PostgreSQL para produção',
          lastCheck: new Date().toLocaleTimeString('pt-BR')
        },
        {
          component: 'WhatsApp API',
          status: 'error',
          message: 'Não conectado - configure Evolution API',
          lastCheck: new Date().toLocaleTimeString('pt-BR')
        },
        {
          component: 'Bot Engine',
          status: 'healthy',
          message: 'Sistema de bots funcionando em modo preview',
          lastCheck: new Date().toLocaleTimeString('pt-BR')
        },
        {
          component: 'Webhooks',
          status: 'error',
          message: 'Webhooks não configurados',
          lastCheck: new Date().toLocaleTimeString('pt-BR')
        }
      ]);
      setIsChecking(false);
    }, 2000);
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
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallStatus = () => {
    const hasErrors = healthStatus.some(s => s.status === 'error');
    const hasWarnings = healthStatus.some(s => s.status === 'warning');
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'healthy';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Status do Sistema</CardTitle>
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
          {healthStatus.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(item.status)}
                <div>
                  <div className="font-medium text-sm">{item.component}</div>
                  <div className="text-xs text-muted-foreground">{item.message}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {item.lastCheck}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Para Produção:</strong> Configure PostgreSQL e Evolution API para ativar todas as funcionalidades.
            Consulte a página de <strong>Ajuda</strong> para instruções detalhadas.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};