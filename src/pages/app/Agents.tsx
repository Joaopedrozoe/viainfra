
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AgentsList } from "@/components/app/agents/AgentsList";
import { AgentWizard } from "@/components/app/agents/AgentWizard";
import { AgentsDashboard } from "@/components/app/agents/AgentsDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Agent } from "@/types/agent";
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
    const agents = await apiClient.getAgents();
    return agents;
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
