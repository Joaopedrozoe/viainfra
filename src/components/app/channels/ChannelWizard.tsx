import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from "lucide-react";
import { ChannelType, ChannelWizardStep } from "@/types/channels";
import { ChannelSelection } from "./wizard/ChannelSelection";
import { InstagramSetup } from "./wizard/InstagramSetup";
import { FacebookSetup } from "./wizard/FacebookSetup";
import { WhatsAppSetup } from "./wizard/WhatsAppSetup";
import { EmailSetup } from "./wizard/EmailSetup";
import { WebsiteSetup } from "./wizard/WebsiteSetup";
import { TelegramSetup } from "./wizard/TelegramSetup";
import { ChannelReview } from "./wizard/ChannelReview";

interface ChannelWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (channelData: any) => void;
}

export const ChannelWizard = ({ isOpen, onClose, onComplete }: ChannelWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedChannelType, setSelectedChannelType] = useState<ChannelType | null>(null);
  const [channelData, setChannelData] = useState<any>({});

  const steps: ChannelWizardStep[] = [
    {
      id: 'selection',
      title: 'Seleção do Canal',
      description: 'Escolha o tipo de canal que deseja configurar',
      completed: selectedChannelType !== null,
      current: currentStep === 0
    },
    {
      id: 'configuration',
      title: 'Configuração',
      description: 'Configure as credenciais e parâmetros',
      completed: Object.keys(channelData).length > 0,
      current: currentStep === 1
    },
    {
      id: 'review',
      title: 'Revisão',
      description: 'Revise as configurações antes de finalizar',
      completed: false,
      current: currentStep === 2
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChannelTypeSelect = (type: ChannelType) => {
    setSelectedChannelType(type);
    setChannelData({ type });
  };

  const handleConfigurationUpdate = (data: any) => {
    setChannelData(prev => ({ ...prev, ...data }));
  };

  const handleComplete = () => {
    onComplete(channelData);
    onClose();
    // Reset wizard state
    setCurrentStep(0);
    setSelectedChannelType(null);
    setChannelData({});
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ChannelSelection
            selectedType={selectedChannelType}
            onSelect={handleChannelTypeSelect}
          />
        );
      case 1:
        if (!selectedChannelType) return null;
        
        switch (selectedChannelType) {
          case 'instagram':
            return <InstagramSetup data={channelData} onUpdate={handleConfigurationUpdate} />;
          case 'facebook':
            return <FacebookSetup data={channelData} onUpdate={handleConfigurationUpdate} />;
          case 'whatsapp':
            return <WhatsAppSetup data={channelData} onUpdate={handleConfigurationUpdate} />;
          case 'email':
            return <EmailSetup data={channelData} onUpdate={handleConfigurationUpdate} />;
          case 'website':
            return <WebsiteSetup data={channelData} onUpdate={handleConfigurationUpdate} />;
          case 'telegram':
            return <TelegramSetup data={channelData} onUpdate={handleConfigurationUpdate} />;
          default:
            return null;
        }
      case 2:
        return (
          <ChannelReview
            channelData={channelData}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedChannelType !== null;
      case 1:
        return Object.keys(channelData).length > 1; // Tem type + configurações
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[98vw] sm:w-[95vw] max-h-[95vh] p-0">
        <div className="p-4 sm:p-6">
          <DialogHeader className="mb-6">
            <DialogTitle>Adicionar Novo Canal</DialogTitle>
            <DialogDescription>
              Configure um novo canal de comunicação seguindo os passos do wizard
            </DialogDescription>
          </DialogHeader>
        
          {/* Progress Bar */}
          <div className="mb-4 sm:mb-6">
            <Progress value={progress} className="mb-4" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className="flex flex-col items-center text-center flex-1 px-1"
                >
                  <div className="flex items-center mb-2">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    ) : step.current ? (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-current" />
                    ) : (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground max-w-20 sm:max-w-24">
                    {step.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] sm:min-h-[400px] mb-4 sm:mb-6">
            {renderCurrentStep()}
          </div>

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete} disabled={!canProceed()} className="w-full sm:w-auto">
                  Finalizar Configuração
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()} className="w-full sm:w-auto">
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};