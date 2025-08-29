
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Agent, AgentTemplate, AgentProcess } from "@/types/agent";
import { Plus, ArrowDown, X } from "lucide-react";

interface AgentProcessFlowProps {
  agent: Agent;
}

// Template definitions (same as in AgentProcesses.tsx)
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

export const AgentProcessFlow = ({ agent }: AgentProcessFlowProps) => {
  const [editingProcesses, setEditingProcesses] = useState<AgentProcess[]>(agent.processes);
  const [newStep, setNewStep] = useState("");

  const selectTemplate = (template: AgentTemplate) => {
    setEditingProcesses([...templates[template]]);
  };

  const addStep = () => {
    if (newStep.trim()) {
      const newProcess: AgentProcess = {
        id: `p${Date.now()}`,
        order: (editingProcesses.length || 0) + 1,
        description: newStep
      };
      
      setEditingProcesses([...editingProcesses, newProcess]);
      setNewStep("");
    }
  };

  const removeStep = (id: string) => {
    const updatedProcesses = editingProcesses
      .filter(p => p.id !== id)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    
    setEditingProcesses(updatedProcesses);
  };

  const moveStep = (id: string, direction: 'up' | 'down') => {
    const processes = [...editingProcesses];
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
    
    setEditingProcesses(processes);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Fluxo de Processos</h2>
        <div className="flex items-center gap-2">
          <Select 
            defaultValue={agent.template}
            onValueChange={(value) => selectTemplate(value as AgentTemplate)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Escolher template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SDR">SDR</SelectItem>
              <SelectItem value="Suporte N1">Suporte N1</SelectItem>
              <SelectItem value="Vendas">Vendas</SelectItem>
              <SelectItem value="Genérico">Genérico</SelectItem>
            </SelectContent>
          </Select>
          <Button>Salvar Alterações</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sequência de Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
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
                <Plus size={16} className="mr-2" /> Adicionar Passo
              </Button>
            </div>
            
            <div className="space-y-2">
              {editingProcesses
                .sort((a, b) => a.order - b.order)
                .map((process, index) => (
                  <div key={process.id}>
                    <div 
                      className="flex items-center gap-2 bg-white p-3 rounded border"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-bonina text-white flex items-center justify-center rounded-full text-sm">
                        {process.order}
                      </div>
                      <div className="flex-1 mr-2">{process.description}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(process.id, 'up')}
                          disabled={index === 0}
                          className="h-8 w-8 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStep(process.id, 'down')}
                          disabled={index === editingProcesses.length - 1}
                          className="h-8 w-8 p-0"
                        >
                          ↓
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeStep(process.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    {index < editingProcesses.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowDown className="text-gray-400" size={20} />
                      </div>
                    )}
                  </div>
                ))}
                
              {editingProcesses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum passo de processo definido.</p>
                  <p className="text-sm">Adicione passos para criar o fluxo de atendimento do agente.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
