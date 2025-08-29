
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type WebhookFormProps = {
  onSave?: (data: {
    url: string;
    headers: string;
    payload: string;
  }) => void;
  onTest?: (result: {
    success: boolean;
    message: string;
    response?: string;
    requestTime?: string;
  }) => void;
};

export const WebhookForm = ({ onSave, onTest }: WebhookFormProps) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [headers, setHeaders] = useState("");
  const [payloadTemplate, setPayloadTemplate] = useState(
    JSON.stringify({
      agent_id: "{{agent_id}}",
      message: "{{message}}",
      conversation_id: "{{conversation_id}}",
      process_step: "{{process_step}}",
      user: "{{user}}"
    }, null, 2)
  );
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = () => {
    if (!webhookUrl) {
      toast.error("Por favor, insira uma URL de webhook válida");
      return;
    }
    
    try {
      new URL(webhookUrl);
    } catch (e) {
      toast.error("O formato da URL não é válido");
      return;
    }
    
    setIsTesting(true);
    
    // Mock webhook test - in a real app, we'd actually make the request
    setTimeout(() => {
      const result = {
        success: true,
        message: "Webhook testado com sucesso!",
        response: JSON.stringify({
          action: "reply",
          content: "Esta é uma resposta de teste do webhook n8n",
          process: {
            advance: true,
            next_step: 2
          },
          metadata: {
            source: "test"
          }
        }, null, 2),
        requestTime: "324ms"
      };
      
      if (onTest) {
        onTest(result);
      }
      
      toast.success("Teste concluído com sucesso");
      setIsTesting(false);
    }, 1500);
  };

  const handleSave = () => {
    if (!webhookUrl) {
      toast.error("Por favor, insira uma URL de webhook válida");
      return;
    }

    if (onSave) {
      onSave({
        url: webhookUrl,
        headers,
        payload: payloadTemplate
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url" className="text-sm font-medium">
          URL do Webhook
        </Label>
        <Input
          id="webhook-url"
          placeholder="https://seu-n8n.com/webhook/agente-ia"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          aria-label="URL do Webhook"
        />
        <p className="text-xs text-gray-500">
          URL do webhook n8n que receberá as solicitações do agente.
        </p>
      </div>
      
      <Tabs defaultValue="headers">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="payload">Payload</TabsTrigger>
        </TabsList>
        <TabsContent value="headers" className="space-y-2 pt-4">
          <Label htmlFor="headers" className="text-sm font-medium">
            Headers (opcional)
          </Label>
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
          <Label htmlFor="payload" className="text-sm font-medium">
            Template de Payload (opcional)
          </Label>
          <Textarea
            id="payload"
            value={payloadTemplate}
            onChange={(e) => setPayloadTemplate(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            aria-label="Template de Payload"
          />
          <p className="text-xs text-gray-500">
            Template JSON para o payload da requisição. Use variáveis como {"{{message}}"}, {"{{agent_id}}"}, etc.
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-2">
        <Button 
          onClick={handleTest}
          variant="outline"
          disabled={isTesting || !webhookUrl}
        >
          {isTesting ? "Testando..." : "Testar Conexão"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!webhookUrl}
          className="bg-bonina hover:bg-bonina/90"
        >
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
};
