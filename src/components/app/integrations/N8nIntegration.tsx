
import { useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WebhookForm } from "@/components/app/integrations/WebhookForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Webhook, FileJson, List, Brain } from "lucide-react";
import { toast } from "sonner";
import { mockAgents } from "@/components/app/agents/mockData";

export const N8nIntegration = () => {
  const [selectedAgent, setSelectedAgent] = useState("");
  const [webhookURL, setWebhookURL] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [configTab, setConfigTab] = useState("configuration");
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestConnection = () => {
    if (!webhookURL) {
      toast.error("Por favor, insira uma URL de webhook válida");
      return;
    }

    setTestResult(null);
    
    // Simulate testing the connection
    setTimeout(() => {
      setTestResult({
        success: true,
        message: "Conexão com n8n estabelecida com sucesso!",
        response: JSON.stringify({
          status: "success",
          agent_id: selectedAgent,
          capabilities: ["process_messages", "access_knowledge_base", "execute_processes"]
        }, null, 2),
        requestTime: "356ms"
      });
      
      toast.success("Conexão com n8n testada com sucesso!");
    }, 1500);
  };

  const handleSaveConfiguration = () => {
    if (!selectedAgent) {
      toast.error("Por favor, selecione um agente");
      return;
    }

    if (!webhookURL) {
      toast.error("Por favor, insira uma URL de webhook válida");
      return;
    }

    toast.success(`Configuração salva para o agente ${selectedAgent}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-600" />
            Integração com n8n para Agentes
          </CardTitle>
          <CardDescription>
            Configure seus agentes para utilizar o n8n como ferramenta de trabalho e processador de tarefas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
            <AlertDescription>
              A integração com n8n permite que seus agentes acessem ferramentas externas, consultem dados e executem workflows complexos.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue={configTab} onValueChange={setConfigTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuration">Configuração</TabsTrigger>
              <TabsTrigger value="documentation">Documentação</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuration" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent">Selecione um Agente</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger id="agent">
                      <SelectValue placeholder="Escolha um agente para configurar" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAgents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL do Webhook n8n</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://seu-n8n.com/webhook/agente-ia"
                    value={webhookURL}
                    onChange={(e) => setWebhookURL(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    URL do webhook do n8n que receberá as solicitações do agente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-token">Token de Autenticação (opcional)</Label>
                  <Input
                    id="auth-token"
                    placeholder="Token de autenticação para seu webhook"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    type="password"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recursos Compartilhados</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="share-knowledge" className="checkbox" defaultChecked />
                      <Label htmlFor="share-knowledge" className="font-normal">Base de Conhecimento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="share-processes" className="checkbox" defaultChecked />
                      <Label htmlFor="share-processes" className="font-normal">Processos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="share-conversation" className="checkbox" defaultChecked />
                      <Label htmlFor="share-conversation" className="font-normal">Histórico de Conversas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="share-user-data" className="checkbox" />
                      <Label htmlFor="share-user-data" className="font-normal">Dados do Usuário</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={!webhookURL.trim()}
                  >
                    Testar Conexão
                  </Button>
                  <Button
                    onClick={handleSaveConfiguration}
                    disabled={!selectedAgent || !webhookURL.trim()}
                    className="bg-viainfra-primary hover:bg-viainfra-primary/90"
                  >
                    Salvar Configuração
                  </Button>
                </div>

                {testResult && (
                  <div className="mt-4 border rounded-md p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult.message}
                      </h3>
                      <span className="text-xs text-gray-500">{testResult.requestTime}</span>
                    </div>
                    {testResult.response && (
                      <div className="mt-2">
                        <Label className="text-xs mb-1 block">Resposta:</Label>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                          {testResult.response}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="documentation">
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Configure o n8n para funcionar como uma extensão dos seus agentes de IA, permitindo acesso à base de conhecimento e execução de processos complexos.
                </p>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="setup">
                    <AccordionTrigger className="text-sm font-medium">Configuração Inicial</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Crie um novo workflow no n8n</li>
                        <li>Adicione um nó "Webhook" como trigger</li>
                        <li>Configure o webhook para receber solicitações POST</li>
                        <li>Copie a URL do webhook e cole no campo "URL do Webhook n8n" acima</li>
                        <li>Salve e ative o workflow no n8n</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="payload">
                    <AccordionTrigger className="text-sm font-medium">Estrutura do Payload</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p>O agente enviará os seguintes dados para o webhook:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60">
{`{
  "agent": {
    "id": "agent-id",
    "name": "Nome do Agente",
    "function": "Suporte",
    "process": {
      "current_step": 2,
      "total_steps": 5,
      "current_step_name": "Identificar problema"
    }
  },
  "conversation": {
    "id": "conversation-id",
    "messages": [
      {
        "role": "user",
        "content": "Olá, preciso de ajuda com meu pedido",
        "timestamp": "2025-04-29T14:30:00Z"
      },
      {
        "role": "assistant",
        "content": "Olá! Claro, eu posso ajudar. Pode me informar o número do seu pedido?",
        "timestamp": "2025-04-29T14:30:10Z"
      }
    ],
    "metadata": {
      "channel": "WhatsApp",
      "started_at": "2025-04-29T14:30:00Z"
    }
  },
  "user": {
    "id": "user-id",
    "name": "Nome do Cliente"
  },
  "request": {
    "type": "message_received",
    "timestamp": "2025-04-29T14:31:00Z"
  }
}`}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="response">
                    <AccordionTrigger className="text-sm font-medium">Formato de Resposta</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p>O n8n deve retornar uma resposta no seguinte formato:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-60">
{`{
  "action": "reply",
  "content": "Esta é a resposta que o agente enviará",
  "process": {
    "advance": true,
    "next_step": 3
  },
  "metadata": {
    "confidence": 0.92,
    "source": "knowledge_base",
    "reference_id": "kb-123"
  }
}`}
                      </pre>

                      <h4 className="font-medium mt-4 mb-2">Ações disponíveis:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><code className="text-xs bg-gray-100 px-1">reply</code>: Responder ao usuário</li>
                        <li><code className="text-xs bg-gray-100 px-1">transfer</code>: Transferir para um humano</li>
                        <li><code className="text-xs bg-gray-100 px-1">wait</code>: Aguardar mais informações</li>
                        <li><code className="text-xs bg-gray-100 px-1">execute</code>: Executar uma função interna</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="api">
                    <AccordionTrigger className="text-sm font-medium">APIs Disponíveis</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p>O n8n pode acessar as seguintes APIs para obter mais informações:</p>
                      
                      <div className="mt-2 space-y-2">
                        <div>
                          <h4 className="font-medium">Base de Conhecimento</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block mt-1">
                            GET /api/agents/{"{agent_id}"}/knowledge
                          </code>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">Processos</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block mt-1">
                            GET /api/agents/{"{agent_id}"}/processes
                          </code>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">Histórico de Conversas</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block mt-1">
                            GET /api/conversations/{"{conversation_id}"}/history
                          </code>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">Avançar Processo</h4>
                          <code className="text-xs bg-gray-100 p-2 rounded block mt-1">
                            POST /api/agents/{"{agent_id}"}/processes/{"{process_id}"}/advance
                          </code>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="example">
                    <AccordionTrigger className="text-sm font-medium">Exemplo de Workflow</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p>Exemplo de um workflow n8n para processamento de pedidos:</p>
                      <ol className="list-decimal pl-5 space-y-2 mt-2">
                        <li>Receber webhook com a mensagem do cliente</li>
                        <li>Usar HTTP Request para buscar mais informações do pedido em um sistema externo</li>
                        <li>Usar um nó "IF" para decidir se é uma dúvida sobre status ou uma reclamação</li>
                        <li>Para status: Formatar uma resposta com os dados do pedido</li>
                        <li>Para reclamação: Enviar um email para o time de suporte e transferir para um humano</li>
                        <li>Responder ao webhook com a ação apropriada</li>
                      </ol>
                      
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <FileJson size={16} />
                          Baixar Workflow de Exemplo
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
