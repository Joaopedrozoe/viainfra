
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AgentDefinition } from "./wizard/AgentDefinition";
import { AgentKnowledge } from "./wizard/AgentKnowledge";
import { AgentProcesses } from "./wizard/AgentProcesses";
import { AgentTesting } from "./wizard/AgentTesting";
import { AgentChannels } from "./wizard/AgentChannels";
import { Agent, AgentFunction, AgentTemplate, AgentProcess } from "@/types/agent";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNavigation } from "@/components/app/MobileNavigation";

interface AgentWizardProps {
  onClose: () => void;
  onCreated?: () => void; // Make this prop optional
}

const steps = [
  { id: 1, name: "Definição" },
  { id: 2, name: "Conhecimento" },
  { id: 3, name: "Processos" },
  { id: 4, name: "Testes & Feedback" },
  { id: 5, name: "Canais" }  // Add new step for channels
];

export const AgentWizard = ({ onClose, onCreated }: AgentWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const isMobile = useIsMobile();
  const [agent, setAgent] = useState<Partial<Agent>>({
    name: "",
    function: "Genérico" as AgentFunction,
    tone: "",
    description: "",
    knowledgeFiles: [],
    knowledgeQA: [],
    knowledgeURLs: [],
    template: "Genérico" as AgentTemplate,
    processes: [],
    channels: []
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // In a real app, you would save the agent to the database
    console.log("Agent created:", agent);
    
    // Call the onCreated callback if provided
    if (onCreated) {
      onCreated();
    } else {
      onClose();
    }
  };

  const updateAgent = (data: Partial<Agent>) => {
    setAgent({
      ...agent,
      ...data
    });
  };

  return (
    <div className={`flex flex-col w-full h-full ${isMobile ? 'mb-14' : 'p-4'} overflow-auto`}>
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <h1 className="text-xl font-bold">Novo Agente</h1>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>

      <div className="flex mb-6 px-4">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div
              className={`h-2 flex-1 ${
                step.id < currentStep
                  ? "bg-bonina"
                  : step.id === currentStep
                  ? "bg-bonina/50"
                  : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step.id <= currentStep
                  ? "bg-bonina text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.id}
            </div>
            <div
              className={`h-2 flex-1 ${
                step.id < currentStep - 1
                  ? "bg-bonina"
                  : step.id === currentStep - 1
                  ? "bg-bonina/50"
                  : "bg-gray-200"
              }`}
            ></div>
          </div>
        ))}
      </div>

      <div className="hidden md:flex md:flex-wrap md:gap-2 mb-4 px-4">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`text-center px-3 py-1 text-sm ${
              step.id === currentStep
                ? "text-bonina font-medium"
                : "text-gray-500"
            }`}
          >
            {step.name}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-4 mb-4">
        <Card className="p-6">
          {currentStep === 1 && (
            <AgentDefinition agent={agent} updateAgent={updateAgent} />
          )}
          {currentStep === 2 && (
            <AgentKnowledge agent={agent} updateAgent={updateAgent} />
          )}
          {currentStep === 3 && (
            <AgentProcesses agent={agent} updateAgent={updateAgent} />
          )}
          {currentStep === 4 && (
            <AgentTesting agent={agent} updateAgent={updateAgent} />
          )}
          {currentStep === 5 && (
            <AgentChannels agent={agent} updateAgent={updateAgent} />
          )}
          
          <div className="flex justify-between mt-6 gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-bonina hover:bg-bonina/90 text-white"
            >
              {currentStep < steps.length ? (
                <>
                  Avançar <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Finalizar"
              )}
            </Button>
          </div>
        </Card>
      </div>
      
      {isMobile && <MobileNavigation />}
    </div>
  );
};
