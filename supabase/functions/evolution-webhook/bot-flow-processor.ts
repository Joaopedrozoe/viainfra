// Bot Flow Processor - Processa o fluxo do bot baseado no estado da conversa

export interface BotFlowNode {
  id: string;
  type: 'start' | 'message' | 'question' | 'condition' | 'action' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    message?: string;
    question?: string;
    options?: string[];
    action?: string;
    actionType?: 'api' | 'transfer' | 'input';
    condition?: string;
    fields?: Array<{ key: string; value: string }>;
  };
}

export interface BotFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface BotFlow {
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
}

export interface ConversationState {
  currentNodeId: string;
  collectedData: Record<string, any>;
  waitingForInput?: string;
}

export class BotFlowProcessor {
  private flow: BotFlow;
  private conversationState: ConversationState;

  constructor(flow: BotFlow, conversationState?: ConversationState) {
    this.flow = flow;
    this.conversationState = conversationState || {
      currentNodeId: 'start-1',
      collectedData: {},
    };
  }

  async processUserInput(userInput: string): Promise<{
    response: string;
    newState: ConversationState;
    shouldTransferToAgent: boolean;
    shouldCallApi?: { action: string; data: any };
  }> {
    const currentNode = this.flow.nodes.find(n => n.id === this.conversationState.currentNodeId);
    
    if (!currentNode) {
      return {
        response: 'Desculpe, ocorreu um erro. Digite 0 para voltar ao menu principal.',
        newState: { currentNodeId: 'menu-1', collectedData: {} },
        shouldTransferToAgent: false,
      };
    }

    // Verificar se usuário quer voltar ao menu (funciona em qualquer estado)
    if (userInput === '0') {
      this.conversationState = {
        currentNodeId: 'start-1',
        collectedData: {},
      };
      
      const startNode = this.flow.nodes.find(n => n.id === 'start-1');
      if (startNode) {
        return this.processNode(startNode);
      }
    }

    // Se estamos aguardando input de algum campo
    if (this.conversationState.waitingForInput) {
      const fieldKey = this.conversationState.waitingForInput;
      this.conversationState.collectedData[fieldKey] = userInput;
      delete this.conversationState.waitingForInput;

      // Avançar para o próximo nó
      const nextNode = this.getNextNode(currentNode.id);
      if (nextNode) {
        return this.processNode(nextNode);
      }
    }

    // Processar input do usuário baseado no tipo do nó atual
    if (currentNode.type === 'question') {
      return this.processQuestionResponse(currentNode, userInput);
    }

    // Se chegamos aqui, processar o nó atual
    return this.processNode(currentNode);
  }

  private async processNode(node: BotFlowNode): Promise<any> {
    this.conversationState.currentNodeId = node.id;

    // Tratamento especial por ID do nó (para nós que não existem no fluxo visual)
    if (node.id === 'consultar-chamado') {
      return {
        response: '🔍 **Consulta de Chamado**\n\nPara consultar o status do seu chamado, vou transferir você para um de nossos atendentes.\n\n👤 Aguarde um momento...',
        newState: this.conversationState,
        shouldTransferToAgent: true,
      };
    }

    switch (node.type) {
      case 'start':
        // Após a mensagem de start, avançar automaticamente para o menu
        const startMessage = node.data.message || 'Olá! Bem-vindo!';
        const nextAfterStart = this.getNextNode(node.id);
        
        if (nextAfterStart && nextAfterStart.type === 'question') {
          // Combinar mensagem de boas-vindas com as opções do menu
          let menuText = nextAfterStart.data.question || '';
          if (nextAfterStart.data.options) {
            menuText += '\n\n' + nextAfterStart.data.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');
            menuText += '\n\nDigite o número da opção desejada:';
          }
          
          this.conversationState.currentNodeId = nextAfterStart.id;
          
          return {
            response: `${startMessage}\n\n${menuText}`,
            newState: this.conversationState,
            shouldTransferToAgent: false,
          };
        }
        
        return {
          response: startMessage,
          newState: this.conversationState,
          shouldTransferToAgent: false,
        };

      case 'message':
        const nextNode = this.getNextNode(node.id);
        if (nextNode) {
          return this.processNode(nextNode);
        }
        return {
          response: node.data.message || '',
          newState: this.conversationState,
          shouldTransferToAgent: false,
        };

      case 'question':
        let questionText = node.data.question || '';
        if (node.data.options) {
          questionText += '\n\n' + node.data.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');
          questionText += '\n\nDigite o número da opção desejada:';
        }
        return {
          response: questionText,
          newState: this.conversationState,
          shouldTransferToAgent: false,
        };

      case 'action':
        return this.processAction(node);

      case 'end':
        return {
          response: node.data.message || 'Conversa encerrada.',
          newState: { currentNodeId: 'start-1', collectedData: {} },
          shouldTransferToAgent: false,
        };

      default:
        const next = this.getNextNode(node.id);
        if (next) {
          return this.processNode(next);
        }
        return {
          response: 'Ocorreu um erro no fluxo.',
          newState: this.conversationState,
          shouldTransferToAgent: false,
        };
    }
  }

  private async processQuestionResponse(node: BotFlowNode, userInput: string): Promise<any> {
    const options = node.data.options || [];
    
    // Verificar se é opção de voltar ao menu
    if (userInput === '0') {
      // Resetar estado e voltar ao início do fluxo
      this.conversationState = {
        currentNodeId: 'start-1',
        collectedData: {},
      };
      
      // Encontrar o nó de start e processar para mostrar o menu
      const startNode = this.flow.nodes.find(n => n.id === 'start-1');
      if (startNode) {
        return this.processNode(startNode);
      }
      
      return {
        response: 'Voltando ao menu principal...',
        newState: { currentNodeId: 'start-1', collectedData: {} },
        shouldTransferToAgent: false,
      };
    }

    // Tratamento especial para seleção de placa
    if (node.id === 'chamado-placa') {
      const optionIndex = parseInt(userInput) - 1;
      const placasDisponiveis = this.conversationState.collectedData['placas_disponiveis'] || [];
      
      if (!isNaN(optionIndex) && optionIndex >= 0 && optionIndex < placasDisponiveis.length) {
        const placaSelecionada = placasDisponiveis[optionIndex];
        
        // Salvar a placa real selecionada
        this.conversationState.collectedData['chamado-placa'] = placaSelecionada;
        
        // Encontrar o próximo nó
        const nextNode = this.getNextNode(node.id);
        if (nextNode) {
          return this.processNode(nextNode);
        }
      }
      
      // Se entrada inválida para placa
      return {
        response: `Opção inválida. Por favor, escolha um número entre 1 e ${placasDisponiveis.length}.\n\nDigite 0 para voltar ao menu.`,
        newState: this.conversationState,
        shouldTransferToAgent: false,
      };
    }

    // Verificar se é uma opção válida (número) para outros nós
    const optionIndex = parseInt(userInput) - 1;
    if (!isNaN(optionIndex) && optionIndex >= 0 && optionIndex < options.length) {
      const selectedOption = options[optionIndex];
      
      // Salvar a escolha
      this.conversationState.collectedData[node.id] = selectedOption;
      
      // Encontrar o próximo nó baseado na opção
      const nextNode = this.getNextNodeByOption(node.id, optionIndex);
      if (nextNode) {
        return this.processNode(nextNode);
      }
    }

    // Se entrada inválida
    return {
      response: `Opção inválida. Por favor, escolha um número entre 1 e ${options.length}.\n\nDigite 0 para voltar ao menu.`,
      newState: this.conversationState,
      shouldTransferToAgent: false,
    };
  }

  private async processAction(node: BotFlowNode): Promise<any> {
    const actionType = node.data.actionType;

    // Opção 3 - Consultar Chamado: transferir para atendente por enquanto
    if (node.id === 'consultar-chamado') {
      return {
        response: '🔍 **Consulta de Chamado**\n\nPara consultar o status do seu chamado, vou transferir você para um de nossos atendentes.\n\n👤 Aguarde um momento...',
        newState: this.conversationState,
        shouldTransferToAgent: true,
      };
    }

    if (actionType === 'transfer') {
      return {
        response: node.data.action || '👤 Aguarde um momento...\n\nEstou transferindo você para um atendente.',
        newState: this.conversationState,
        shouldTransferToAgent: true,
      };
    }

    if (actionType === 'input') {
      // Aguardar input do usuário
      const fieldKey = node.id;
      this.conversationState.waitingForInput = fieldKey;
      
      return {
        response: node.data.action || 'Por favor, forneça a informação solicitada:',
        newState: this.conversationState,
        shouldTransferToAgent: false,
      };
    }

    if (actionType === 'api') {
      // Determinar qual API chamar baseado no nó
      if (node.id === 'chamado-inicio') {
        // Buscar dados da API
        return {
          response: '📋 Buscando informações...',
          newState: this.conversationState,
          shouldTransferToAgent: false,
          shouldCallApi: {
            action: 'fetch-placas',
            data: this.conversationState.collectedData,
          },
        };
      }

      if (node.id === 'chamado-criar') {
        // Criar chamado
        return {
          response: '✅ Criando chamado...',
          newState: this.conversationState,
          shouldTransferToAgent: false,
          shouldCallApi: {
            action: 'create-chamado',
            data: this.conversationState.collectedData,
          },
        };
      }
    }

    // Avançar para o próximo nó
    const nextNode = this.getNextNode(node.id);
    if (nextNode) {
      return this.processNode(nextNode);
    }

    return {
      response: 'Ação processada.',
      newState: this.conversationState,
      shouldTransferToAgent: false,
    };
  }

  private getNextNode(currentNodeId: string): BotFlowNode | null {
    const edge = this.flow.edges.find(e => e.source === currentNodeId);
    if (!edge) return null;
    
    return this.flow.nodes.find(n => n.id === edge.target) || null;
  }

  private getNextNodeByOption(currentNodeId: string, optionIndex: number): BotFlowNode | null {
    const edges = this.flow.edges.filter(e => e.source === currentNodeId);
    
    // Tentar encontrar edge com label correspondente
    const currentNode = this.flow.nodes.find(n => n.id === currentNodeId);
    if (currentNode?.data.options && currentNode.data.options[optionIndex]) {
      const optionText = currentNode.data.options[optionIndex];
      
      // Mapear opções do menu para os nós corretos
      if (currentNodeId === 'menu-1') {
        const targetMap: Record<number, string> = {
          0: 'chamado-inicio',    // Abrir Chamado
          1: 'atendente-inicio',  // Falar com Atendente
          2: 'consultar-chamado', // Consultar Chamado
          3: 'faq',               // FAQ
        };
        
        const targetNodeId = targetMap[optionIndex];
        if (targetNodeId) {
          // Verificar se o nó existe no fluxo
          const existingNode = this.flow.nodes.find(n => n.id === targetNodeId);
          if (existingNode) {
            return existingNode;
          }
          
          // Criar nó virtual para fluxos que não existem no builder visual
          const virtualNodes: Record<string, BotFlowNode> = {
            'consultar-chamado': {
              id: 'consultar-chamado',
              type: 'action',
              position: { x: 0, y: 0 },
              data: {
                label: 'Consultar Chamado',
                actionType: 'transfer',
              }
            },
            'faq': {
              id: 'faq',
              type: 'question',
              position: { x: 0, y: 0 },
              data: {
                label: 'FAQ',
                question: '❓ **Perguntas Frequentes**\n\nEscolha uma opção:',
                options: [
                  'Como abrir um chamado?',
                  'Quanto tempo leva o atendimento?',
                  'Como acompanhar meu chamado?',
                  'Qual o horário de atendimento?'
                ]
              }
            }
          };
          
          if (virtualNodes[targetNodeId]) {
            return virtualNodes[targetNodeId];
          }
        }
      }
      
      // Tratamento para FAQ sub-opções
      if (currentNodeId === 'faq') {
        const faqResponses: Record<number, string> = {
          0: '📋 **Como abrir um chamado?**\n\nPara abrir um chamado, selecione a opção **1 - Abrir Chamado** no menu principal. Você precisará informar:\n• Seu nome\n• A placa do veículo\n• O local\n• A descrição do problema\n\nDigite **0** para voltar ao menu principal.',
          1: '⏱️ **Tempo de atendimento**\n\nO tempo médio de resposta é de até **2 horas** em dias úteis. Chamados urgentes são priorizados.\n\nDigite **0** para voltar ao menu principal.',
          2: '🔍 **Como acompanhar meu chamado?**\n\nPara acompanhar seu chamado, selecione a opção **3 - Consultar Chamado** no menu principal e informe o número do seu chamado.\n\nDigite **0** para voltar ao menu principal.',
          3: '🕐 **Horário de atendimento**\n\nNosso horário de atendimento:\n\n• **Segunda a Quinta**: 8h às 17h\n• **Sexta-feira**: 8h às 16h\n\nFora deste horário, você pode abrir um chamado que será atendido no próximo dia útil.\n\nDigite **0** para voltar ao menu principal.'
        };
        
        if (faqResponses[optionIndex]) {
          // Criar nó virtual com a resposta
          return {
            id: `faq-resposta-${optionIndex}`,
            type: 'message',
            position: { x: 0, y: 0 },
            data: {
              label: 'FAQ Resposta',
              message: faqResponses[optionIndex]
            }
          } as BotFlowNode;
        }
      }
    }
    
    // Caso contrário, usar o edge pelo índice
    if (edges[optionIndex]) {
      return this.flow.nodes.find(n => n.id === edges[optionIndex].target) || null;
    }
    
    // Fallback: usar o primeiro edge
    if (edges.length > 0) {
      return this.flow.nodes.find(n => n.id === edges[0].target) || null;
    }
    
    return null;
  }

  getState(): ConversationState {
    return this.conversationState;
  }
}
