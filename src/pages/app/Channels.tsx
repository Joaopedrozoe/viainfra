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
import { Plus, Instagram, Facebook, MessageCircle, Mail, Globe, Send, MoreVertical, Settings, Trash2 } from "lucide-react";
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

  // Load channels on component mount
  useEffect(() => {
    const loadChannels = () => {
      if (isDemoMode) {
        let expandedChannels = getDemoChannelsExpanded();
        
        // Zera dados dos canais que não são WhatsApp
        expandedChannels = expandedChannels.map(channel => {
          if (channel.type !== 'whatsapp') {
            return {
              ...channel,
              status: 'disconnected' as const,
              metrics: {
                ...channel.metrics,
                totalMessages: 0,
                todayMessages: 0,
                responseTime: 0,
                lastActivity: '',
                deliveryRate: 0,
                errorRate: 0
              }
            };
          }
          return channel;
        });
        
        setChannels(expandedChannels);
      } else {
        // Para dados reais, carregaria da API/Supabase
        // Por enquanto, zera todos os dados
        const expandedChannels = getDemoChannelsExpanded().map(channel => ({
          ...channel,
          status: 'disconnected' as const,
          metrics: {
            ...channel.metrics,
            totalMessages: 0,
            todayMessages: 0,
            responseTime: 0,
            lastActivity: '',
            deliveryRate: 0,
            errorRate: 0
          }
        }));
        setChannels(expandedChannels);
      }
    };
    
    loadChannels();
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
    
    // Restringe conexão apenas ao WhatsApp quando não está em modo demo
    if (!isDemoMode && channelToUpdate?.type !== 'whatsapp') {
      toast.error('Este canal ainda não está disponível. Apenas WhatsApp está funcionando no MVP atual.');
      return;
    }
    
    if (isDemoMode) {
      updateDemoChannelExpanded(id, { 
        status: channelToUpdate?.status === 'connected' ? 'disconnected' : 'connected' 
      });
      setChannels(prev => 
        prev.map(channel => 
          channel.id === id 
            ? { ...channel, status: channel.status === 'connected' ? 'disconnected' : 'connected' }
            : channel
        )
      );
    } else {
      // Para modo não-demo, apenas permite conexão do WhatsApp
      if (channelToUpdate?.type === 'whatsapp') {
        setChannels(prev =>
          prev.map(channel =>
            channel.id === id 
              ? { ...channel, status: channel.status === 'connected' ? 'disconnected' : 'connected' }
              : channel
          )
        );
      }
    }
    
    if (channelToUpdate) {
      const newStatus = channelToUpdate.status === 'connected' ? 'Desativado' : 'Ativado';
      const statusMessage = isDemoMode ? ' (Demo)' : '';
      toast.success(`Canal ${newStatus.toLowerCase()} com sucesso${statusMessage}`);
    }
  };

  const deleteChannel = (id: string) => {
    if (isDemoMode) {
      deleteDemoChannelExpanded(id);
    }
    
    setChannels(prev => prev.filter(channel => channel.id !== id));
    toast.success(`Canal deletado com sucesso${isDemoMode ? ' (Demo)' : ''}`);
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
                        <DropdownMenuItem>
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
                        <div className="text-2xl font-bold text-primary">{channel.metrics.totalMessages}</div>
                        <div className="text-xs text-muted-foreground">Mensagens</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{channel.metrics.responseTime}s</div>
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
        </div>
        </div>
      </main>
    </div>
  );
};

export default Channels;
