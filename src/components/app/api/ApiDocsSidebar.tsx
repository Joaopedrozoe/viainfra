
import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, BookOpen, FileText, Users, MessageSquare, CalendarDays, Bot, Webhook, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ApiDocsSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface DocSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  subSections?: { id: string; label: string }[];
}

export const ApiDocsSidebar = ({ activeSection, setActiveSection }: ApiDocsSidebarProps) => {
  const isMobile = useIsMobile();
  
  const sections: DocSection[] = [
    {
      id: "introduction",
      label: "Introdução",
      icon: <BookOpen className="h-4 w-4" />,
      subSections: [
        { id: "authentication", label: "Autenticação" },
        { id: "rate-limits", label: "Limites de Requisição" },
        { id: "errors", label: "Erros" }
      ]
    },
    {
      id: "contacts",
      label: "Contatos",
      icon: <Users className="h-4 w-4" />,
      subSections: [
        { id: "list-contacts", label: "Listar Contatos" },
        { id: "get-contact", label: "Obter Contato" },
        { id: "create-contact", label: "Criar Contato" },
        { id: "update-contact", label: "Atualizar Contato" },
        { id: "delete-contact", label: "Deletar Contato" }
      ]
    },
    {
      id: "messages",
      label: "Mensagens",
      icon: <MessageSquare className="h-4 w-4" />,
      subSections: [
        { id: "list-messages", label: "Listar Mensagens" },
        { id: "send-message", label: "Enviar Mensagem" }
      ]
    },
    {
      id: "events",
      label: "Eventos",
      icon: <CalendarDays className="h-4 w-4" />,
      subSections: [
        { id: "list-events", label: "Listar Eventos" },
        { id: "create-event", label: "Criar Evento" },
        { id: "update-event", label: "Atualizar Evento" },
        { id: "delete-event", label: "Deletar Evento" }
      ]
    },
    {
      id: "agents",
      label: "Agentes",
      icon: <Bot className="h-4 w-4" />,
      subSections: [
        { id: "list-agents", label: "Listar Agentes" },
        { id: "get-agent", label: "Obter Agente" },
        { id: "agent-knowledge", label: "Base de Conhecimento" },
        { id: "agent-processes", label: "Processos do Agente" },
        { id: "agent-conversation", label: "Conversas com Agente" }
      ]
    },
    {
      id: "webhooks",
      label: "Webhooks",
      icon: <Webhook className="h-4 w-4" />,
      subSections: [
        { id: "creating-webhooks", label: "Criando Webhooks" },
        { id: "webhook-events", label: "Eventos de Webhook" }
      ]
    },
    {
      id: "security",
      label: "Segurança",
      icon: <Shield className="h-4 w-4" />
    }
  ];

  // Handle mobile display differently
  if (isMobile) {
    return (
      <div className="w-full bg-gray-50 border-b p-4 sticky top-0 z-10">
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar na documentação"
            className="pl-8"
          />
        </div>
        
        <select 
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          {sections.flatMap((section) => [
            <option key={section.id} value={section.id} className="font-medium">
              {section.label}
            </option>,
            ...(section.subSections?.map((sub) => (
              <option key={`${section.id}-${sub.id}`} value={`${section.id}-${sub.id}`}>
                &nbsp;&nbsp;{sub.label}
              </option>
            )) || [])
          ])}
        </select>
      </div>
    );
  }
  
  return (
    <div className="w-64 border-r bg-gray-50 h-full overflow-y-auto flex-shrink-0">
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar na documentação"
            className="pl-8"
          />
        </div>
        
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <button
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md",
                  activeSection === section.id 
                    ? "bg-bonina/10 text-bonina font-medium"
                    : "hover:bg-gray-200 text-gray-700"
                )}
              >
                {section.icon}
                {section.label}
              </button>
              
              {section.subSections && (
                <div className="ml-6 border-l pl-2 space-y-1 mt-1">
                  {section.subSections.map((subSection) => {
                    const fullId = `${section.id}-${subSection.id}`;
                    return (
                      <button
                        key={fullId}
                        onClick={() => setActiveSection(fullId)}
                        className={cn(
                          "w-full text-left text-sm px-2 py-1 rounded-md",
                          activeSection === fullId
                            ? "bg-bonina/10 text-bonina font-medium"
                            : "hover:bg-gray-200 text-gray-600"
                        )}
                      >
                        {subSection.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
