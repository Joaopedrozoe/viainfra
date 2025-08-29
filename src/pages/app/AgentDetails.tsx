
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { AgentOverview } from "@/components/app/agents/details/AgentOverview";
import { AgentTraining } from "@/components/app/agents/details/AgentTraining";
import { AgentProcessFlow } from "@/components/app/agents/details/AgentProcessFlow";
import { AgentLogs } from "@/components/app/agents/details/AgentLogs";
import { AgentSettings } from "@/components/app/agents/details/AgentSettings";
import { mockAgents } from "@/components/app/agents/mockData";
import { Agent } from "@/types/agent";

const AgentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  const agent = mockAgents.find(agent => agent.id === id);

  if (!agent) {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/agents')}>
            <ArrowLeft size={16} className="mr-2" /> Voltar
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Agente não encontrado</h2>
            <p className="text-gray-500">O agente que você está procurando não existe.</p>
            <Button className="mt-4" onClick={() => navigate('/agents')}>
              Voltar para Agentes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => navigate('/agents')}>
              <ArrowLeft size={16} className="mr-2" />
            </Button>
            <h1 className="text-xl font-bold">{agent.name}</h1>
            <span 
              className={`ml-3 px-2 py-0.5 text-xs font-medium rounded-full ${
                agent.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : agent.status === 'training'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {agent.status === 'active' 
                ? 'Ativo' 
                : agent.status === 'training'
                ? 'Treinamento'
                : 'Erro'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="training">Treinamento</TabsTrigger>
                <TabsTrigger value="processes">Processos</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="p-4 m-0 h-full">
                <AgentOverview agent={agent} />
              </TabsContent>
              
              <TabsContent value="training" className="p-4 m-0 h-full">
                <AgentTraining agent={agent} />
              </TabsContent>
              
              <TabsContent value="processes" className="p-4 m-0 h-full">
                <AgentProcessFlow agent={agent} />
              </TabsContent>
              
              <TabsContent value="logs" className="p-4 m-0 h-full">
                <AgentLogs agent={agent} />
              </TabsContent>
              
              <TabsContent value="settings" className="p-4 m-0 h-full">
                <AgentSettings agent={agent} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
};

export default AgentDetails;
