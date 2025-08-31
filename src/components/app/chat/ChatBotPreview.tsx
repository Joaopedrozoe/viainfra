import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { BotVersion } from "@/pages/app/BotBuilder";

interface Message {
  id: string;
  content: string;
  sender: 'bot' | 'user';
  timestamp: string;
}

interface ChatBotPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  botData?: BotVersion;
}

type ChatState = 'start' | 'abrindoChamado' | 'posResumo' | 'escolhendoSetor';

interface ChamadoData {
  [key: string]: string;
}

const chamadoFields = [
  { key: "PLACA", question: "Para começarmos, qual é a **placa do veículo**?" },
  { key: "CORRETIVA", question: "Este chamado é de **manutenção corretiva**? (responda: Sim ou Não)" },
  { key: "CANTEIRO OU OFICINA", question: "O atendimento será no **canteiro** ou na **oficina**?" },
  { key: "AGENDAMENTO", question: "Qual a **data e hora de agendamento**? (ex.: 25/08/2025 14:30)" },
  { key: "DESCRIÇÃO", question: "Descreva brevemente o **problema ou necessidade**." }
];

const agentesSetor = {
  "Atendimento": "Joicy Souza",
  "Comercial": "Elisabete Silva",
  "Manutenção": "Suelem Souza",
  "Financeiro": "Giovanna Ferreira",
  "RH": "Sandra Romano"
};

export function ChatBotPreview({ isOpen, onClose, botData }: ChatBotPreviewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<ChatState>('start');
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [chamadoData, setChamadoData] = useState<ChamadoData>({});
  const [chamadoCounter, setChamadoCounter] = useState(1);
  const [showInput, setShowInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reiniciar conversa sempre que o modal abrir
  useEffect(() => {
    if (isOpen) {
      // Limpar estado
      setMessages([]);
      setInput("");
      setState('start');
      setCurrentFieldIndex(0);
      setChamadoData({});
      setShowInput(false);
      
      // Iniciar conversa com base no fluxo atual
      setTimeout(() => {
        startChatFromFlow();
      }, 100);
    }
  }, [isOpen, botData]);

  const addMessage = (content: string, sender: 'bot' | 'user' = 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startChatFromFlow = () => {
    // Buscar nó de início no fluxo atual
    const startNode = botData?.flows.nodes.find(node => node.type === 'start');
    
    if (startNode && startNode.data?.message && typeof startNode.data.message === 'string') {
      addMessage(startNode.data.message);
    } else {
      // Fallback para mensagem padrão
      addMessage("Bem-vindo ao autoatendimento da ViaInfra 👋\nComo podemos ajudar hoje?");
    }
    
    setState('start');
    setShowInput(false);
  };

  // Função para obter opções dinâmicas do fluxo
  const getDynamicOptions = () => {
    if (!botData?.flows.nodes) return [];
    
    // Buscar nós de pergunta conectados ao nó atual
    const questionNodes = botData.flows.nodes.filter(node => node.type === 'question');
    
    if (questionNodes.length > 0) {
      // Pegar opções do primeiro nó de pergunta encontrado
      const firstQuestion = questionNodes[0];
      if (firstQuestion.data?.options && Array.isArray(firstQuestion.data.options)) {
        return firstQuestion.data.options;
      }
    }
    
    // Fallback para opções padrão
    return ["Abertura de Chamado", "Falar com Atendente", "Encerrar Conversa"];
  };

  const startChat = () => {
    addMessage("Bem-vindo ao autoatendimento da ViaInfra 👋\nComo podemos ajudar hoje?");
    setState('start');
    setShowInput(false);
  };

  const handleOption = (option: string) => {
    addMessage(option, 'user');
    
    if (option === "Abertura de Chamado") {
      setState('abrindoChamado');
      setCurrentFieldIndex(0);
      setChamadoData({});
      askNextField();
    } else if (option === "Falar com Atendente") {
      escolherSetor();
    } else if (option === "Voltar ao início") {
      setState('start');
      returnToMenu();
    } else if (option === "Encerrar Conversa") {
      addMessage("Obrigado por utilizar nosso atendimento! A conversa foi encerrada. 👋");
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const askNextField = () => {
    if (currentFieldIndex < chamadoFields.length) {
      addMessage(chamadoFields[currentFieldIndex].question);
      setShowInput(true);
    } else {
      mostrarResumoChamado();
    }
  };

  const returnToMenu = () => {
    addMessage("Escolha uma nova ação:");
    setShowInput(false);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    addMessage(input.trim(), 'user');
    
    if (state === 'abrindoChamado') {
      const newChamadoData = {
        ...chamadoData,
        [chamadoFields[currentFieldIndex].key]: input.trim()
      };
      setChamadoData(newChamadoData);
      setCurrentFieldIndex(prev => prev + 1);
      
      // Check if we need to ask next field
      if (currentFieldIndex + 1 < chamadoFields.length) {
        setTimeout(() => {
          addMessage(chamadoFields[currentFieldIndex + 1].question);
        }, 500);
      } else {
        setTimeout(() => {
          mostrarResumoChamado();
        }, 500);
      }
    }
    
    setInput("");
  };

  const gerarNumeroChamado = () => {
    const numero = "CH-" + String(chamadoCounter).padStart(4, "0");
    setChamadoCounter(prev => prev + 1);
    return numero;
  };

  const mostrarResumoChamado = () => {
    const numeroChamado = gerarNumeroChamado();
    
    let resumo = "**Resumo do chamado**\n\n";
    chamadoFields.forEach(field => {
      resumo += `**${field.key}:** ${chamadoData[field.key] || ''}\n`;
    });
    resumo += `**Número Chamado:** ${numeroChamado}`;
    
    addMessage(resumo);
    setState('posResumo');
    setShowInput(false);
  };

  const escolherSetor = () => {
    addMessage("Selecione o **setor** para transferência do atendimento:");
    setState('escolhendoSetor');
    setShowInput(false);
  };

  const handleSetor = (setor: string) => {
    addMessage(setor, 'user');
    const agente = agentesSetor[setor as keyof typeof agentesSetor];
    const num = chamadoData["Número Chamado"] ? ` (${Object.values(chamadoData)[0] || 'CH-' + String(chamadoCounter).padStart(4, "0")})` : "";
    
    setTimeout(() => {
      addMessage(`Seu atendimento${num} está sendo transferido para o setor de **${setor}**.\n\n*Por favor, aguarde um momento…*`);
      
      setTimeout(() => {
        addMessage(`Olá! Você está sendo atendido por **${agente}** do setor de ${setor}. Como posso ajudá-lo?`);
        setState('start');
        setShowInput(false);
      }, 2000);
    }, 500);
  };

  const renderMessage = (message: Message) => {
    const isBot = message.sender === 'bot';
    const formattedContent = message.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    return (
      <div
        key={message.id}
        className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
      >
        <div
          className={`max-w-[85%] p-3 rounded-lg ${
            isBot
              ? 'bg-gray-100 text-gray-800'
              : 'bg-viainfra-primary text-white'
          }`}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: formattedContent }}
            className="text-sm"
          />
          <div className={`text-xs mt-1 ${
            isBot ? 'text-gray-500' : 'text-white/70'
          }`}>
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  };

  const getActionButtons = () => {
    if (state === 'start') {
      return getDynamicOptions();
    } else if (state === 'posResumo') {
      return ["Voltar ao início", "Falar com Atendente", "Encerrar Conversa"];
    } else if (state === 'escolhendoSetor') {
      return ["Atendimento", "Comercial", "Manutenção", "Financeiro", "RH"];
    }
    return [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold text-viainfra-primary">
            Preview: {botData?.name || 'Autoatendimento ViaInfra'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map(renderMessage)}
          
          {!showInput && getActionButtons().length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {getActionButtons().map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => state === 'escolhendoSetor' ? handleSetor(option) : handleOption(option)}
                  className="text-xs"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {showInput && (
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua resposta..."
                className="flex-1"
              />
              <Button onClick={sendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}