import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { Loader2, QrCode, Trash2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Plus, Smartphone, Bot, Download } from 'lucide-react';
import { toast } from 'sonner';

export const WhatsAppInstanceManager = () => {
  const { instances, loading, createInstance, getInstanceQR, deleteInstance, syncInstances, toggleBot, fetchChats, refresh } = useWhatsAppInstances();
  const [newInstanceName, setNewInstanceName] = useState('');
  const [channel, setChannel] = useState('baileys');
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [botStatus, setBotStatus] = useState<Record<string, boolean>>({});
  const [togglingBot, setTogglingBot] = useState<string | null>(null);
  const [importingChats, setImportingChats] = useState<string | null>(null);

  // Carregar status do bot do banco de dados (através das instâncias)
  useEffect(() => {
    const savedStatus: Record<string, boolean> = {};
    instances.forEach(instance => {
      savedStatus[instance.instance_name] = instance.bot_enabled !== false; // Default true
    });
    setBotStatus(savedStatus);
  }, [instances]);

  // Filtrar instâncias e ocultar instâncias específicas
  const HIDDEN_INSTANCES = ['TESTE', 'TINFO', 'tinfo', 'JUNIORCORRETOR', 'juniorcorretor', 'teste', 'VIAINFRA', 'VIAINFRA2', 'viainfra', 'viainfra2', 'TESTE CONEXÃO AUTONOMA', 'Via Infra ', 'Via Infra', 'OFICIAL', 'TINFO - 35'];
  
  // Instâncias que devem sempre ser mostradas (mesmo desconectadas)
  const ALWAYS_SHOW_INSTANCES = ['VIAINFRAOFICIAL', 'TESTE2'];
  
  const connectedInstances = useMemo(() => {
    return instances.filter(instance => {
      // Ocultar instâncias específicas
      if (HIDDEN_INSTANCES.includes(instance.instance_name)) {
        return false;
      }
      
      // Sempre mostrar instâncias prioritárias
      if (ALWAYS_SHOW_INSTANCES.includes(instance.instance_name)) {
        return true;
      }
      
      const status = instance.status?.toLowerCase();
      const connectionState = instance.connection_state?.toLowerCase();
      return status === 'open' || status === 'connected' || 
             connectionState === 'open' || connectionState === 'connected';
    });
  }, [instances]);

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setCreating(true);
    setQrCode(null);
    
    try {
      const result = await createInstance(newInstanceName, channel);
      
      // Verificar se a criação retornou QR code
      if (result?.qrcode?.base64 || result?.qrcode?.code) {
        const qrBase64 = result.qrcode.base64 || result.qrcode.code;
        // Se não tiver prefixo data:image, adicionar
        const qrImage = qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`;
        setQrCode(qrImage);
        setSelectedInstance(newInstanceName);
        toast.success('Instância criada! Escaneie o QR Code para conectar.');
      } else {
        // Se não retornou QR na criação, buscar
        setSelectedInstance(newInstanceName);
        await handleGetQR(newInstanceName);
      }
      
      setNewInstanceName('');
      setShowCreateForm(false);
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast.error(error.message || 'Erro ao criar instância');
    } finally {
      setCreating(false);
    }
  };

  const handleGetQR = async (instanceName: string) => {
    setLoadingQR(true);
    setSelectedInstance(instanceName);
    try {
      const result = await getInstanceQR(instanceName);
      console.log('QR Result:', result);
      
      // Evolution API pode retornar em diferentes formatos
      let qrImage = null;
      
      if (result?.qrcode?.base64) {
        qrImage = result.qrcode.base64;
      } else if (result?.base64) {
        qrImage = result.base64;
      } else if (result?.qrcode?.code) {
        qrImage = result.qrcode.code;
      } else if (result?.code) {
        qrImage = result.code;
      }
      
      if (qrImage) {
        // Garantir formato correto
        const finalQR = qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`;
        setQrCode(finalQR);
      } else if (result?.pairingCode) {
        toast.info(`Código de pareamento: ${result.pairingCode}`);
        setQrCode(null);
      } else {
        toast.error('QR Code não disponível. A instância pode já estar conectada.');
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error getting QR:', error);
      setQrCode(null);
      toast.error('Erro ao obter QR Code');
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

  const getStatusBadge = (status: string, connectionState?: string) => {
    const effectiveStatus = connectionState?.toLowerCase() || status?.toLowerCase();
    switch (effectiveStatus) {
      case 'open':
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'close':
      case 'disconnected':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
      case 'pending':
      case 'connecting':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Aguardando Conexão</Badge>;
      default:
        return <Badge variant="secondary">{effectiveStatus || 'Desconhecido'}</Badge>;
    }
  };

  // Auto-refresh QR code every 25 seconds if showing
  useEffect(() => {
    if (selectedInstance && qrCode) {
      const interval = setInterval(() => {
        handleGetQR(selectedInstance);
      }, 25000);
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
      {/* QR Code Display - Mostrar primeiro se estiver ativo */}
      {qrCode && selectedInstance && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Conectar WhatsApp - {selectedInstance}
            </CardTitle>
            <CardDescription>
              Escaneie o QR Code abaixo com o WhatsApp do celular
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-primary/20">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-72 h-72 object-contain"
              />
            </div>
            <Alert className="mt-4 max-w-md">
              <AlertDescription>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
                  <li>Selecione <strong>"Aparelhos conectados"</strong></li>
                  <li>Toque em <strong>"Conectar um aparelho"</strong></li>
                  <li>Aponte seu celular para esta tela para escanear o código</li>
                </ol>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => handleGetQR(selectedInstance)}
                disabled={loadingQR}
              >
                {loadingQR ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Atualizar QR
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => { setQrCode(null); setSelectedInstance(null); }}
              >
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instâncias Conectadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instâncias WhatsApp</CardTitle>
              <CardDescription>
                {connectedInstances.length > 0 
                  ? `${connectedInstances.length} instância(s) conectada(s)` 
                  : 'Nenhuma instância conectada'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Instância
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulário de criação */}
          {showCreateForm && (
            <Card className="mb-4 border-dashed">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instanceName">Nome da Instância *</Label>
                    <Input
                      id="instanceName"
                      placeholder="ex: minha-empresa"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateInstance()}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use apenas letras, números e hífens
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="channel">Canal</Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baileys">Baileys (Recomendado)</SelectItem>
                        <SelectItem value="evolution">Evolution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateInstance} 
                      disabled={creating || !newInstanceName.trim()}
                      className="flex-1"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar e Obter QR Code
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de instâncias conectadas */}
          {connectedInstances.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhuma instância conectada. Clique em "Nova Instância" para criar e conectar um número do WhatsApp.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {connectedInstances.map((instance) => {
                const isBotEnabled = botStatus[instance.instance_name] !== false;
                
                const handleToggleBot = async () => {
                  setTogglingBot(instance.instance_name);
                  try {
                    const newStatus = !isBotEnabled;
                    await toggleBot(instance.instance_name, newStatus);
                    setBotStatus(prev => ({ ...prev, [instance.instance_name]: newStatus }));
                    await refresh(); // Recarregar instâncias do banco
                  } catch (error) {
                    console.error('Error toggling bot:', error);
                  } finally {
                    setTogglingBot(null);
                  }
                };

                const handleImportChats = async () => {
                  setImportingChats(instance.instance_name);
                  try {
                    await fetchChats(instance.instance_name);
                  } catch (error) {
                    console.error('Error importing chats:', error);
                  } finally {
                    setImportingChats(null);
                  }
                };

                return (
                  <Card key={instance.id} className="bg-muted/30">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            {instance.instance_name}
                          </h4>
                          {instance.phone_number && (
                            <p className="text-sm text-muted-foreground">
                              📱 {instance.phone_number}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(instance.status, instance.connection_state)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {/* Bot Toggle */}
                          <div className="flex items-center gap-2 justify-end">
                            <Label htmlFor={`bot-${instance.id}`} className="text-xs text-muted-foreground flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              Bot
                            </Label>
                            <Switch
                              id={`bot-${instance.id}`}
                              checked={isBotEnabled}
                              onCheckedChange={handleToggleBot}
                              disabled={togglingBot === instance.instance_name}
                            />
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleImportChats}
                              disabled={importingChats === instance.instance_name}
                              title="Importar conversas do WhatsApp"
                            >
                              {importingChats === instance.instance_name ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGetQR(instance.instance_name)}
                              disabled={loadingQR && selectedInstance === instance.instance_name}
                              title="Obter QR Code"
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
                              title="Deletar instância"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
