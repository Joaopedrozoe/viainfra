
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

type WebhookFormProps = {
  onTestComplete: (result: {
    success: boolean;
    message: string;
    response?: string;
    requestTime?: string;
  }) => void;
};

export const WebhookForm = ({ onTestComplete }: WebhookFormProps) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [headers, setHeaders] = useState("");
  const [payloadTemplate, setPayloadTemplate] = useState(
    JSON.stringify({
      message: "{{message}}",
      conversationId: "{{conversationId}}",
      sender: "{{sender}}"
    }, null, 2)
  );
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleTest = () => {
    if (!webhookUrl) {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL de webhook válida.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      new URL(webhookUrl);
    } catch (e) {
      toast({
        title: "URL inválida",
        description: "O formato da URL não é válido.",
        variant: "destructive"
      });
      return;
    }
    
    setIsTesting(true);
    
    // Mock webhook test - in a real app, we'd actually make the request
    setTimeout(() => {
      onTestComplete({
        success: true,
        message: "Webhook testado com sucesso!",
        response: JSON.stringify({
          reply: "Olá! Sou um assistente de IA. Como posso ajudar?",
          action: "send_message"
        }, null, 2),
        requestTime: "238ms"
      });
      
      toast({
        title: "Teste concluído",
        description: "O webhook respondeu com sucesso."
      });
      
      setIsTesting(false);
    }, 1500);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Configuração do Webhook</CardTitle>
        <CardDescription>
          Configure um webhook para conectar seu serviço de IA ao ZOE Chat.
          Sua IA receberá mensagens e poderá responder de forma automática.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="webhook-url" className="text-sm font-medium">
            URL do Webhook
          </label>
          <Input
            id="webhook-url"
            placeholder="https://sua-api.com/webhook"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            aria-label="URL do Webhook"
          />
          <p className="text-xs text-gray-500">
            Esta URL receberá as mensagens dos clientes via POST.
          </p>
        </div>
        
        <Tabs defaultValue="headers">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="payload">Payload</TabsTrigger>
          </TabsList>
          <TabsContent value="headers" className="space-y-2 pt-4">
            <label htmlFor="headers" className="text-sm font-medium">
              Headers (opcional)
            </label>
            <Textarea
              id="headers"
              placeholder="Authorization: Bearer seu_token&#10;Content-Type: application/json"
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
              aria-label="Headers da Requisição"
            />
            <p className="text-xs text-gray-500">
              Headers adicionais a serem enviados na requisição, um por linha no formato chave: valor.
            </p>
          </TabsContent>
          <TabsContent value="payload" className="space-y-2 pt-4">
            <label htmlFor="payload" className="text-sm font-medium">
              Template de Payload (opcional)
            </label>
            <Textarea
              id="payload"
              value={payloadTemplate}
              onChange={(e) => setPayloadTemplate(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              aria-label="Template de Payload"
            />
            <p className="text-xs text-gray-500">
              Template JSON para o payload da requisição. Use variáveis como {"{{message}}"}, {"{{conversationId}}"}, etc.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTest}
          className="bg-bonina hover:bg-bonina/90 w-full md:w-auto"
          disabled={isTesting || !webhookUrl}
        >
          {isTesting ? "Testando..." : "Testar Conexão"}
        </Button>
      </CardFooter>
    </Card>
  );
};
