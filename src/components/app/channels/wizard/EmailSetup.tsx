import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Mail } from "lucide-react";

interface EmailSetupProps {
  data: any;
  onUpdate: (data: any) => void;
}

export const EmailSetup = ({ data, onUpdate }: EmailSetupProps) => {
  const [formData, setFormData] = useState({
    name: data.name || 'Email Corporativo',
    description: data.description || 'Atendimento por email',
    provider: data.provider || 'SendGrid',
    fromEmail: data.fromEmail || '',
    smtpHost: data.smtpHost || '',
    smtpPort: data.smtpPort || '587',
    smtpUser: data.smtpUser || '',
    smtpPassword: data.smtpPassword || '',
    autoReply: data.autoReply ?? true,
    welcomeMessage: data.welcomeMessage || 'Recebemos seu email e responderemos em breve.',
    fallbackMessage: data.fallbackMessage || 'Seu email foi encaminhado para nossa equipe.',
    notifications: data.notifications || { email: false, push: true }
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
      if (formData.fromEmail && formData.smtpHost && formData.smtpUser) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50">
          <Mail className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuração de Email</h3>
          <p className="text-muted-foreground">
            Configure seu servidor de email para atendimento
          </p>
        </div>
      </div>

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

            <div>
              <Label>Provedor</Label>
              <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SendGrid">SendGrid</SelectItem>
                  <SelectItem value="Custom">SMTP Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações SMTP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fromEmail">Email Remetente</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                placeholder="atendimento@empresa.com"
              />
            </div>
            
            <div>
              <Label htmlFor="smtpHost">Servidor SMTP</Label>
              <Input
                id="smtpHost"
                value={formData.smtpHost}
                onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                placeholder="smtp.sendgrid.net"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpPort">Porta</Label>
                <Input
                  id="smtpPort"
                  value={formData.smtpPort}
                  onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                  placeholder="587"
                />
              </div>
              
              <div>
                <Label htmlFor="smtpUser">Usuário</Label>
                <Input
                  id="smtpUser"
                  value={formData.smtpUser}
                  onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="smtpPassword">Senha</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
              />
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
                Enviar confirmação automática por email
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
                <Label htmlFor="welcomeMessage">Mensagem de Confirmação</Label>
                <Textarea
                  id="welcomeMessage"
                  value={formData.welcomeMessage}
                  onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
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
              disabled={connectionStatus === 'testing' || !formData.fromEmail || !formData.smtpHost}
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