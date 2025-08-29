import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle, AlertCircle, Instagram } from "lucide-react";

interface InstagramSetupProps {
  data: any;
  onUpdate: (data: any) => void;
}

export const InstagramSetup = ({ data, onUpdate }: InstagramSetupProps) => {
  const [formData, setFormData] = useState({
    name: data.name || 'Instagram Direct',
    description: data.description || 'Mensagens diretas do Instagram',
    appId: data.appId || '',
    businessAccountId: data.businessAccountId || '',
    accessToken: data.accessToken || '',
    autoReply: data.autoReply ?? true,
    welcomeMessage: data.welcomeMessage || '👋 Olá! Obrigado por entrar em contato conosco.',
    fallbackMessage: data.fallbackMessage || 'Em breve um de nossos atendentes responderá sua mensagem.',
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
    
    // Simular teste de conexão
    setTimeout(() => {
      if (formData.appId && formData.businessAccountId && formData.accessToken) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-pink-50">
          <Instagram className="w-6 h-6 text-pink-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuração do Instagram</h3>
          <p className="text-muted-foreground">
            Configure as credenciais para receber mensagens diretas do Instagram
          </p>
        </div>
      </div>

      {/* Informações da App Meta */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Pré-requisitos:</strong> Você precisa ter um App do Facebook/Meta configurado 
          com as permissões do Instagram. 
          <Button variant="link" className="p-0 h-auto ml-2" asChild>
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">
              Criar App Meta
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
                placeholder="Ex: Instagram Oficial"
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
              Informações do seu App Meta para Instagram
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
              <Label htmlFor="businessAccountId">Instagram Business Account ID</Label>
              <Input
                id="businessAccountId"
                value={formData.businessAccountId}
                onChange={(e) => handleInputChange('businessAccountId', e.target.value)}
                placeholder="ID da conta de negócios"
              />
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
            Configure mensagens automáticas para Instagram
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
              disabled={connectionStatus === 'testing' || !formData.appId || !formData.businessAccountId || !formData.accessToken}
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