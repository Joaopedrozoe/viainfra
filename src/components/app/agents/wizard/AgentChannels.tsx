
import React, { useState } from "react";
import { Check, MessageSquare, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Agent, AgentChannel } from "@/types/agent";

interface AgentChannelsProps {
  agent: Partial<Agent>;
  updateAgent: (data: Partial<Agent>) => void;
}

export const AgentChannels: React.FC<AgentChannelsProps> = ({ agent, updateAgent }) => {
  const [selectedChannels, setSelectedChannels] = useState<AgentChannel[]>(agent.channels || []);

  const channels: { id: AgentChannel; name: string; description: string; icon: React.ReactNode; available: boolean }[] = [
    {
      id: "WhatsApp",
      name: "WhatsApp",
      description: "Ative o agente para conversar com seus clientes via WhatsApp",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.6 6.32A7.85 7.85 0 0 0 12 4.02 7.94 7.94 0 0 0 4.06 12a7.9 7.9 0 0 0 1.22 4.23L4 20l3.91-1.24A7.88 7.88 0 0 0 12 20a7.95 7.95 0 0 0 7.94-7.94c0-2.12-.83-4.12-2.34-5.66v-.08zm.71 10.12c-.39.63-2.4 1.58-3.33.39-.67-.87-2.92-.47-5.54-2.36-2.62-1.89-3.7-4.26-3.7-5.13 0-.87.55-2.2 1.14-2.6.59-.4 1.5 0 1.9.39.4.39.79 1.02.98 1.42.2.39.1.79-.1 1.18-.2.4-.49.71-.69.91-.2.2-.3.4-.1.7.2.3 1.18 1.77 2.56 2.56 1.38.79 2.56.98 2.96.78.4-.2.4-.59.69-.98.3-.4.69-.4 1.08-.2.4.2 1.57.79 1.97 1.18.4.4.2 1.18-.1 1.58l-.72-.02z"/>
        </svg>
      ),
      available: true
    },
    {
      id: "Website",
      name: "Website (Chat)",
      description: "Adicione o agente ao chat do seu site",
      icon: <MessageSquare size={24} color="#4A7AFF" />,
      available: true
    },
    {
      id: "Instagram",
      name: "Instagram",
      description: "Conecte o agente às mensagens diretas do Instagram",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#E1306C" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2c-2.716 0-3.056.012-4.123.06-1.064.049-1.791.218-2.427.465a4.901 4.901 0 00-1.772 1.153A4.902 4.902 0 002.525 5.45c-.247.636-.416 1.363-.465 2.427C2.012 8.944 2 9.284 2 12s.012 3.056.06 4.123c.049 1.064.218 1.791.465 2.427a4.903 4.903 0 001.153 1.772 4.903 4.903 0 001.772 1.153c.636.247 1.363.416 2.427.465 1.067.048 1.407.06 4.123.06s3.056-.012 4.123-.06c1.064-.049 1.791-.218 2.427-.465a4.902 4.902 0 001.772-1.153 4.902 4.902 0 001.153-1.772c.247-.636.416-1.363.465-2.427.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.049-1.064-.218-1.791-.465-2.427a4.902 4.902 0 00-1.153-1.772 4.901 4.901 0 00-1.772-1.153c-.636-.247-1.363-.416-2.427-.465C15.056 2.012 14.716 2 12 2zm0 1.802c2.67 0 2.986.01 4.04.058.975.045 1.504.207 1.857.345.466.182.8.399 1.15.748.35.35.566.684.748 1.15.138.353.3.882.345 1.857.048 1.054.058 1.37.058 4.04 0 2.67-.01 2.986-.058 4.04-.045.975-.207 1.504-.345 1.857-.182.466-.399.8-.748 1.15-.35.35-.684.566-1.15.748-.353.138-.882.3-1.857.345-1.054.048-1.37.058-4.04.058-2.67 0-2.987-.01-4.04-.058-.975-.045-1.504-.207-1.857-.345a3.09 3.09 0 01-1.15-.748 3.09 3.09 0 01-.748-1.15c-.138-.353-.3-.882-.345-1.857-.048-1.054-.058-1.37-.058-4.04 0-2.67.01-2.986.058-4.04.045-.975.207-1.504.345-1.857.182-.466.399-.8.748-1.15.35-.35.684-.566 1.15-.748.353-.138.882-.3 1.857-.345 1.054-.048 1.37-.058 4.04-.058z"/>
          <path d="M12 15.333a3.333 3.333 0 110-6.665 3.333 3.333 0 010 6.665zm0-8.468a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm6.538-.203a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
        </svg>
      ),
      available: true
    },
    {
      id: "Email",
      name: "Email",
      description: "Habilite o agente para responder emails",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#4285F4" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.7l-8 5.334L4 8.7V6.297l8 5.333 8-5.333V8.7z"/>
        </svg>
      ),
      available: true
    }
  ];

  const toggleChannel = (channelId: AgentChannel) => {
    let newSelected;
    if (selectedChannels.includes(channelId)) {
      newSelected = selectedChannels.filter(id => id !== channelId);
    } else {
      newSelected = [...selectedChannels, channelId];
    }
    
    setSelectedChannels(newSelected);
    updateAgent({ channels: newSelected });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Canais de Atendimento</h2>
        <p className="text-gray-600 mb-6">
          Configure em quais canais seu agente estará disponível para atendimento
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((channel) => (
            <Card 
              key={channel.id}
              className={`cursor-pointer relative overflow-hidden transition-all
                ${
                  selectedChannels.includes(channel.id) 
                    ? "border-2 border-viainfra-primary" 
                    : channel.available ? "hover:border-gray-300" : "opacity-50 cursor-not-allowed"
                }
              `}
              onClick={() => channel.available && toggleChannel(channel.id)}
            >
              {selectedChannels.includes(channel.id) && (
                <div className="absolute top-2 right-2 bg-viainfra-primary text-white rounded-full p-1">
                  <Check size={16} />
                </div>
              )}
              <CardContent className="p-4 flex">
                <div className="mr-4 flex items-center justify-center">
                  {channel.icon}
                </div>
                <div>
                  <Label className="text-base font-medium block mb-1">{channel.name}</Label>
                  <p className="text-sm text-gray-500">{channel.description}</p>
                  {!channel.available && <p className="text-xs text-yellow-600 mt-1">Em breve</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">Configuração de Canais</h3>
        <p className="text-sm text-gray-500 mb-4">
          Após criar seu agente, você poderá configurar detalhes específicos de cada canal nas configurações do agente.
        </p>
      </div>
    </div>
  );
};
