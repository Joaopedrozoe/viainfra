import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDemoMode } from "@/hooks/useDemoMode";
import { 
  getDemoChannelsExpanded, 
  addDemoChannelExpanded, 
  updateDemoChannelExpanded,
  deleteDemoChannelExpanded,
} from "@/data/mockChannelsExpanded";
import { Channel } from '@/types/channels';
import { ChannelWizard } from "@/components/app/channels/ChannelWizard";
import { ChannelBotConfig } from "@/components/app/channels/ChannelBotConfig";
import { WebsiteSetup } from "@/components/app/channels/wizard/WebsiteSetup";
import { Plus, Instagram, Facebook, MessageCircle, Mail, Globe, Send, MoreVertical, Settings, Trash2, Bot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

const getChannelIcon = (type: string) => {
  switch (type) {
    case 'instagram':
      return <Instagram className="w-5 h-5 text-pink-600" />;
    case 'facebook':
      return <Facebook className="w-5 h-5 text-blue-600" />;
    case 'whatsapp':
      return <MessageCircle className="w-5 h-5 text-green-600" />;
    case 'email':
      return <Mail className="w-5 h-5 text-gray-600" />;
    case 'website':
      return <Globe className="w-5 h-5 text-purple-600" />;
    case 'telegram':
      return <Send className="w-5 h-5 text-blue-500" />;
    default:
      return <Globe className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
      return <Badge variant="default" className="bg-green-100 text-green-800">Conectado</Badge>;
    case 'disconnected':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Desconectado</Badge>;
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Configurando</Badge>;
    case 'error':
      return <Badge variant="destructive">Erro</Badge>;
    default:
      return <Badge variant="secondary">Desconhecido</Badge>;
  }
};

const Channels = () => {
  const isMobile = useIsMobile();
  const { isDemoMode } = useDemoMode();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [configChannelId, setConfigChannelId] = useState<string | null>(null);
  const [settingsChannelId, setSettingsChannelId] = useState<string | null>(null);

  // Load channels on component mount
  useEffect(() => {
    const loadChannels = () => {
      const expandedChannels = getDemoChannelsExpanded();
      setChannels(expandedChannels);
    };
    
    loadChannels();
    
    // Listen for storage changes from other tabs only
    const handleStorageChange = () => {
      loadChannels();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isDemoMode]);


  const handleChannelComplete = (channelData: any) => {
    if (isDemoMode) {
      const newChannel = addDemoChannelExpanded({
        name: channelData.name || `${channelData.type} Channel`,
        description: channelData.description || `Canal de ${channelData.type}`,
        type: channelData.type,
        status: 'pending',
        companyId: 'demo-company-456',
        integration: {
          provider: getProviderByType(channelData.type),
          webhookUrl: `https://app.exemplo.com/webhooks/${channelData.type}`,
          verifyToken: `verify_${channelData.type}_${Date.now()}`,
          lastSync: new Date().toISOString(),
          ...channelData
        },
        settings: {
          autoReply: channelData.autoReply ?? true,
          businessHours: {
            enabled: false,
            schedule: {
              monday: { enabled: true, start: '09:00', end: '18:00' },
              tuesday: { enabled: true, start: '09:00', end: '18:00' },
              wednesday: { enabled: true, start: '09:00', end: '18:00' },
              thursday: { enabled: true, start: '09:00', end: '18:00' },
              friday: { enabled: true, start: '09:00', end: '18:00' },
              saturday: { enabled: false, start: '09:00', end: '18:00' },
              sunday: { enabled: false, start: '09:00', end: '18:00' }
            }
          },
          welcomeMessage: channelData.welcomeMessage,
          fallbackMessage: channelData.fallbackMessage,
          notifications: {
            email: true,
            push: false
          }
        },
        metrics: {
          totalMessages: 0,
          todayMessages: 0,
          responseTime: 0,
          lastActivity: new Date().toISOString(),
          deliveryRate: 0,
          errorRate: 0
        }
      });
      setChannels(prev => [...prev, newChannel]);
    }
    
    toast.success(`Canal ${channelData.name} adicionado com sucesso${isDemoMode ? ' (Demo)' : ''}`);
  };

  const toggleChannelStatus = (id: string) => {
    const channelToUpdate = channels.find(ch => ch.id === id);
    
    if (!channelToUpdate) return;
    
    const newStatus = channelToUpdate.status === 'connected' ? 'disconnected' : 'connected';
    
    // Sempre atualiza localStorage para persistir
    updateDemoChannelExpanded(id, { status: newStatus });
    
    // Atualiza estado local
    setChannels(prev => 
      prev.map(channel => 
        channel.id === id 
          ? { ...channel, status: newStatus }
          : channel
      )
    );
    
    // Apenas notifica o dashboard (não recarrega esta página)
    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    
    toast.success(`Canal ${newStatus === 'connected' ? 'ativado' : 'desativado'} com sucesso`);
  };

  const deleteChannel = (id: string) => {
    if (isDemoMode) {
      deleteDemoChannelExpanded(id);
    }
    
    setChannels(prev => prev.filter(channel => channel.id !== id));
    toast.success(`Canal deletado com sucesso${isDemoMode ? ' (Demo)' : ''}`);
  };

  const updateChannel = (channelId: string, updates: Partial<Channel>) => {
    if (isDemoMode) {
      updateDemoChannelExpanded(channelId, updates);
    }
    
    setChannels(prev => 
      prev.map(channel => 
        channel.id === channelId ? { ...channel, ...updates } : channel
      )
    );
    toast.success("Configurações salvas com sucesso!");
  };

  const getProviderByType = (type: string): string => {
    switch (type) {
      case 'whatsapp':
        return 'WhatsApp Cloud API';
      case 'instagram':
      case 'facebook':
        return 'Meta Business';
      case 'telegram':
        return 'Telegram Bot API';
      case 'email':
        return 'SMTP';
      case 'website':
        return 'Widget Próprio';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <main className="h-full overflow-auto">
        <div className="p-6">
        <div className="container mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Canais</h1>
              {isDemoMode && (
                <Badge variant="secondary" className="mt-1">
                  Modo Demonstração
                </Badge>
              )}
            </div>
            <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Canal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <Card key={channel.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-50">
                        {getChannelIcon(channel.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setConfigChannelId(channel.id)}>
                          <Bot className="mr-2 h-4 w-4" />
                          Configurar Bot
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSettingsChannelId(channel.id)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteChannel(channel.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(channel.status)}
                        <Switch
                          checked={channel.status === 'connected'}
                          onCheckedChange={() => toggleChannelStatus(channel.id)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {channel.status === 'connected' ? channel.metrics.totalMessages : 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Mensagens</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {channel.status === 'connected' ? channel.metrics.responseTime : 0}s
                        </div>
                        <div className="text-xs text-muted-foreground">Tempo Resp.</div>
                      </div>
                    </div>
                    
                    {channel.integration.provider && (
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-1">Provedor</div>
                        <Badge variant="outline" className="text-xs">
                          {channel.integration.provider}
                        </Badge>
                      </div>
                    )}
                    
                    {channel.settings.autoReply && (
                      <div className="pt-2">
                        <Badge variant="secondary" className="text-xs">
                          Resposta Automática Ativa
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ChannelWizard 
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onComplete={handleChannelComplete}
          />

          {/* Bot Configuration Dialog */}
          <Dialog open={!!configChannelId} onOpenChange={() => setConfigChannelId(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configuração de Bot</DialogTitle>
              </DialogHeader>
              {configChannelId && (
                <ChannelBotConfig
                  channel={channels.find(c => c.id === configChannelId)!}
                  onUpdateChannel={updateChannel}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Channel Settings Dialog */}
          <Dialog open={!!settingsChannelId} onOpenChange={() => setSettingsChannelId(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configurações do Canal</DialogTitle>
              </DialogHeader>
              {settingsChannelId && (() => {
                const channel = channels.find(c => c.id === settingsChannelId)!;
                if (channel.type === 'website') {
                  return (
                    <WebsiteSetup
                      data={{
                        name: channel.name,
                        description: channel.description,
                        domains: [],
                        theme: 'light',
                        position: 'bottom-right',
                        primaryColor: '#007bff',
                        autoReply: channel.settings.autoReply,
                        welcomeMessage: channel.settings.welcomeMessage,
                        fallbackMessage: channel.settings.fallbackMessage,
                        notifications: channel.settings.notifications
                      }}
                      onUpdate={(data) => {
                        updateChannel(channel.id, {
                          ...channel,
                          name: data.name,
                          description: data.description,
                          settings: {
                            ...channel.settings,
                            autoReply: data.autoReply,
                            welcomeMessage: data.welcomeMessage,
                            fallbackMessage: data.fallbackMessage,
                            notifications: data.notifications
                          }
                        });
                      }}
                    />
                  );
                }
                return (
                  <div className="p-4 text-center text-muted-foreground">
                    Configurações específicas para este tipo de canal em breve.
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Channels;
