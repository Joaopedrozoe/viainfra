
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Agent } from "@/types/agent";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
}

interface AgentChatSimulatorProps {
  agent: Partial<Agent>;
}

export const AgentChatSimulator = ({ agent }: AgentChatSimulatorProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: `Olá! Eu sou ${agent.name || 'seu assistente virtual'}. Como posso ajudar você hoje?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: "user",
        text: input.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);
      
      // Simulate agent response
      setTimeout(() => {
        let response = "Desculpe, não entendi sua pergunta.";
        
        // Simple response simulation based on keywords
        const lowercaseInput = input.toLowerCase();
        
        if (lowercaseInput.includes("olá") || lowercaseInput.includes("oi")) {
          response = `Olá! Em que posso ajudar você hoje?`;
        } else if (lowercaseInput.includes("ajuda") || lowercaseInput.includes("ajudar")) {
          response = `Claro, estou aqui para ajudar. O que você precisa?`;
        } else if (lowercaseInput.includes("preço") || lowercaseInput.includes("valor") || lowercaseInput.includes("custo")) {
          response = `Nossos preços começam em R$99,90/mês. Posso enviar mais detalhes sobre nossos planos.`;
        } else if (lowercaseInput.includes("contato") || lowercaseInput.includes("falar com humano")) {
          response = `Entendo que você prefira falar com um atendente humano. Vou transferir essa conversa para um dos nossos consultores.`;
        } else if (lowercaseInput.includes("recurso") || lowercaseInput.includes("funcionalidade")) {
          response = `Temos diversas funcionalidades disponíveis. Algumas das principais são: automação de atendimento, integração com WhatsApp e Instagram, relatórios e análises.`;
        } else {
          // Fallback responses
          const fallbacks = [
            "Entendi. Pode me explicar um pouco mais sobre isso?",
            "Interessante. Como posso ajudar você com isso?",
            "Posso fornecer mais informações sobre nossos produtos e serviços.",
            "Gostaria de falar com um de nossos especialistas?",
            "Entendi sua dúvida. Deixe-me verificar as informações para você."
          ];
          
          response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
        
        const agentMessage: Message = {
          id: Date.now().toString(),
          sender: "agent",
          text: response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, agentMessage]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="bg-gray-100 p-3 border-b">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-bonina flex items-center justify-center text-white font-medium mr-2">
            {agent.name?.substring(0, 1) || 'A'}
          </div>
          <div>
            <div className="font-medium">{agent.name || 'Assistente'}</div>
            <div className="text-xs text-gray-500">
              {agent.function || 'Sem função definida'} • Simulação
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === "user"
                  ? "bg-bonina text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="text-sm">{message.text}</div>
              <div
                className={`text-xs mt-1 text-right ${
                  message.sender === "user" ? "text-white/70" : "text-gray-400"
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="p-3 border-t bg-white">
        <div className="flex">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className="flex-1 mr-2 p-2 border rounded resize-none focus:outline-none focus:ring-1 focus:ring-bonina"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isTyping}
            className="bg-bonina hover:bg-bonina/90 text-white"
            size="icon"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};
