
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
import { 
  Label 
} from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Agent } from "@/types/agent";

interface AgentDefinitionProps {
  agent: Partial<Agent>;
  updateAgent: (data: Partial<Agent>) => void;
}

export const AgentDefinition = ({ agent, updateAgent }: AgentDefinitionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
        <p className="text-sm text-gray-500 mb-6">
          Configure os detalhes básicos do seu agente de IA.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome do Agente*</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ex: Assistente de Vendas"
            value={agent.name}
            onChange={(e) => updateAgent({ name: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="function">Função*</Label>
          <Select
            value={agent.function}
            onValueChange={(value) => updateAgent({ function: value as any })}
          >
            <SelectTrigger id="function">
              <SelectValue placeholder="Selecione uma função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SDR">SDR</SelectItem>
              <SelectItem value="Suporte">Suporte</SelectItem>
              <SelectItem value="Vendas">Vendas</SelectItem>
              <SelectItem value="Genérico">Genérico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tone">Tom de Voz*</Label>
          <Input
            id="tone"
            type="text"
            placeholder="Ex: Formal, Amigável, Profissional"
            value={agent.tone}
            onChange={(e) => updateAgent({ tone: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            placeholder="Descreva a função e o propósito deste agente..."
            value={agent.description}
            onChange={(e) => updateAgent({ description: e.target.value })}
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};
