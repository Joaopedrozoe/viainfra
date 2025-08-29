
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AgentsList } from "@/components/app/agents/AgentsList";
import { AgentWizard } from "@/components/app/agents/AgentWizard";
import { AgentsDashboard } from "@/components/app/agents/AgentsDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Agent } from "@/types/agent";
import { DbAgent, DbAgentKnowledge, DbAgentProcess, mapDbAgentToAgent } from "@/types/supabase";
import { toast } from "sonner";
import { PlanGate } from "@/components/ui/plan-gate";
import { PLAN_FEATURES } from "@/types/plans";

const fetchAgents = async (): Promise<Agent[]> => {
  try {
    // Verifica se há dados reais de agentes - para MVP sem Supabase, sempre retorna vazio
    const hasRealAgentsData = checkRealAgentsData();
    
    if (!hasRealAgentsData) {
      // Sem dados reais = sem agentes
      return [];
    }
    
    // Este código será usado quando houver integração real com banco de dados
    // Fetch agents
    const { data: dbAgents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (agentsError || !dbAgents || dbAgents.length === 0) {
      return [];
    }

    // Fetch agent knowledge for all agents
    const { data: dbKnowledge, error: knowledgeError } = await supabase
      .from('agent_knowledge')
      .select('*')
      .in('agent_id', dbAgents.map(a => a.id));

    if (knowledgeError) {
      console.error('Error fetching agent knowledge:', knowledgeError);
    }

    // Fetch agent processes for all agents
    const { data: dbProcesses, error: processesError } = await supabase
      .from('agent_processes')
      .select('*')
      .in('agent_id', dbAgents.map(a => a.id))
      .order('order', { ascending: true });

    if (processesError) {
      console.error('Error fetching agent processes:', processesError);
    }

    // Map DB agents to app agents
    return dbAgents.map(dbAgent => {
      // Basic agent mapping
      const agent = mapDbAgentToAgent(dbAgent);

      // Add knowledge data
      const agentKnowledge = dbKnowledge?.filter(k => k.agent_id === dbAgent.id) || [];
      agent.knowledgeFiles = agentKnowledge
        .filter(k => k.type === 'file')
        .map(k => k.file_name || '');
      
      agent.knowledgeQA = agentKnowledge
        .filter(k => k.type === 'qa' && k.question && k.answer)
        .map(k => ({ 
          question: k.question || '', 
          answer: k.answer || '' 
        }));
      
      agent.knowledgeURLs = agentKnowledge
        .filter(k => k.type === 'url' && k.url)
        .map(k => k.url || '');

      // Add processes data
      agent.processes = (dbProcesses?.filter(p => p.agent_id === dbAgent.id) || [])
        .map(p => ({
          id: p.id,
          order: p.order,
          description: p.description
        }));

      return agent;
    });
  } catch (error) {
    console.warn('Error in fetchAgents:', error);
    // Sem dados reais = retorna lista vazia
    return [];
  }
};

// Função para verificar se há dados reais de agentes
const checkRealAgentsData = (): boolean => {
  // Para MVP sem Supabase, sempre retorna false
  // Quando integrar com seu PostgreSQL, esta função verificará se há agentes reais
  return false;
};

const Agents = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const isMobile = useIsMobile();
  
  const {
    data: agents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents
  });

  // Show error if any
  useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar agentes: " + (error as Error).message);
    }
  }, [error]);

  const handleAgentCreated = () => {
    refetch();
    setIsCreating(false);
  };

  return (
    <PlanGate feature={PLAN_FEATURES.AI_AGENTS}>
      <div className="flex h-full overflow-hidden">
        <main className="h-full overflow-auto w-full">
        <div className="flex-1 flex flex-col overflow-hidden">
          {isCreating ? (
            <AgentWizard onClose={() => setIsCreating(false)} onCreated={handleAgentCreated} />
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h1 className="text-xl font-bold">Meus Agentes IA</h1>
                <Button 
                  onClick={() => setIsCreating(true)}
                  className="bg-bonina hover:bg-bonina/90 text-white"
                >
                  + Novo Agente
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="space-y-4"
                >
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                    <TabsTrigger value="list">Lista de Agentes</TabsTrigger>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="list" className="mt-4">
                    <AgentsList agents={agents} isLoading={isLoading} />
                  </TabsContent>
                  
                  <TabsContent value="dashboard" className="mt-4">
                    <AgentsDashboard agents={agents} isLoading={isLoading} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
          </div>
        </main>
      </div>
    </PlanGate>
  );
};

export default Agents;
