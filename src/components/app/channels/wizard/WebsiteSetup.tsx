import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Globe, Copy } from "lucide-react";

interface WebsiteSetupProps {
  data: any;
  onUpdate: (data: any) => void;
}

export const WebsiteSetup = ({ data, onUpdate }: WebsiteSetupProps) => {
  const [formData, setFormData] = useState({
    name: data.name || 'Chat do Site',
    description: data.description || 'Widget de chat incorporado no site',
    domains: data.domains || [''],
    theme: data.theme || 'light',
    position: data.position || 'bottom-right',
    primaryColor: data.primaryColor || '#007bff',
    autoReply: data.autoReply ?? true,
    welcomeMessage: data.welcomeMessage || 'Olá! Como podemos ajudar você hoje?',
    fallbackMessage: data.fallbackMessage || 'Aguarde um momento, vamos conectar você com um atendente.',
    notifications: data.notifications || { email: true, push: true }
  });

  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleInputChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...formData.domains];
    newDomains[index] = value;
    handleInputChange('domains', newDomains);
  };

  const addDomain = () => {
    handleInputChange('domains', [...formData.domains, '']);
  };

  const removeDomain = (index: number) => {
    const newDomains = formData.domains.filter((_, i) => i !== index);
    handleInputChange('domains', newDomains);
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    
    setTimeout(() => {
      if (formData.domains.some(domain => domain.trim())) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    }, 1500);
  };

  const widgetCode = `<script>
  (function() {
    var widget = document.createElement('div');
    widget.id = 'chat-widget-${Date.now()}';
    widget.style.cssText = 'position:fixed;${formData.position.includes('bottom') ? 'bottom:20px;' : 'top:20px;'}${formData.position.includes('right') ? 'right:20px;' : 'left:20px;'}z-index:9999;';
    document.body.appendChild(widget);
    
    var script = document.createElement('script');
    script.src = 'https://app.exemplo.com/widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-50">
          <Globe className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Configuração do Chat do Site</h3>
          <p className="text-muted-foreground">
            Configure o widget de chat para seu website
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência do Widget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tema</Label>
              <Select value={formData.theme} onValueChange={(value) => handleInputChange('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Posição</Label>
              <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                  <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                  <SelectItem value="top-right">Superior Direita</SelectItem>
                  <SelectItem value="top-left">Superior Esquerda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="primaryColor">Cor Principal</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  placeholder="#007bff"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domínios Autorizados</CardTitle>
          <CardDescription>
            Liste os domínios onde o widget poderá ser usado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.domains.map((domain, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={domain}
                onChange={(e) => handleDomainChange(index, e.target.value)}
                placeholder="https://www.exemplo.com"
              />
              {formData.domains.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDomain(index)}
                >
                  Remover
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addDomain} size="sm">
            Adicionar Domínio
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Respostas Automáticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Resposta Automática</Label>
              <p className="text-sm text-muted-foreground">
                Mensagem automática quando usuário inicia chat
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
              </div>
              
              <div>
                <Label htmlFor="fallbackMessage">Mensagem Fallback</Label>
                <Textarea
                  id="fallbackMessage"
                  value={formData.fallbackMessage}
                  onChange={(e) => handleInputChange('fallbackMessage', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Código de Instalação</CardTitle>
          <CardDescription>
            Cole este código antes do fechamento da tag &lt;/body&gt; do seu site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                <code>{widgetCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => navigator.clipboard.writeText(widgetCode)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Instalação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              disabled={connectionStatus === 'testing' || !formData.domains.some(d => d.trim())}
            >
              {connectionStatus === 'testing' ? 'Verificando...' : 'Verificar Instalação'}
            </Button>
            
            {connectionStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Widget configurado com sucesso!</span>
              </div>
            )}
            
            {connectionStatus === 'error' && (
              <Badge variant="destructive">
                Erro na configuração
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};