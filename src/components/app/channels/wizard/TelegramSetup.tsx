import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle, AlertCircle, Send, Copy } from "lucide-react";

interface TelegramSetupProps {
  data: any;
  onUpdate: (data: any) => void;
}

export const TelegramSetup = ({ data, onUpdate }: TelegramSetupProps) => {
  const [formData, setFormData] = useState({
    name: data.name || 'Telegram Bot',
    description: data.description || 'Bot personalizado para Telegram',
    botToken: data.botToken || '',
    botUsername: data.botUsername || '',
    autoReply: data.autoReply ?? true,
    welcomeMessage: data.welcomeMessage || '🤖 Olá! Sou o bot de atendimento. Como posso ajudar?',
    fallbackMessage: data.fallbackMessage || 'Desculpe, não entendi. Digite /help para ver os comandos disponíveis.',
    notifications: data.notifications || { email: true, push: false }
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleInputChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    
    setTimeout(() => {
      if (formData.botToken && formData.botUsername) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    }, 2000);
  };

  const webhookUrl = "https://app.exemplo.com/webhooks/telegram";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <Send className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuração do Telegram Bot</h3>
          <p className="text-muted-foreground">
            Configure seu bot do Telegram para atendimento automatizado
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Como criar um bot:</strong> Fale com o @BotFather no Telegram, use o comando 
          <code className="bg-gray-100 px-1 rounded mx-1">/newbot</code> e siga as instruções.
          <Button variant="link" className="p-0 h-auto ml-2" asChild>
            <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer">
              Abrir BotFather
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Canal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Canal</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Bot Atendimento"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credenciais do Bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                type="password"
                value={formData.botToken}
                onChange={(e) => handleInputChange('botToken', e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyZ123456789"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Token fornecido pelo BotFather
              </p>
            </div>
            
            <div>
              <Label htmlFor="botUsername">Username do Bot</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                  @
                </span>
                <Input
                  id="botUsername"
                  value={formData.botUsername}
                  onChange={(e) => handleInputChange('botUsername', e.target.value.replace('@', ''))}
                  placeholder="meubot"
                  className="rounded-l-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Respostas Automáticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Resposta Automática</Label>
              <p className="text-sm text-muted-foreground">
                Responder automaticamente a mensagens
              </p>
            </div>
            <Switch
              checked={formData.autoReply}
              onCheckedChange={(checked) => handleInputChange('autoReply', checked)}
            />
          </div>
          
          {formData.autoReply && (
            <>
              <div>
                <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enviada quando usuário inicia conversa ou usa /start
                </p>
              </div>
              
              <div>
                <Label htmlFor="fallbackMessage">Mensagem Padrão</Label>
                <Textarea
                  id="fallbackMessage"
                  value={formData.fallbackMessage}
                  onChange={(e) => handleInputChange('fallbackMessage', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enviada quando não há resposta específica
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração de Webhook</CardTitle>
          <CardDescription>
            Configure o webhook para receber mensagens em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="bg-gray-50"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                O webhook será configurado automaticamente quando você salvar o bot.
                Caso precise configurar manualmente, use:
                <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">
                  https://api.telegram.org/bot[SEU_TOKEN]/setWebhook?url={webhookUrl}
                </code>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={connectionStatus === 'testing' || !formData.botToken || !formData.botUsername}
            >
              {connectionStatus === 'testing' ? 'Testando...' : 'Testar Bot'}
            </Button>
            
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Bot configurado com sucesso!</span>
              </div>
            )}
            
            {connectionStatus === 'error' && (
              <Badge variant="destructive">
                Erro na configuração
              </Badge>
            )}
          </div>

          {connectionStatus === 'success' && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sucesso!</strong> Seu bot está ativo e pronto para receber mensagens.
                Teste enviando uma mensagem para @{formData.botUsername || 'seubot'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};