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
import { BotVersion } from "@/types/bot";
import { apiClient } from "@/lib/api-client";
import { Channel } from "@/types/conversation";
import { usePreviewConversation } from "@/contexts/PreviewConversationContext";

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

type ChatState = 'start' | 'abrindoChamado' | 'posResumo' | 'escolhendoSetor' | 'atendimento';

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
  const [previewConversationId, setPreviewConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { createPreviewConversation, updatePreviewConversation } = usePreviewConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && botData) {
      setMessages([]);
      setState('start');
      setCurrentFieldIndex(0);
      setChamadoData({});
      setShowInput(false);
      setPreviewConversationId(null);
    }
  }, [isOpen, botData]);

  useEffect(() => {
    if (isOpen && botData && !previewConversationId) {
      // Criar conversa de preview e iniciar chat após render
      const timer = setTimeout(() => {
        createPreviewConversationLocal();
        startChatFromFlow();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, botData, previewConversationId]);

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
    setMessages(prev => {
      const updatedMessages = [...prev, newMessage];
      
      // Atualizar conversa de preview em tempo real (com delay para evitar render cycle)
      if (previewConversationId) {
        setTimeout(() => updatePreviewConversationLocal(updatedMessages), 0);
      }
      
      return updatedMessages;
    });
  };

  const startChatFromFlow = () => {
    const startNode = getStartNode();
    setCurrentNodeId(startNode?.id || 'start');
    
    if (startNode && startNode.data?.message && typeof startNode.data.message === 'string') {
      addMessage(startNode.data.message);
    } else {
      // Fallback para mensagem padrão
      addMessage("Bem-vindo ao autoatendimento da ViaInfra 👋\nComo podemos ajudar hoje?");
    }
    
    // Verificar se há próximo nó automaticamente
    const nextNode = findNextNode(startNode?.id || 'start');
    if (nextNode && nextNode.type === 'question') {
      setTimeout(() => {
        const questionText = typeof nextNode.data?.question === 'string' ? nextNode.data.question : 'Escolha uma opção:';
        addMessage(questionText);
        setCurrentNodeId(nextNode.id);
      }, 1000);
    }
    
    setState('start');
    setShowInput(false);
  };

  // Sistema de navegação dinâmica baseado no fluxo
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  
  // Função para encontrar o próximo nó baseado na opção selecionada
  const findNextNode = (currentNodeId: string, selectedOption?: string) => {
    if (!botData?.flows.nodes || !botData?.flows.edges) return null;
    
    const currentNode = botData.flows.nodes.find(node => node.id === currentNodeId);
    if (!currentNode) return null;
    
    // Se é um nó de pergunta, procurar edge que corresponde à opção
    if (currentNode.type === 'question' && selectedOption) {
      const options = Array.isArray(currentNode.data?.options) ? currentNode.data.options : [];
      const optionIndex = options.indexOf(selectedOption);
      const outgoingEdges = botData.flows.edges.filter(edge => edge.source === currentNodeId);
      
      // Se há edges rotuladas, usar a que corresponde à opção
      const labeledEdge = outgoingEdges.find(edge => edge.label === selectedOption);
      if (labeledEdge) {
        return botData.flows.nodes.find(node => node.id === labeledEdge.target);
      }
      
      // Senão, usar edge por índice
      if (optionIndex !== -1 && outgoingEdges[optionIndex]) {
        return botData.flows.nodes.find(node => node.id === outgoingEdges[optionIndex].target);
      }
    }
    
    // Para outros tipos de nó, usar a primeira edge de saída
    const nextEdge = botData.flows.edges.find(edge => edge.source === currentNodeId);
    if (nextEdge) {
      return botData.flows.nodes.find(node => node.id === nextEdge.target);
    }
    
    return null;
  };

  // Função para obter o nó inicial
  const getStartNode = () => {
    if (!botData?.flows.nodes) return null;
    return botData.flows.nodes.find(node => node.type === 'start') || botData.flows.nodes[0];
  };

  // Função para obter opções do nó atual
  const getCurrentNodeOptions = () => {
    if (!botData?.flows.nodes) return [];
    
    const currentNode = botData.flows.nodes.find(node => node.id === currentNodeId);
    if (!currentNode) return [];
    
    if (currentNode.type === 'question' && Array.isArray(currentNode.data?.options)) {
      return currentNode.data.options;
    }
    
    // Para outros tipos de nó, ver se há próximos nós conectados
    const connectedEdges = botData.flows.edges?.filter(edge => edge.source === currentNodeId) || [];
    if (connectedEdges.length > 0) {
      return ['Continuar'];
    }
    
    return [];
  };

  const startChat = () => {
    const startNode = getStartNode();
    setCurrentNodeId(startNode?.id || 'start');
    
    const startMessage = typeof startNode?.data?.message === 'string' 
      ? startNode.data.message 
      : "Bem-vindo ao autoatendimento da ViaInfra 👋\nComo podemos ajudar hoje?";
    
    addMessage(startMessage);
    
    // Mostrar próxima mensagem ou pergunta automaticamente
    const nextNode = findNextNode(startNode?.id || 'start');
    if (nextNode && nextNode.type === 'question') {
      setTimeout(() => {
        const questionText = typeof nextNode.data?.question === 'string' ? nextNode.data.question : 'Escolha uma opção:';
        addMessage(questionText);
        setCurrentNodeId(nextNode.id);
        setShowInput(false);
      }, 1000);
    } else {
      setShowInput(false);
    }
  };

  const handleOption = (option: string) => {
    addMessage(option, 'user');
    
    if (option === "Abertura de Chamado") {
      setState('abrindoChamado');
      setCurrentFieldIndex(0);
      setChamadoData({});
      setTimeout(() => {
        askNextField();
      }, 500);
    } else if (option === "Falar com Atendente") {
      // Sempre vai para escolha de setor
      setTimeout(() => {
        escolherSetor();
      }, 500);
    } else if (option.includes("💼") || option.includes("🔧") || option.includes("💰") || option.includes("📞") || option.includes("👥")) {
      // É uma escolha de setor - transferir diretamente
      handleSetor(option);
    } else if (option === "Menu Principal") {
      setState('start');
      setCurrentFieldIndex(0);
      setChamadoData({});
      startChatFromFlow();
    } else if (option === "Encerrar Conversa") {
      addMessage("Obrigado por utilizar nosso atendimento! A conversa foi encerrada. 👋");
      setTimeout(() => {
        onClose();
      }, 2000);
    } else if (option === "Continuar") {
      // Não fazer nada específico para "Continuar" - evitar duplicação
      return;
    }
  };

  const askNextField = () => {
    // Buscar campos do nó de ação atual
    const currentNode = botData?.flows.nodes.find(node => node.id === currentNodeId);
    const formFields = currentNode?.data?.actionType === 'form' && Array.isArray(currentNode.data.fields) 
      ? currentNode.data.fields 
      : chamadoFields; // fallback para campos padrão
    
    if (currentFieldIndex < formFields.length) {
      const field = formFields[currentFieldIndex];
      if (typeof field === 'object' && field.label) {
        // Novo formato de campo estruturado
        const fieldPrompt = `Por favor, informe **${field.label}**:`;
        addMessage(fieldPrompt);
        setShowInput(true); // Garantir que o input está visível
      } else if (typeof field === 'object' && field.key) {
        // Formato com key
        const fieldPrompt = `Por favor, informe **${field.key}**:`;
        addMessage(fieldPrompt);
        setShowInput(true); // Garantir que o input está visível
      } else if (typeof field === 'string') {
        // Formato antigo de campo (string)
        const fieldPrompt = `Por favor, informe **${field}**:`;
        addMessage(fieldPrompt);
        setShowInput(true); // Garantir que o input está visível
      }
    } else {
      mostrarResumoChamado(formFields);
    }
  };

  const handleFormInput = (value: string) => {
    // Buscar campos do nó de ação atual
    const currentNode = botData?.flows.nodes.find(node => node.id === currentNodeId);
    const formFields = currentNode?.data?.actionType === 'form' && Array.isArray(currentNode.data.fields) 
      ? currentNode.data.fields 
      : chamadoFields;
    
    const field = formFields[currentFieldIndex];
    const fieldKey = typeof field === 'object' && field.label 
      ? field.label 
      : (typeof field === 'object' && field.key ? field.key : (typeof field === 'string' ? field : `Campo ${currentFieldIndex + 1}`));
    
    // Salvar dados do formulário
    setChamadoData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    // Incrementar índice e verificar próximo campo
    const nextIndex = currentFieldIndex + 1;
    setCurrentFieldIndex(nextIndex);
    
    setTimeout(() => {
      if (nextIndex < formFields.length) {
        const nextField = formFields[nextIndex];
        const nextFieldKey = typeof nextField === 'object' && nextField.label 
          ? nextField.label 
          : (typeof nextField === 'object' && nextField.key ? nextField.key : (typeof nextField === 'string' ? nextField : `Campo ${nextIndex + 1}`));
        addMessage(`Por favor, informe **${nextFieldKey.toUpperCase()}**:`);
      } else {
        mostrarResumoChamado(formFields);
      }
    }, 500);
  };

  const mostrarResumoChamado = (formFields?: any[]) => {
    const numeroChamado = gerarNumeroChamado();
    
    let resumo = "**Resumo do chamado**\n\n";
    
    // Usar campos dinâmicos se disponíveis
    if (formFields && Array.isArray(formFields)) {
      formFields.forEach(field => {
        const fieldKey = typeof field === 'object' && field.label 
          ? field.label 
          : (typeof field === 'object' && field.key ? field.key : (typeof field === 'string' ? field : ''));
        if (fieldKey && chamadoData[fieldKey]) {
          resumo += `**${fieldKey}:** ${chamadoData[fieldKey]}\n`;
        }
      });
    } else {
      // Fallback para campos padrão
      chamadoFields.forEach(field => {
        const fieldKey = typeof field === 'string' ? field : field.key;
        if (chamadoData[fieldKey]) {
          resumo += `**${fieldKey}:** ${chamadoData[fieldKey]}\n`;
        }
      });
    }
    
    resumo += `**Número Chamado:** ${numeroChamado}`;
    
    addMessage(resumo);
    
    setTimeout(() => {
      addMessage("O que deseja fazer agora?");
      setState('posResumo');
      setShowInput(false);
    }, 1500);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    
    // SEMPRE adicionar a mensagem do usuário primeiro
    addMessage(input.trim(), 'user');
    
    if (state === 'abrindoChamado') {
      handleFormInput(input.trim());
    } else if (state === 'atendimento') {
      // Durante o atendimento, apenas resposta genérica para simular
      setTimeout(() => {
        addMessage("Recebido! Nossa equipe verificará sua solicitação e retornará em breve. 📝");
      }, 1000);
    }
    
    setInput("");
  };

  const gerarNumeroChamado = () => {
    const numero = "CH-" + String(chamadoCounter).padStart(4, "0");
    setChamadoCounter(prev => prev + 1);
    return numero;
  };

  const returnToMenu = () => {
    addMessage("Escolha uma nova ação:");
    setShowInput(false);
  };

  const escolherSetor = () => {
    addMessage("Selecione o setor para transferência:");
    setState('escolhendoSetor');
    setShowInput(false);
  };

  const handleSetor = (setor: string) => {
    // Mapear setores para atendentes
    const atendentes = {
      "💼 Comercial": "Elisabete Silva",
      "🔧 Manutenção": "Suelem Souza", 
      "💰 Financeiro": "Giovanna Ferreira",
      "📞 Atendimento": "Joicy Souza",
      "👥 RH": "Sandra Romano"
    };
    
    const nomeAtendente = atendentes[setor as keyof typeof atendentes] || "Atendimento";
    const setorNome = setor.replace(/[💼🔧💰📞👥]\s/, '');
    
    setTimeout(() => {
      addMessage(`Aguarde um momento, você será atendido por **${nomeAtendente}** do setor ${setorNome}...`);
      
      setTimeout(() => {
        addMessage(`Olá! Você está sendo atendido por **${nomeAtendente}**. Como posso ajudá-lo?`);
        
        // Transferir conversa para a lista para atendimento humano
        setTimeout(() => {
          addMessage("Esta conversa foi transferida para nosso atendimento. Aguarde enquanto conectamos você com o atendente responsável. 📞");
          setShowInput(true);
          setState('atendimento');
        }, 1500);
      }, 2000);
    }, 500);
  };

  const createPreviewConversationLocal = () => {
    if (!botData || previewConversationId) return;
    
    try {
      const id = createPreviewConversation(botData.name);
      setPreviewConversationId(id);
      console.log('Conversa de preview criada localmente:', id);
    } catch (error) {
      console.error('Erro ao criar conversa de preview local:', error);
    }
  };

  const updatePreviewConversationLocal = (messages: Message[]) => {
    if (!previewConversationId) return;
    
    try {
      const mappedMessages = messages.map(msg => ({
        content: msg.content,
        isBot: msg.sender === 'bot',
        timestamp: msg.timestamp
      }));

      updatePreviewConversation(previewConversationId, mappedMessages);
    } catch (error) {
      console.error('Erro ao atualizar conversa de preview local:', error);
    }
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
    // Estados específicos têm prioridade
    if (state === 'posResumo') {
      return ["Falar com Atendente", "Menu Principal"];
    } else if (state === 'escolhendoSetor') {
      return ["📞 Atendimento", "💼 Comercial", "🔧 Manutenção", "💰 Financeiro", "👥 RH"];
    }
    
    // Usar o sistema de navegação dinâmica quando possível
    const currentOptions = getCurrentNodeOptions();
    if (Array.isArray(currentOptions) && currentOptions.length > 0) {
      return currentOptions;
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
          
          {!showInput && Array.isArray(getActionButtons()) && getActionButtons().length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {getActionButtons().map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Usar apenas a lógica manual para evitar duplicação
                    if (state === 'escolhendoSetor') {
                      handleSetor(option);
                    } else {
                      handleOption(option);
                    }
                  }}
                  className="text-xs"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {(showInput || state === 'start' || state === 'abrindoChamado' || state === 'atendimento') && (
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