import { useState, useRef, useEffect } from "react";
import { ScheduleSettings } from "@/components/app/schedule/ScheduleSettings";
import { N8nIntegration } from "@/components/app/integrations/N8nIntegration";
import { APIUsage } from "@/components/app/integrations/APIUsage";
import { ApiDocsSidebar } from "@/components/app/api/ApiDocsSidebar";
import { ApiDocsContent } from "@/components/app/api/ApiDocsContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast as sonnerToast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Code, Webhook, FileText } from "lucide-react";
import { PlanUsageCard } from "@/components/app/PlanUsageCard";

const Settings = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("profile");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isTabsOverflowing, setIsTabsOverflowing] = useState(false);
  
  useEffect(() => {
    if (!tabsRef.current || !isMobile) return;
    
    const checkOverflow = () => {
      const element = tabsRef.current;
      if (element) {
        setIsTabsOverflowing(element.scrollWidth > element.clientWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    return () => window.removeEventListener('resize', checkOverflow);
  }, [isMobile]);
  
  const [name, setName] = useState("Admin");
  const [email, setEmail] = useState("admin@empresa.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [companyName, setCompanyName] = useState("Empresa S.A.");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [language, setLanguage] = useState("pt-BR");
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);

  // Integration states
  const [integrationsTab, setIntegrationsTab] = useState("api");
  const [apiActiveSection, setApiActiveSection] = useState("introduction");

  // Mock active connections
  const activeConnections = [
    {
      id: "conn_123",
      name: "WhatsApp Business API",
      type: "channel",
      status: "active",
      lastUsed: "2024-05-10T14:32:00Z",
      usage: {
        requests: 742,
        errors: 3,
        successRate: "99.6%"
      }
    },
    {
      id: "conn_456",
      name: "Google Calendar",
      type: "calendar",
      status: "active",
      lastUsed: "2024-05-09T18:15:00Z",
      usage: {
        requests: 127,
        errors: 0,
        successRate: "100%"
      }
    },
    {
      id: "conn_789",
      name: "n8n Workflow",
      type: "automation",
      status: "active",
      lastUsed: "2024-05-10T09:45:00Z",
      usage: {
        requests: 35,
        errors: 1,
        successRate: "97.1%"
      }
    },
    {
      id: "conn_321",
      name: "Facebook Custom Integration",
      type: "channel",
      status: "warning",
      lastUsed: "2024-05-08T11:20:00Z",
      usage: {
        requests: 94,
        errors: 8,
        successRate: "91.5%"
      }
    }
  ];

  const tabItems = [
    { id: "profile", label: "Perfil" },
    { id: "company", label: "Empresa" },
    { id: "notifications", label: "Notificações" },
    { id: "integrations", label: "Integrações" },
    { id: "api", label: "API" },
    { id: "billing", label: "Faturas" },
    { id: "schedule", label: "Agenda" }
  ];
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleSaveProfile = () => {
    if (password && password !== confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Perfil atualizado",
      description: "Suas informações de perfil foram atualizadas com sucesso."
    });
  };
  
  const handleSaveCompany = () => {
    toast({
      title: "Empresa atualizada",
      description: "As informações da empresa foram atualizadas com sucesso."
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: "Notificações atualizadas",
      description: "Suas preferências de notificação foram salvas."
    });
  };

  // Integration handlers
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("sk_live_••••••••••••••••••••••");
    sonnerToast.success("Chave API copiada para a área de transferência");
  };

  const handleGenerateNewKey = () => {
    sonnerToast.success("Nova chave API gerada com sucesso");
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTabsNavigation = () => {
    if (isMobile && isTabsOverflowing) {
      const activeItem = tabItems.find(tab => tab.id === activeTab);
      
      return (
        <div className="mb-8 flex justify-center w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {activeItem?.label || "Selecione uma aba"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[200px]" align="center">
              {tabItems.map(tab => (
                <DropdownMenuItem 
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={activeTab === tab.id ? "bg-accent" : ""}
                >
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    
    return (
      <div ref={tabsRef} className="relative mb-8 w-full overflow-x-auto">
        <TabsList className={cn(
          "w-full",
          isMobile ? "grid grid-cols-7" : "flex justify-center flex-wrap"
        )}>
          {tabItems.map(tab => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className={isMobile ? "text-xs sm:text-sm" : ""}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    );
  };
  
  return (
    <div className="h-full">
      <main className="h-full overflow-auto">
      <div className={cn(
        "flex-1 p-4 pb-16 overflow-y-auto",
        isMobile ? "w-full" : ""
      )}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Configurações</h1>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            {renderTabsNavigation()}
            
            <TabsContent value="profile">
              <Card>
                <CardHeader className="text-center md:text-left">
                  <CardTitle>Informações de Perfil</CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Atualize suas informações pessoais e credenciais de acesso.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      aria-label="Nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      aria-label="Email"
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-4">Alterar Senha</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Nova Senha</Label>
                        <Input 
                          id="password" 
                          type="password" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          aria-label="Nova Senha"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Senha</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          aria-label="Confirmar Senha"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile}
                    className="bg-bonina hover:bg-bonina/90 w-full md:w-auto"
                  >
                    Salvar Alterações
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="company">
              <Card>
                <CardHeader className="text-center md:text-left">
                  <CardTitle>Informações da Empresa</CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Configure os dados da sua empresa ou organização.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa</Label>
                    <Input 
                      id="company-name" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                      aria-label="Nome da Empresa"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <select
                        id="timezone"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        aria-label="Fuso Horário"
                      >
                        <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                        <option value="America/Manaus">Manaus (GMT-4)</option>
                        <option value="America/Belem">Belém (GMT-3)</option>
                        <option value="America/Bahia">Salvador (GMT-3)</option>
                        <option value="America/Noronha">Noronha (GMT-2)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <select
                        id="language"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        aria-label="Idioma"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (United States)</option>
                        <option value="es-ES">Español (España)</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Label htmlFor="company-logo">Logo da Empresa</Label>
                    <div className="flex items-center space-x-4 flex-wrap gap-2">
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 12v0"></path>
                          <path d="M12 6v0"></path>
                          <path d="M12 18v0"></path>
                        </svg>
                      </div>
                      <Button variant="outline" className="flex-1 md:flex-none">
                        Fazer Upload
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveCompany}
                    className="bg-bonina hover:bg-bonina/90 w-full md:w-auto"
                  >
                    Salvar Alterações
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader className="text-center md:text-left">
                  <CardTitle>Preferências de Notificação</CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Configure como e quando você deseja receber notificações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      id="email-notifications" 
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="email-notifications">Notificações por Email</Label>
                      <p className="text-sm text-gray-500">
                        Receba emails quando novas mensagens chegarem ou houver atividade importante.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      id="desktop-notifications" 
                      checked={desktopNotifications}
                      onChange={(e) => setDesktopNotifications(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="desktop-notifications">Notificações no Desktop</Label>
                      <p className="text-sm text-gray-500">
                        Receba alertas no navegador quando novas mensagens chegarem.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <input 
                      type="checkbox" 
                      id="sound-notifications" 
                      checked={soundNotifications}
                      onChange={(e) => setSoundNotifications(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="sound-notifications">Notificações Sonoras</Label>
                      <p className="text-sm text-gray-500">
                        Toque um som quando novas mensagens chegarem.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveNotifications}
                    className="bg-bonina hover:bg-bonina/90 w-full md:w-auto"
                  >
                    Salvar Alterações
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="billing" className="space-y-6">
              <PlanUsageCard />
              
              <Card>
                <CardHeader className="text-center md:text-left">
                  <CardTitle>Informações de Faturamento</CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Gerencie seu plano e visualize suas faturas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                      <div>
                        <h3 className="font-medium">Plano Atual</h3>
                        <p className="text-sm text-gray-500">Corporativo</p>
                      </div>
                      <Button variant="outline" className="w-full md:w-auto">Alterar Plano</Button>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="mb-1">Próxima cobrança: 15/07/2025</p>
                      <p>Valor: R$ 197,00</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">Histórico de Faturas</h3>
                    <div className="border rounded-md overflow-hidden overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">15/06/2025</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">Plano Corporativo</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">R$ 197,00</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Pago
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">15/05/2025</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">Plano Corporativo</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">R$ 197,00</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Pago
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">15/04/2025</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">Plano Corporativo</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">R$ 197,00</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Pago
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col md:flex-row gap-2">
                  <Button variant="outline" className="w-full md:w-auto">Exportar Faturas</Button>
                  <Button variant="outline" className="w-full md:w-auto">Atualizar Forma de Pagamento</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="schedule">
              <Card>
                <CardHeader className="text-center md:text-left">
                  <CardTitle>Configurações da Agenda</CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Gerencie as notificações e permissões da sua agenda.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScheduleSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations">
              <div className="space-y-6">
                <Tabs value={integrationsTab} onValueChange={setIntegrationsTab} className="space-y-6">
                  <TabsList className="w-full grid grid-cols-3 mb-4">
                    <TabsTrigger value="api">API</TabsTrigger>
                    <TabsTrigger value="n8n">n8n para Agentes</TabsTrigger>
                    <TabsTrigger value="connections">Conexões Ativas</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="api">
                    {/* API Integration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-blue-600" />
                          API
                        </CardTitle>
                        <CardDescription>
                          Acesse nossa API para integrações personalizadas
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Chave de API</h4>
                          <div className="flex">
                            <div className="bg-gray-100 p-2 rounded-l text-xs font-mono flex-1 truncate">
                              sk_live_••••••••••••••••••••••
                            </div>
                            <Button variant="outline" className="rounded-l-none" onClick={handleCopyApiKey}>
                              Copiar
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Não compartilhe esta chave. Ela concede acesso completo à sua conta.
                          </p>
                        </div>
                        
                        <div className="pt-2">
                          <Button variant="outline" size="sm" onClick={handleGenerateNewKey}>
                            Gerar Nova Chave
                          </Button>
                        </div>
                        
                        <APIUsage />

                        <div className="space-y-2 pt-4">
                          <h4 className="font-medium">Endpoints disponíveis</h4>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>GET /contacts - Lista todos os contatos</li>
                            <li>POST /messages - Envia mensagens</li>
                            <li>GET /events - Lista eventos da agenda</li>
                            <li>POST /events - Cria um evento na agenda</li>
                            <li>GET /agents - Lista todos os agentes</li>
                            <li>GET /agents/{"{id}"}/knowledge - Acessa base de conhecimento do agente</li>
                            <li>GET /agents/{"{id}"}/processes - Acessa processos do agente</li>
                            <li>POST /agents/{"{id}"}/conversation - Inicia uma conversa com o agente</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="n8n">
                    <N8nIntegration />
                  </TabsContent>
                  
                  <TabsContent value="connections">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Webhook className="h-5 w-5 text-indigo-600" />
                          Conexões Ativas
                        </CardTitle>
                        <CardDescription>
                          Gerencie todas as suas integrações e conexões ativas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {activeConnections.map((connection) => (
                              <Card key={connection.id} className="border-l-4" style={{ borderLeftColor: getStatusColor(connection.status) }}>
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{connection.name}</CardTitle>
                                    <Badge variant={connection.status === "active" ? "default" : "destructive"}>
                                      {connection.status === "active" ? "Ativo" : "Atenção"}
                                    </Badge>
                                  </div>
                                  <CardDescription>
                                    Tipo: {connection.type === "channel" ? "Canal" : connection.type === "calendar" ? "Calendário" : "Automação"} • 
                                    Última atividade: {formatDate(connection.lastUsed)}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <div className="text-gray-500">Requisições</div>
                                      <div className="font-medium">{connection.usage.requests}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Erros</div>
                                      <div className="font-medium">{connection.usage.errors}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-500">Taxa de Sucesso</div>
                                      <div className="font-medium">{connection.usage.successRate}</div>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex justify-between">
                                  <Button variant="outline" size="sm">Logs</Button>
                                  <Button variant="outline" size="sm">Configurar</Button>
                                  <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50">Desconectar</Button>
                                </CardFooter>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="api">
              <Card>
                <CardHeader className="text-center md:text-left">
                  <CardTitle className="flex items-center gap-2 justify-center md:justify-start">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documentação da API
                  </CardTitle>
                  <CardDescription className="text-center md:text-left">
                    Acesse a documentação completa da nossa API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] flex flex-col md:flex-row border rounded-lg overflow-hidden">
                    {/* API Documentation Sidebar */}
                    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-gray-50">
                      <ApiDocsSidebar 
                        activeSection={apiActiveSection}
                        setActiveSection={setApiActiveSection}
                      />
                    </div>
                    
                    {/* API Documentation Content */}
                    <div className="flex-1 overflow-y-auto">
                      <ApiDocsContent activeSection={apiActiveSection} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
