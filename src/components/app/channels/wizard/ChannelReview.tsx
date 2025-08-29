import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Mail, 
  Globe, 
  Send,
  Settings,
  Webhook,
  MessageSquare
} from "lucide-react";

interface ChannelReviewProps {
  channelData: any;
  onComplete: () => void;
}

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
      return <MessageSquare className="w-5 h-5 text-gray-500" />;
  }
};

const getChannelTitle = (type: string) => {
  switch (type) {
    case 'instagram':
      return 'Instagram Direct';
    case 'facebook':
      return 'Facebook Messenger';
    case 'whatsapp':
      return 'WhatsApp Business';
    case 'email':
      return 'Email Corporativo';
    case 'website':
      return 'Chat do Site';
    case 'telegram':
      return 'Telegram Bot';
    default:
      return 'Canal Desconhecido';
  }
};

const formatConfigurationInfo = (channelData: any) => {
  const { type } = channelData;
  
  switch (type) {
    case 'whatsapp':
      return [
        { label: 'Número de Telefone', value: channelData.phoneNumber || 'Não configurado' },
        { label: 'Business Account ID', value: channelData.businessAccountId ? '••••••••' + channelData.businessAccountId.slice(-4) : 'Não configurado' },
        { label: 'Provedor', value: channelData.provider || 'WhatsApp Cloud API' }
      ];
    case 'instagram':
      return [
        { label: 'App ID', value: channelData.appId ? '••••••••' + channelData.appId.slice(-4) : 'Não configurado' },
        { label: 'Business Account ID', value: channelData.businessAccountId ? '••••••••' + channelData.businessAccountId.slice(-4) : 'Não configurado' }
      ];
    case 'facebook':
      return [
        { label: 'App ID', value: channelData.appId ? '••••••••' + channelData.appId.slice(-4) : 'Não configurado' },
        { label: 'Page ID', value: channelData.pageId ? '••••••••' + channelData.pageId.slice(-4) : 'Não configurado' }
      ];
    case 'email':
      return [
        { label: 'Email Remetente', value: channelData.fromEmail || 'Não configurado' },
        { label: 'Servidor SMTP', value: channelData.smtpHost || 'Não configurado' },
        { label: 'Porta', value: channelData.smtpPort || '587' }
      ];
    case 'website':
      return [
        { label: 'Domínios', value: channelData.domains?.filter(d => d.trim()).length + ' configurado(s)' || '0 configurado(s)' },
        { label: 'Tema', value: channelData.theme || 'light' },
        { label: 'Posição', value: channelData.position || 'bottom-right' }
      ];
    case 'telegram':
      return [
        { label: 'Username do Bot', value: channelData.botUsername ? '@' + channelData.botUsername : 'Não configurado' },
        { label: 'Token', value: channelData.botToken ? '••••••••' + channelData.botToken.slice(-8) : 'Não configurado' }
      ];
    default:
      return [];
  }
};

export const ChannelReview = ({ channelData, onComplete }: ChannelReviewProps) => {
  const configInfo = formatConfigurationInfo(channelData);
  const hasAutoReply = channelData.autoReply;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-green-50">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold">Revisão da Configuração</h3>
        <p className="text-muted-foreground">
          Verifique as configurações antes de finalizar a criação do canal
        </p>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getChannelIcon(channelData.type)}
            <div>
              <div>{channelData.name || getChannelTitle(channelData.type)}</div>
              <Badge variant="secondary" className="mt-1">
                {getChannelTitle(channelData.type)}
              </Badge>
            </div>
          </CardTitle>
          {channelData.description && (
            <CardDescription>{channelData.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Configurações de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {configInfo.map((info, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm text-muted-foreground">{info.label}:</span>
                <span className="text-sm font-medium">{info.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Configurações de Resposta Automática */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Respostas Automáticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={hasAutoReply ? "default" : "secondary"}>
                {hasAutoReply ? 'Ativado' : 'Desativado'}
              </Badge>
            </div>
            
            {hasAutoReply && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium mb-2">Mensagem de Boas-vindas:</div>
                  <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                    {channelData.welcomeMessage || 'Não configurada'}
                  </div>
                </div>
                
                {channelData.fallbackMessage && (
                  <div>
                    <div className="text-sm font-medium mb-2">Mensagem Fallback:</div>
                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      {channelData.fallbackMessage}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            O que acontecerá após a criação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">Canal será criado</div>
                <div className="text-muted-foreground">
                  O canal será adicionado à sua lista com status "Configurando"
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">Webhook será configurado</div>
                <div className="text-muted-foreground">
                  Sistema configurará automaticamente o recebimento de mensagens
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">Teste de conexão</div>
                <div className="text-muted-foreground">
                  Uma mensagem de teste será enviada para validar a configuração
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Finalização */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={onComplete}
          size="lg"
          className="min-w-48"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Criar Canal
        </Button>
      </div>
    </div>
  );
};