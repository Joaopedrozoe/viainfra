
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Switch 
} from "@/components/ui/switch";
import { 
  Checkbox 
} from "@/components/ui/checkbox";
import { 
  Label 
} from "@/components/ui/label";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Agent, AgentChannel } from "@/types/agent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhookForm } from "../../integrations/WebhookForm";
import { toast } from "sonner";

interface AgentSettingsProps {
  agent: Agent;
}

export const AgentSettings = ({ agent }: AgentSettingsProps) => {
  const [isActive, setIsActive] = useState(agent.status === 'active');
  const [selectedChannels, setSelectedChannels] = useState<AgentChannel[]>(agent.channels);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [testResult, setTestResult] = useState<any>(null);

  const handleChannelToggle = (channel: AgentChannel) => {
    setSelectedChannels(prev => 
      prev.includes(channel)
        ? prev.filter(ch => ch !== channel)
        : [...prev, channel]
    );
  };

  const handleWebhookTest = (result: any) => {
    setTestResult(result);
  };

  const handleWebhookSave = (data: { url: string; headers: string; payload: string }) => {
    toast.success("Configuração de webhook salva com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Configurações do Agente</h2>
        <Button>Salvar Alterações</Button>
      </div>

      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status do Agente</CardTitle>
                <CardDescription>
                  Ative ou desative o agente em todos os canais.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent-status" className="font-medium text-base">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </Label>
                  <Switch 
                    id="agent-status" 
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Canais</CardTitle>
                <CardDescription>
                  Associe o agente aos canais de atendimento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="channel-whatsapp" 
                      checked={selectedChannels.includes('WhatsApp')}
                      onCheckedChange={() => handleChannelToggle('WhatsApp')}
                    />
                    <Label htmlFor="channel-whatsapp">WhatsApp</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="channel-instagram" 
                      checked={selectedChannels.includes('Instagram')}
                      onCheckedChange={() => handleChannelToggle('Instagram')}
                    />
                    <Label htmlFor="channel-instagram">Instagram</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="channel-email" 
                      checked={selectedChannels.includes('Email')}
                      onCheckedChange={() => handleChannelToggle('Email')}
                    />
                    <Label htmlFor="channel-email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="channel-website" 
                      checked={selectedChannels.includes('Website')}
                      onCheckedChange={() => handleChannelToggle('Website')}
                    />
                    <Label htmlFor="channel-website">Website (Chat)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limites e Comportamentos</CardTitle>
                <CardDescription>
                  Configure os limites e comportamentos do agente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max-turns" className="mb-1 block">
                    Máximo de turnos de conversa
                  </Label>
                  <Input 
                    id="max-turns" 
                    type="number" 
                    defaultValue="10" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número máximo de trocas de mensagens antes de transferir para um humano
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="transfer-threshold" className="mb-1 block">
                    Limiar de confiança para transferência
                  </Label>
                  <Select defaultValue="0.7">
                    <SelectTrigger id="transfer-threshold">
                      <SelectValue placeholder="Selecione um limiar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">50% - Baixo</SelectItem>
                      <SelectItem value="0.7">70% - Médio</SelectItem>
                      <SelectItem value="0.9">90% - Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Quando a confiança da resposta for menor que este valor, o agente transferirá para um humano
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personalidade e Tom</CardTitle>
                <CardDescription>
                  Defina a personalidade e o tom do seu agente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="agent-tone" className="mb-1 block">
                    Tom de Voz
                  </Label>
                  <Input 
                    id="agent-tone" 
                    defaultValue={agent.tone} 
                  />
                </div>
                
                <div>
                  <Label htmlFor="agent-personality" className="mb-1 block">
                    Instruções de Personalidade
                  </Label>
                  <Input 
                    id="agent-personality" 
                    placeholder="Ex: Seja amigável mas profissional, use linguagem simples..." 
                  />
                </div>
                
                <div>
                  <Label htmlFor="agent-language" className="mb-1 block">
                    Idioma Principal
                  </Label>
                  <Select defaultValue="pt-BR">
                    <SelectTrigger id="agent-language">
                      <SelectValue placeholder="Selecione um idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en">Inglês</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integração com n8n</CardTitle>
              <CardDescription>
                Configure a integração do agente com n8n para processamento avançado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <WebhookForm onTest={handleWebhookTest} onSave={handleWebhookSave} />
              
              {testResult && (
                <div className="mt-4 border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${testResult.success ? 'text-green-600' : 'text-destructive'}`}>
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
              
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium">Recursos Compartilhados</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="share-knowledge" defaultChecked />
                    <Label htmlFor="share-knowledge" className="font-normal">Base de Conhecimento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="share-processes" defaultChecked />
                    <Label htmlFor="share-processes" className="font-normal">Processos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="share-conversation" defaultChecked />
                    <Label htmlFor="share-conversation" className="font-normal">Histórico de Conversas</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription className="text-destructive/80">
                Ações destrutivas que não podem ser desfeitas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                Excluir Agente
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
