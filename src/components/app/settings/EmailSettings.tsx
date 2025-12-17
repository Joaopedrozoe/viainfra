import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Server, Shield, TestTube, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export const EmailSettings = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'testing'>('disconnected');
  const [showPassword, setShowPassword] = useState(false);
  
  // SMTP Configuration
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecurity, setSmtpSecurity] = useState("TLS");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('smtp_settings')
          .select('*')
          .eq('company_id', profile.company_id)
          .maybeSingle();

        if (error) {
          console.error('Error loading SMTP settings:', error);
          return;
        }

        if (data) {
          setExistingId(data.id);
          setSmtpHost(data.smtp_host || '');
          setSmtpPort(String(data.smtp_port) || '587');
          setSmtpUser(data.smtp_user || '');
          setSmtpPassword(data.smtp_password || '');
          setSmtpSecurity(data.smtp_security || 'TLS');
          setFromEmail(data.from_email || '');
          setFromName(data.from_name || '');
          setConnectionStatus(data.is_active ? 'connected' : 'disconnected');
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    loadSettings();
  }, [profile?.company_id]);

  const handleTestConnection = async () => {
    if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setConnectionStatus('testing');
    setIsTesting(true);

    try {
      // Test by sending email to the from address
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: fromEmail,
          subject: 'Teste de Conexão SMTP - ChatVia',
          html: `
            <h1>Teste de Conexão SMTP</h1>
            <p>Se você recebeu este e-mail, sua configuração SMTP está funcionando corretamente!</p>
            <p><strong>Servidor:</strong> ${smtpHost}:${smtpPort}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          `,
          companyId: profile?.company_id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setConnectionStatus('connected');
        toast.success("Conexão SMTP testada com sucesso! Verifique seu e-mail.");
      } else {
        throw new Error(data?.error || 'Falha no teste');
      }
    } catch (error: any) {
      setConnectionStatus('disconnected');
      console.error('SMTP test error:', error);
      toast.error(error.message || "Falha na conexão SMTP. Verifique as configurações.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!smtpHost || !smtpUser || !smtpPassword || !fromEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!profile?.company_id) {
      toast.error("Empresa não encontrada");
      return;
    }

    setIsLoading(true);

    try {
      const settingsData = {
        company_id: profile.company_id,
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort),
        smtp_user: smtpUser.trim(),
        smtp_password: smtpPassword,
        smtp_security: smtpSecurity,
        from_email: fromEmail.trim(),
        from_name: fromName.trim() || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let error;

      if (existingId) {
        // Update existing
        const result = await supabase
          .from('smtp_settings')
          .update(settingsData)
          .eq('id', existingId);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('smtp_settings')
          .insert(settingsData)
          .select()
          .single();
        error = result.error;
        if (result.data) {
          setExistingId(result.data.id);
        }
      }

      if (error) throw error;

      setConnectionStatus('connected');
      toast.success("Configurações de e-mail salvas com sucesso!");
    } catch (error: any) {
      console.error('Error saving SMTP settings:', error);
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Configurado</Badge>;
      case 'testing':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Testando...</Badge>;
      default:
        return <Badge variant="outline">Não configurado</Badge>;
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
                Configure seu servidor SMTP para envio de e-mails do sistema (recuperação de senha, notificações, etc).
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
                    <p className="text-xs text-muted-foreground">
                      Ex: smtp.gmail.com, smtp.office365.com
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Porta *</Label>
                    <Select value={smtpPort} onValueChange={setSmtpPort}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 (Não seguro)</SelectItem>
                        <SelectItem value="587">587 (TLS - Recomendado)</SelectItem>
                        <SelectItem value="465">465 (SSL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Usuário/E-mail *</Label>
                    <Input
                      id="smtp-user"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="noreply@viainfra.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Senha/App Password *</Label>
                    <div className="relative">
                      <Input
                        id="smtp-password"
                        type={showPassword ? "text" : "password"}
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Para Gmail/Google Workspace, use uma "Senha de App"
                    </p>
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
                      <SelectItem value="TLS">TLS (Recomendado)</SelectItem>
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
                    <p className="text-xs text-muted-foreground">
                      Deve ser autorizado no servidor SMTP
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">Nome do Remetente</Label>
                    <Input
                      id="from-name"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="ChatVia ViaInfra"
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
                  Enviaremos um e-mail de teste para {fromEmail || 'o endereço do remetente'}.
                </p>
                <Button 
                  onClick={handleTestConnection}
                  disabled={isTesting || !smtpHost || !smtpUser || !smtpPassword || !fromEmail}
                  variant="outline"
                  size="sm"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando teste...
                    </>
                  ) : (
                    "Testar Conexão"
                  )}
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
                      Template usado para envio de códigos de redefinição de senha.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg text-sm">
                      <p><strong>Assunto:</strong> Redefinição de Senha - ChatVia</p>
                      <p className="mt-2"><strong>Conteúdo:</strong> Inclui código de 6 dígitos válido por 30 minutos.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Boas-vindas</CardTitle>
                    <CardDescription>
                      Template enviado para novos usuários cadastrados (em breve).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                      Template será disponibilizado em atualizações futuras.
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
            disabled={isLoading || !smtpHost || !smtpUser || !smtpPassword || !fromEmail}
            variant="viainfra"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
