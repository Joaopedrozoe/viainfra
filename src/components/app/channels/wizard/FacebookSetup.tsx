import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle, AlertCircle, Facebook } from "lucide-react";

interface FacebookSetupProps {
  data: any;
  onUpdate: (data: any) => void;
}

export const FacebookSetup = ({ data, onUpdate }: FacebookSetupProps) => {
  const [formData, setFormData] = useState({
    name: data.name || 'Facebook Messenger',
    description: data.description || 'Página do Facebook Messenger',
    appId: data.appId || '',
    pageId: data.pageId || '',
    pageAccessToken: data.pageAccessToken || '',
    autoReply: data.autoReply ?? true,
    welcomeMessage: data.welcomeMessage || 'Olá! Obrigado por entrar em contato com nossa página.',
    fallbackMessage: data.fallbackMessage || 'Em breve responderemos sua mensagem.',
    notifications: data.notifications || { email: true, push: true }
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleInputChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    
    // Simular teste de conexão
    setTimeout(() => {
      if (formData.appId && formData.pageId && formData.pageAccessToken) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <Facebook className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuração do Facebook Messenger</h3>
          <p className="text-muted-foreground">
            Configure sua página do Facebook para receber mensagens via Messenger
          </p>
        </div>
      </div>

      {/* Informações da App Meta */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Pré-requisitos:</strong> Você precisa ter uma página do Facebook e um App Meta 
          com as permissões do Messenger configuradas.
          <Button variant="link" className="p-0 h-auto ml-2" asChild>
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">
              Configurar App Meta
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Configurações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Canal</CardTitle>
            <CardDescription>
              Defina nome e descrição para identificar este canal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Canal</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Facebook Página Oficial"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva como este canal será usado"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Credenciais da API */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciais da API</CardTitle>
            <CardDescription>
              Informações do seu App Meta e página do Facebook
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="appId">App ID</Label>
              <Input
                id="appId"
                value={formData.appId}
                onChange={(e) => handleInputChange('appId', e.target.value)}
                placeholder="Seu App ID do Meta"
              />
            </div>
            
            <div>
              <Label htmlFor="pageId">Page ID</Label>
              <Input
                id="pageId"
                value={formData.pageId}
                onChange={(e) => handleInputChange('pageId', e.target.value)}
                placeholder="ID da sua página do Facebook"
              />
            </div>
            
            <div>
              <Label htmlFor="pageAccessToken">Page Access Token</Label>
              <Input
                id="pageAccessToken"
                type="password"
                value={formData.pageAccessToken}
                onChange={(e) => handleInputChange('pageAccessToken', e.target.value)}
                placeholder="Token de acesso da página"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Resposta Automática */}
      <Card>
        <CardHeader>
          <CardTitle>Respostas Automáticas</CardTitle>
          <CardDescription>
            Configure mensagens automáticas para Messenger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Resposta Automática</Label>
              <p className="text-sm text-muted-foreground">
                Enviar mensagem automática para novas conversas
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
                  placeholder="Mensagem enviada quando alguém inicia uma conversa"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="fallbackMessage">Mensagem Fallback</Label>
                <Textarea
                  id="fallbackMessage"
                  value={formData.fallbackMessage}
                  onChange={(e) => handleInputChange('fallbackMessage', e.target.value)}
                  placeholder="Mensagem quando não há resposta automática disponível"
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Webhook</CardTitle>
          <CardDescription>
            URL que receberá as mensagens do Facebook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value="https://app.exemplo.com/webhooks/facebook"
                  readOnly
                  className="bg-gray-50"
                />
                <Button variant="outline" size="sm">
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure esta URL no seu App Meta
              </p>
            </div>
            
            <div>
              <Label>Verify Token</Label>
              <Input
                value="facebook-verify-token-demo"
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Conexão</CardTitle>
          <CardDescription>
            Verificar se as credenciais estão corretas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={connectionStatus === 'testing' || !formData.appId || !formData.pageId || !formData.pageAccessToken}
            >
              {connectionStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
            </Button>
            
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Conexão bem-sucedida!</span>
              </div>
            )}
            
            {connectionStatus === 'error' && (
              <Badge variant="destructive">
                Erro na conexão
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};