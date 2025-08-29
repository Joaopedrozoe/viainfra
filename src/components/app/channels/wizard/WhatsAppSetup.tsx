import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, CheckCircle, AlertCircle, MessageCircle, Phone } from "lucide-react";

interface WhatsAppSetupProps {
  data: any;
  onUpdate: (data: any) => void;
}

export const WhatsAppSetup = ({ data, onUpdate }: WhatsAppSetupProps) => {
  const [formData, setFormData] = useState({
    name: data.name || 'WhatsApp Business',
    description: data.description || 'Canal oficial do WhatsApp Business',
    provider: data.provider || 'WhatsApp Cloud API',
    businessAccountId: data.businessAccountId || '',
    phoneNumberId: data.phoneNumberId || '',
    phoneNumber: data.phoneNumber || '',
    accessToken: data.accessToken || '',
    autoReply: data.autoReply ?? true,
    welcomeMessage: data.welcomeMessage || 'Olá! Bem-vindo ao nosso atendimento via WhatsApp.',
    fallbackMessage: data.fallbackMessage || 'Desculpe, não entendi. Um atendente entrará em contato.',
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
      if (formData.businessAccountId && formData.phoneNumberId && formData.accessToken) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-50">
          <MessageCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuração do WhatsApp Business</h3>
          <p className="text-muted-foreground">
            Configure a API oficial do WhatsApp Business para enviar e receber mensagens
          </p>
        </div>
      </div>

      {/* Informações sobre WhatsApp API */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Para usar o WhatsApp Business API, você precisa de uma 
          conta Business verificada e aprovação do Meta.
          <Button variant="link" className="p-0 h-auto ml-2" asChild>
            <a href="https://business.whatsapp.com/" target="_blank" rel="noopener noreferrer">
              Saiba mais
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
                placeholder="Ex: WhatsApp Atendimento"
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

            <div>
              <Label htmlFor="provider">Provedor</Label>
              <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp Cloud API">WhatsApp Cloud API (Meta)</SelectItem>
                  <SelectItem value="Twilio">Twilio WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Credenciais da API */}
        <Card>
          <CardHeader>
            <CardTitle>Credenciais da API</CardTitle>
            <CardDescription>
              Informações da sua conta WhatsApp Business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessAccountId">Business Account ID</Label>
              <Input
                id="businessAccountId"
                value={formData.businessAccountId}
                onChange={(e) => handleInputChange('businessAccountId', e.target.value)}
                placeholder="ID da conta business do WhatsApp"
              />
            </div>
            
            <div>
              <Label htmlFor="phoneNumberId">Phone Number ID</Label>
              <Input
                id="phoneNumberId"
                value={formData.phoneNumberId}
                onChange={(e) => handleInputChange('phoneNumberId', e.target.value)}
                placeholder="ID do número de telefone"
              />
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Número de Telefone</Label>
              <div className="flex gap-2">
                <Phone className="w-4 h-4 mt-3 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={(e) => handleInputChange('accessToken', e.target.value)}
                placeholder="Token de acesso da API"
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
            Configure mensagens automáticas para WhatsApp
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
                <p className="text-xs text-muted-foreground mt-1">
                  Dica: Use emojis para tornar a mensagem mais amigável 😊
                </p>
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
            URL que receberá as mensagens do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value="https://app.exemplo.com/webhooks/whatsapp"
                  readOnly
                  className="bg-gray-50"
                />
                <Button variant="outline" size="sm">
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure esta URL no Meta Business Manager
              </p>
            </div>
            
            <div>
              <Label>Verify Token</Label>
              <Input
                value="whatsapp-verify-token-demo"
                readOnly
                className="bg-gray-50"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Certifique-se de que o webhook está configurado para receber os eventos:
                <code className="bg-gray-100 px-1 rounded text-xs ml-1">messages</code> e 
                <code className="bg-gray-100 px-1 rounded text-xs ml-1">message_status</code>
              </AlertDescription>
            </Alert>
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
              disabled={connectionStatus === 'testing' || !formData.businessAccountId || !formData.phoneNumberId || !formData.accessToken}
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

          {connectionStatus === 'success' && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sucesso!</strong> Seu número WhatsApp está pronto para enviar e receber mensagens.
                Você pode enviar uma mensagem de teste para verificar se tudo está funcionando.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};