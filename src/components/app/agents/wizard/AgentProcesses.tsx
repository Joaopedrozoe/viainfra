
import { useState } from "react";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Label 
} from "@/components/ui/label";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Agent, AgentTemplate, AgentProcess } from "@/types/agent";
import { X } from "lucide-react";

interface AgentProcessesProps {
  agent: Partial<Agent>;
  updateAgent: (data: Partial<Agent>) => void;
}

// Template definitions
const templates: Record<AgentTemplate, AgentProcess[]> = {
  "SDR": [
    { id: "p1", order: 1, description: "Enviar primeira mensagem de prospecção" },
    { id: "p2", order: 2, description: "Identificar interesse e necessidades" },
    { id: "p3", order: 3, description: "Qualificar o lead" },
    { id: "p4", order: 4, description: "Agendar demonstração com consultor" }
  ],
  "Suporte N1": [
    { id: "p1", order: 1, description: "Cumprimentar e identificar cliente" },
    { id: "p2", order: 2, description: "Identificar o problema ou dúvida" },
    { id: "p3", order: 3, description: "Consultar base de conhecimento e oferecer solução" },
    { id: "p4", order: 4, description: "Verificar se problema foi resolvido" },
    { id: "p5", order: 5, description: "Transferir para suporte humano se necessário" }
  ],
  "Vendas": [
    { id: "p1", order: 1, description: "Cumprimentar e apresentar produtos/serviços" },
    { id: "p2", order: 2, description: "Identificar necessidades específicas" },
    { id: "p3", order: 3, description: "Apresentar soluções e benefícios" },
    { id: "p4", order: 4, description: "Responder objeções" },
    { id: "p5", order: 5, description: "Encaminhar para fechamento com vendedor humano" }
  ],
  "Genérico": [
    { id: "p1", order: 1, description: "Cumprimentar usuário" },
    { id: "p2", order: 2, description: "Identificar necessidade" },
    { id: "p3", order: 3, description: "Fornecer informações" }
  ]
};

export const AgentProcesses = ({ agent, updateAgent }: AgentProcessesProps) => {
  const [newStep, setNewStep] = useState("");

  const selectTemplate = (template: AgentTemplate) => {
    updateAgent({
      template,
      processes: [...templates[template]]
    });
  };

  const addStep = () => {
    if (newStep.trim()) {
      const newProcess: AgentProcess = {
        id: `p${Date.now()}`,
        order: (agent.processes?.length || 0) + 1,
        description: newStep
      };
      
      updateAgent({
        processes: [...(agent.processes || []), newProcess]
      });
      
      setNewStep("");
    }
  };

  const removeStep = (id: string) => {
    const updatedProcesses = (agent.processes || [])
      .filter(p => p.id !== id)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    
    updateAgent({ processes: updatedProcesses });
  };

  const moveStep = (id: string, direction: 'up' | 'down') => {
    const processes = [...(agent.processes || [])];
    const currentIndex = processes.findIndex(p => p.id === id);
    
    if (direction === 'up' && currentIndex > 0) {
      const temp = processes[currentIndex - 1];
      processes[currentIndex - 1] = { ...processes[currentIndex], order: processes[currentIndex].order - 1 };
      processes[currentIndex] = { ...temp, order: temp.order + 1 };
    } else if (direction === 'down' && currentIndex < processes.length - 1) {
      const temp = processes[currentIndex + 1];
      processes[currentIndex + 1] = { ...processes[currentIndex], order: processes[currentIndex].order + 1 };
      processes[currentIndex] = { ...temp, order: temp.order - 1 };
    }
    
    // Re-sort by order
    processes.sort((a, b) => a.order - b.order);
    
    updateAgent({ processes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Definição de Processos</h2>
        <p className="text-sm text-gray-500 mb-6">
          Selecione um template pré-definido ou crie seu próprio fluxo de atendimento.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-3">
          <Label htmlFor="template">Selecione um Template</Label>
          <Select 
            value={agent.template}
            onValueChange={(value) => selectTemplate(value as AgentTemplate)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha um template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SDR">SDR</SelectItem>
              <SelectItem value="Suporte N1">Suporte N1</SelectItem>
              <SelectItem value="Vendas">Vendas</SelectItem>
              <SelectItem value="Genérico">Genérico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Fluxo de Processos</Label>
          
          <div className="border rounded-md p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-4">
              {agent.processes && agent.processes.length > 0 
                ? "Edite o fluxo de passos que o agente seguirá:"
                : "Adicione passos para criar seu fluxo de atendimento:"}
            </p>
            
            {agent.processes && agent.processes.length > 0 && (
              <div className="space-y-2 mb-4">
                {agent.processes
                  .sort((a, b) => a.order - b.order)
                  .map((process) => (
                    <div 
                      key={process.id} 
                      className="flex items-center gap-2 bg-white p-3 rounded border"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-viainfra-primary text-white flex items-center justify-center rounded-full text-sm">
                        {process.order}
                      </div>
                      <div className="flex-1 mr-2 text-sm">{process.description}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(process.id, 'up')}
                          disabled={process.order === 1}
                          className="h-7 w-7"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(process.id, 'down')}
                          disabled={process.order === agent.processes!.length}
                          className="h-7 w-7"
                        >
                          ↓
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeStep(process.id)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Ex: Identificar interesse do cliente"
                className="flex-1"
              />
              <Button 
                onClick={addStep}
                disabled={!newStep.trim()}
                variant="outline"
              >
                Adicionar Passo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
