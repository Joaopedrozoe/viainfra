import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Server, Shield, TestTube, AlertCircle } from "lucide-react";

export const EmailSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'testing'>('disconnected');
  
  // SMTP Configuration
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecurity, setSmtpSecurity] = useState("TLS");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  const handleTestConnection = async () => {
    if (!smtpHost || !smtpUser || !smtpPassword) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setConnectionStatus('testing');
    setIsLoading(true);

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 3000));
      setConnectionStatus('connected');
      toast.success("Conexão SMTP testada com sucesso!");
    } catch (error) {
      setConnectionStatus('disconnected');
      toast.error("Falha na conexão SMTP. Verifique as configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configurações de e-mail salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'testing':
        return <Badge className="bg-yellow-100 text-yellow-800">Testando...</Badge>;
      default:
        return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de E-mail
              </CardTitle>
              <CardDescription>
                Configure seu servidor SMTP para envio de e-mails do sistema.
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="smtp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smtp">Configuração SMTP</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="smtp" className="space-y-6">
              {/* Server Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-4 w-4" />
                  <h3 className="text-lg font-medium">Servidor SMTP</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">Servidor SMTP *</Label>
                    <Input
                      id="smtp-host"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Porta *</Label>
                    <Select value={smtpPort} onValueChange={setSmtpPort}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 (Não seguro)</SelectItem>
                        <SelectItem value="587">587 (TLS)</SelectItem>
                        <SelectItem value="465">465 (SSL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Usuário *</Label>
                    <Input
                      id="smtp-user"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="seu-email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Senha *</Label>
                    <Input
                      id="smtp-password"
                      type="password"
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-security">Segurança</Label>
                  <Select value={smtpSecurity} onValueChange={setSmtpSecurity}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Nenhuma</SelectItem>
                      <SelectItem value="TLS">TLS</SelectItem>
                      <SelectItem value="SSL">SSL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sender Configuration */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4" />
                  <h3 className="text-lg font-medium">Remetente</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-email">E-mail do Remetente *</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="noreply@viainfra.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">Nome do Remetente</Label>
                    <Input
                      id="from-name"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="ChatVia Infra"
                    />
                  </div>
                </div>
              </div>

              {/* Test Section */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TestTube className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Testar Configuração</h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Teste a conexão SMTP antes de salvar as configurações.
                </p>
                <Button 
                  onClick={handleTestConnection}
                  disabled={isLoading || connectionStatus === 'testing'}
                  variant="outline"
                  size="sm"
                >
                  {connectionStatus === 'testing' ? "Testando..." : "Testar Conexão"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4" />
                <h3 className="text-lg font-medium">Templates de E-mail</h3>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Redefinição de Senha</CardTitle>
                    <CardDescription>
                      Template usado para envio de links de redefinição de senha.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="reset-subject">Assunto</Label>
                      <Input
                        id="reset-subject"
                        defaultValue="Redefinir sua senha - ChatVia"
                        placeholder="Assunto do e-mail"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Boas-vindas</CardTitle>
                    <CardDescription>
                      Template enviado para novos usuários cadastrados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="welcome-subject">Assunto</Label>
                      <Input
                        id="welcome-subject"
                        defaultValue="Bem-vindo ao ChatVia!"
                        placeholder="Assunto do e-mail"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSaveSettings}
            disabled={isLoading}
            variant="viainfra"
          >
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};