
import React, { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Code, Webhook, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { N8nIntegration } from "@/components/app/integrations/N8nIntegration";
import { APIUsage } from "@/components/app/integrations/APIUsage";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const Integrations = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("api");

  // Function to copy API key to clipboard
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("sk_live_••••••••••••••••••••••");
    toast.success("Chave API copiada para a área de transferência");
  };

  // Function to generate a new API key
  const handleGenerateNewKey = () => {
    toast.success("Nova chave API gerada com sucesso");
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
  
  return (
    <div className="h-full">
      <main className="h-full overflow-auto">
      <div className={cn(
        "flex-1 p-4 pb-16 overflow-y-auto",
        isMobile ? "w-full" : ""
      )}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Integrações</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                <CardFooter>
                  <Button variant="outline" asChild>
                    <Link to="/api-docs">
                      Ver Documentação Completa da API
                    </Link>
                  </Button>
                </CardFooter>
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
        </div>
      </main>
    </div>
  );
};

export default Integrations;
