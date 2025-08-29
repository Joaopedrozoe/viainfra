
import { useState } from "react";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { 
  Textarea 
} from "@/components/ui/textarea";
import { Agent } from "@/types/agent";
import { AgentChatSimulator } from "../AgentChatSimulator";

interface AgentTestingProps {
  agent: Partial<Agent>;
  updateAgent: (data: Partial<Agent>) => void;
}

export const AgentTesting = ({ agent, updateAgent }: AgentTestingProps) => {
  const [testResults, setTestResults] = useState<Array<{type: string, message: string}>>([
    {type: 'system', message: 'Teste iniciado para o agente ' + (agent.name || 'Sem nome')},
    {type: 'system', message: 'Verificando base de conhecimento...'},
    {type: 'system', message: 'Analisando processos...'},
    {type: 'success', message: 'Agente pronto para testes!'}
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Teste seu Agente</h2>
        <p className="text-sm text-gray-500 mb-6">
          Simule conversas com seu agente e ajuste as configurações conforme necessário.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium mb-3">Simulador de Conversa</h3>
          <div className="border rounded-md overflow-hidden">
            <AgentChatSimulator agent={agent} />
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium mb-3">Logs & Feedback</h3>
          <Card>
            <CardContent className="p-4 h-[400px] overflow-auto">
              <div className="space-y-2">
                {testResults.map((log, index) => (
                  <div 
                    key={index} 
                    className={`text-sm p-2 rounded ${
                      log.type === 'system' 
                        ? 'bg-gray-100 text-gray-700' 
                        : log.type === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4">
            <h3 className="text-md font-medium mb-3">Ajustar Respostas</h3>
            <Textarea
              placeholder="Adicione instruções específicas para ajustar as respostas do agente..."
              rows={4}
              className="w-full"
            />
            <Button className="mt-2" variant="outline">
              Aplicar Ajustes
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded">
        <p className="text-sm text-blue-700">
          <strong>Dica:</strong> Teste seu agente com diferentes cenários para garantir que ele responda adequadamente em todas as situações.
        </p>
      </div>
    </div>
  );
};
