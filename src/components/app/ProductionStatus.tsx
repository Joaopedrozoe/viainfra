import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertCircle, Settings, Zap } from "lucide-react";

interface ProductionStatusProps {
  className?: string;
  showDetails?: boolean;
}

interface SystemStatus {
  database: 'connected' | 'disconnected' | 'error';
  whatsappApi: 'connected' | 'disconnected' | 'error';
  webhooks: 'configured' | 'not-configured' | 'error';
  evolutionApi: 'connected' | 'disconnected' | 'error';
}

export const ProductionStatus = ({ className, showDetails = false }: ProductionStatusProps) => {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'disconnected',
    whatsappApi: 'disconnected', 
    webhooks: 'not-configured',
    evolutionApi: 'disconnected'
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar verificações reais quando APIs forem conectadas
      // Por enquanto, sempre mostra desconectado até configuração real
      
      // Simular verificação de status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus({
        database: 'disconnected', // Verificar conexão com PostgreSQL
        whatsappApi: 'disconnected', // Verificar WhatsApp Cloud API
        webhooks: 'not-configured', // Verificar webhooks configurados
        evolutionApi: 'disconnected' // Verificar Evolution API
      });
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'configured':
        return 'Configurado';
      case 'disconnected':
        return 'Desconectado';
      case 'not-configured':
        return 'Não Configurado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const isProductionReady = Object.values(status).every(
    s => s === 'connected' || s === 'configured'
  );

  const getOverallStatus = () => {
    if (isProductionReady) return 'production';
    if (Object.values(status).some(s => s === 'error')) return 'error';
    return 'development';
  };

  const overallStatus = getOverallStatus();

  if (!showDetails) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className={`flex items-center gap-2 cursor-pointer ${className}`}>
            <div className={`w-2 h-2 rounded-full ${
              overallStatus === 'production' ? 'bg-green-500' : 
              overallStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {overallStatus === 'production' ? 'Produção' : 
               overallStatus === 'error' ? 'Erro' : 'Desenvolvimento'}
            </span>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Status do Sistema
            </DialogTitle>
          </DialogHeader>
          <ProductionStatus showDetails={true} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Alert className={
        overallStatus === 'production' ? 'border-green-200 bg-green-50' :
        overallStatus === 'error' ? 'border-red-200 bg-red-50' :
        'border-yellow-200 bg-yellow-50'
      }>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {overallStatus === 'production' ? (
            'Sistema configurado para produção. Todas as integrações estão funcionais.'
          ) : overallStatus === 'error' ? (
            'Há problemas com algumas integrações. Verifique as configurações.'
          ) : (
            'Sistema em modo de desenvolvimento. Configure as integrações para usar em produção.'
          )}
        </AlertDescription>
      </Alert>

      {/* Status Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.database)}
              <span className="text-sm font-medium">Banco de Dados</span>
            </div>
            <Badge variant="outline" className={getStatusColor(status.database)}>
              {getStatusText(status.database)}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.evolutionApi)}
              <span className="text-sm font-medium">Evolution API</span>
            </div>
            <Badge variant="outline" className={getStatusColor(status.evolutionApi)}>
              {getStatusText(status.evolutionApi)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.whatsappApi)}
              <span className="text-sm font-medium">WhatsApp API</span>
            </div>
            <Badge variant="outline" className={getStatusColor(status.whatsappApi)}>
              {getStatusText(status.whatsappApi)}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.webhooks)}
              <span className="text-sm font-medium">Webhooks</span>
            </div>
            <Badge variant="outline" className={getStatusColor(status.webhooks)}>
              {getStatusText(status.webhooks)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkSystemStatus}
          disabled={isLoading}
        >
          {isLoading ? 'Verificando...' : 'Verificar Status'}
        </Button>
        
        {!isProductionReady && (
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar Integrações
          </Button>
        )}
      </div>

      {/* Setup Instructions */}
      {!isProductionReady && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Próximos Passos</CardTitle>
            <CardDescription className="text-xs">
              Para usar o sistema em produção, você precisa:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Configurar banco PostgreSQL (ver DEPLOYMENT.md)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Configurar Evolution API para WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Configurar webhooks para receber mensagens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span>Testar configurações na página de Canais</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};