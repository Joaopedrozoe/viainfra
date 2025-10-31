import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { Loader2, QrCode, Trash2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Wrench, Bug } from 'lucide-react';
import { toast } from 'sonner';

export const WhatsAppInstanceManager = () => {
  const { instances, loading, createInstance, getInstanceQR, deleteInstance, syncInstances, forceFixWebhook, diagnoseWebhook, refresh } = useWhatsAppInstances();
  const [newInstanceName, setNewInstanceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setCreating(true);
    try {
      await createInstance(newInstanceName);
      setNewInstanceName('');
      setSelectedInstance(newInstanceName);
      // Automatically load QR code
      await handleGetQR(newInstanceName);
    } catch (error) {
      console.error('Error creating instance:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleGetQR = async (instanceName: string) => {
    setLoadingQR(true);
    setSelectedInstance(instanceName);
    try {
      const result = await getInstanceQR(instanceName);
      if (result?.qr_code || result?.qrcode?.code) {
        setQrCode(result.qr_code || result.qrcode?.code);
      } else {
        toast.error('QR Code não disponível');
      }
    } catch (error) {
      console.error('Error getting QR:', error);
      setQrCode(null);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDelete = async (instanceName: string) => {
    if (confirm(`Tem certeza que deseja deletar a instância ${instanceName}?`)) {
      await deleteInstance(instanceName);
      if (selectedInstance === instanceName) {
        setQrCode(null);
        setSelectedInstance(null);
      }
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncInstances();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleForceFix = async (instanceName: string) => {
    if (confirm(`Reconfigurar webhook da instância ${instanceName}?\n\nIsso irá:\n1. Deletar webhook\n2. Criar novo webhook\n3. Reiniciar instância\n\nLeva ~30 segundos.`)) {
      setFixing(instanceName);
      try {
        await forceFixWebhook(instanceName);
      } catch (error) {
        console.error('Force fix error:', error);
      } finally {
        setFixing(null);
      }
    }
  };

  const handleDiagnose = async (instanceName: string) => {
    setDiagnosing(instanceName);
    try {
      const result = await diagnoseWebhook(instanceName);
      setDiagnosisResult(result);
      setShowDiagnosis(true);
    } catch (error) {
      console.error('Diagnosis error:', error);
    } finally {
      setDiagnosing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'close':
      case 'disconnected':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
      case 'pending':
      case 'connecting':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Aguardando</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Desconhecido'}</Badge>;
    }
  };

  // Auto-refresh QR code every 30 seconds if showing
  useEffect(() => {
    if (selectedInstance && qrCode) {
      const interval = setInterval(() => {
        handleGetQR(selectedInstance);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedInstance, qrCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Instance */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Instância WhatsApp</CardTitle>
          <CardDescription>
            Crie uma nova instância para conectar um número do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                placeholder="minha-empresa"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateInstance()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateInstance} 
                disabled={creating || !newInstanceName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Instância'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instances List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instâncias Conectadas</CardTitle>
              <CardDescription>
                Gerencie suas instâncias do WhatsApp
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Sincronizar Evolution API'
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma instância criada ainda. Crie uma nova instância acima para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <Card key={instance.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{instance.instance_name}</h4>
                        {instance.phone_number && (
                          <p className="text-sm text-muted-foreground">
                            {instance.phone_number}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(instance.status)}
                          {instance.connection_state && (
                            <Badge variant="outline">{instance.connection_state}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDiagnose(instance.instance_name)}
                          disabled={diagnosing === instance.instance_name}
                          title="Diagnosticar webhook"
                        >
                          {diagnosing === instance.instance_name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bug className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleForceFix(instance.instance_name)}
                          disabled={fixing === instance.instance_name}
                          title="Reconfigurar webhook (força bruta)"
                        >
                          {fixing === instance.instance_name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Wrench className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGetQR(instance.instance_name)}
                          disabled={loadingQR && selectedInstance === instance.instance_name}
                        >
                          {loadingQR && selectedInstance === instance.instance_name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <QrCode className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(instance.instance_name)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Display */}
      {qrCode && selectedInstance && (
        <Card>
          <CardHeader>
            <CardTitle>Conectar WhatsApp - {selectedInstance}</CardTitle>
            <CardDescription>
              Escaneie o QR Code com o WhatsApp para conectar
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64"
              />
            </div>
            <Alert className="mt-4">
              <AlertDescription>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em Menu ou Configurações e selecione "Aparelhos conectados"</li>
                  <li>Toque em "Conectar um aparelho"</li>
                  <li>Aponte seu celular para esta tela para escanear o código</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Dialog */}
      <Dialog open={showDiagnosis} onOpenChange={setShowDiagnosis}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Diagnóstico do Webhook</DialogTitle>
            <DialogDescription>
              Análise detalhada da configuração e conectividade
            </DialogDescription>
          </DialogHeader>
          {diagnosisResult && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Instância: <strong>{diagnosisResult.instanceName}</strong>
              </div>
              
              {diagnosisResult.tests?.map((test: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">{test.step}. {test.test}</div>
                        <div className="text-sm mt-1">{test.status}</div>
                      </div>
                    </div>
                    {test.data && (
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    )}
                    {test.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription className="text-xs">
                          {test.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}

              {diagnosisResult.summary && (
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Resumo</h4>
                    <div className="space-y-1 text-sm">
                      {diagnosisResult.summary.issues?.map((issue: string, i: number) => (
                        <div key={i} className="text-destructive">⚠️ {issue}</div>
                      ))}
                      {diagnosisResult.summary.recommendations?.map((rec: string, i: number) => (
                        <div key={i} className="text-muted-foreground">💡 {rec}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
