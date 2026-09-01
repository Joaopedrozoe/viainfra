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
  welcomeMessageSent?: boolean; // Controla se mensagem inicial já foi enviada
  invalidAttempts?: number; // Contador de tentativas inválidas
}

export class BotFlowProcessor {
  private flow: BotFlow;
  private conversationState: ConversationState;
  private companyName: string;

  constructor(flow: BotFlow, conversationState?: ConversationState, companyName: string = 'Viainfra') {
    this.flow = flow;
    this.companyName = companyName;
    this.conversationState = conversationState || {
      currentNodeId: 'start-1',
      collectedData: {},
      welcomeMessageSent: false,
      invalidAttempts: 0,
    };
  }


  // ============================================================
  // Setores canônicos (mesma tabela para todas as empresas)
  // ============================================================
  private static readonly SETORES: Array<{ nome: string; atendente: string; keys: string[] }> = [
    { nome: 'Atendimento', atendente: 'Joicy Souza', keys: ['atendimento', 'atendente', 'suporte'] },
    { nome: 'Comercial', atendente: 'Elisabete Silva', keys: ['comercial', 'vendas', 'venda', 'orcamento'] },
    { nome: 'Manutenção', atendente: 'Suelem Souza', keys: ['manutencao', 'oficina', 'mecanica', 'tecnico'] },
    { nome: 'Financeiro', atendente: 'André Rocha', keys: ['financeiro', 'pagamento', 'boleto', 'nota fiscal', 'cobranca'] },
    { nome: 'RH', atendente: 'Sandra Romano', keys: ['rh', 'recursos humanos', 'vaga', 'curriculo'] },
  ];

  private static readonly SETOR_MENU =
    '👤 **Falar com Atendente**\n\nSelecione o departamento:\n\n1. 📞 Atendimento\n2. 💼 Comercial\n3. 🔧 Manutenção\n4. 💰 Financeiro\n5. 👥 RH\n\nDigite o número da opção desejada ou **0** para voltar ao menu.';

  /** Normaliza a entrada: sem acentos, sem emoji, minúsculo. */
  private normalize(raw: string): string {
    return (raw || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private isGreeting(normalized: string): boolean {
    return /^(oi+|ola+|opa|eai|e ai|hey|hi|hello|alo|bom dia|boa tarde|boa noite|menu|inicio|comecar|come[c]?ar|start|teste|test)$/.test(normalized);
  }

  /** Casa a entrada com uma opção por número ou por texto equivalente. */
  private matchOptionIndex(options: string[], raw: string): number {
    const n = this.normalize(raw);
    if (/^[0-9]+$/.test(n)) {
      const idx = parseInt(n, 10) - 1;
      if (idx >= 0 && idx < options.length) return idx;
      return -1;
    }
    if (!n) return -1;
    for (let i = 0; i < options.length; i++) {
      const opt = this.normalize(options[i]).replace(/^[0-9]+\s*/, '');
      if (!opt) continue;
      if (opt === n || opt.includes(n) || n.includes(opt)) return i;
    }
    return -1;
  }

  /**
   * Entrada não reconhecida: repete a pergunta uma vez antes de transferir.
   * Retorna null quando as tentativas acabaram (aí sim transfere).
   */
  private softRetry(message: string): any | null {
    const attempts = (this.conversationState.invalidAttempts || 0) + 1;
    this.conversationState.invalidAttempts = attempts;
    if (attempts >= 2) return null;
    return {
      response: message,
      newState: this.conversationState,
      shouldTransferToAgent: false,
    };
  }

  private resetInvalidAttempts() {
    this.conversationState.invalidAttempts = 0;
  }

  /** Volta ao menu principal reenviando a saudação completa. */
  private showMainMenu(): any {
    this.conversationState = {
      currentNodeId: 'start-1',
      collectedData: {},
      welcomeMessageSent: false,
      invalidAttempts: 0,
    };
    const startNode = this.flow.nodes.find(n => n.id === 'start-1') ||
      this.flow.nodes.find(n => n.type === 'start');
    if (startNode) return this.processNode(startNode);
    const menuNode = this.flow.nodes.find(n => n.id === 'menu-1');
    if (menuNode) return this.processNode(menuNode);
    return {
      response: 'Voltando ao menu principal...',
      newState: this.conversationState,
      shouldTransferToAgent: false,
    };
  }

  async processUserInput(userInput: string): Promise<{
    response: string;
    newState: ConversationState;
    shouldTransferToAgent: boolean;
    shouldCallApi?: { action: string; data: any };
  }> {
    const normalizedInput = this.normalize(userInput);

    // PRIMEIRO: Verificar se usuário quer voltar ao menu (funciona em qualquer estado)
    if (userInput.trim() === '0' || normalizedInput === 'menu' || normalizedInput === 'voltar') {
      return this.showMainMenu();
    }

    // Saudação ou início de conversa: sempre reapresenta o menu principal,
    // nunca transfere direto para atendente humano.
    const inChamadoInput = !!this.conversationState.waitingForInput ||
      String(this.conversationState.currentNodeId || '').startsWith('chamado');
    if (!inChamadoInput && this.isGreeting(normalizedInput)) {
      return this.showMainMenu();
    }

    const currentNode = this.flow.nodes.find(n => n.id === this.conversationState.currentNodeId);
    
    // Se estamos em um nó virtual (como faq-resposta-X ou escolher-departamento), verificar se usuário quer interagir
    if (!currentNode) {
      // Se o nó atual é escolha de departamento, processar diretamente
      if (this.conversationState.currentNodeId === 'escolher-departamento') {
        // Criar um nó virtual para processar
        const virtualNode: BotFlowNode = {
          id: 'escolher-departamento',
          type: 'question',
          position: { x: 0, y: 0 },
          data: {
            label: 'Escolher Departamento',
            question: 'Selecione o departamento:',
            options: ['Atendimento', 'Comercial', 'Manutenção', 'Financeiro', 'RH']
          }
        };
        return this.processQuestionResponse(virtualNode, userInput);
      }
      
      // Se o nó atual é uma resposta de FAQ, qualquer input volta ao FAQ
      if (this.conversationState.currentNodeId.startsWith('faq-resposta-')) {
        // Voltar para o menu FAQ
        this.conversationState.currentNodeId = 'faq';
        return {
          response: '📚 **Perguntas Frequentes (FAQ)**\n\nEscolha uma opção:\n\n1. Como abrir um chamado?\n2. Qual o tempo de atendimento?\n3. Como acompanhar meu chamado?\n4. Qual o horário de atendimento?\n\nDigite o número da opção ou **0** para voltar ao menu principal.',
          newState: this.conversationState,
          shouldTransferToAgent: false,
        };
      }
      
      // Nó não encontrado - voltar ao menu principal
      return {
        response: 'Desculpe, ocorreu um erro. Vou te levar ao menu principal.',
        newState: { currentNodeId: 'menu-1', collectedData: {} },
        shouldTransferToAgent: false,
      };
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
        // PROTEÇÃO: Mensagem de boas-vindas só é enviada UMA VEZ
        if (this.conversationState.welcomeMessageSent) {
          // Já enviou boas-vindas, ir direto para o menu sem repetir
          const nextNode = this.getNextNode(node.id);
          if (nextNode) {
            return this.processNode(nextNode);
          }
          // Se não há próximo nó, transferir para atendente
          return {
            response: '👤 Conectando você a um atendente...',
            newState: this.conversationState,
            shouldTransferToAgent: true,
          };
        }
        
        // Marcar que enviou boas-vindas
        this.conversationState.welcomeMessageSent = true;
        
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

    // ========== FLUXO DE ESCOLHA DE DEPARTAMENTO ==========
    if (this.conversationState.currentNodeId === 'escolher-departamento') {
      const setores = BotFlowProcessor.SETORES;
      const normalized = this.normalize(userInput);
      let departamento: { nome: string; atendente: string } | null = null;

      if (/^[1-5]$/.test(normalized)) {
        departamento = setores[parseInt(normalized, 10) - 1];
      } else if (normalized) {
        departamento = setores.find(s =>
          s.keys.some(k => normalized === k || normalized.includes(k) || k.includes(normalized))
        ) || null;
      }

      if (departamento) {
        this.resetInvalidAttempts();
        this.conversationState.collectedData['departamento_selecionado'] = departamento.nome;
        this.conversationState.collectedData['atendente_nome'] = departamento.atendente;

        return {
          response: `✅ Você será atendido por **${departamento.atendente}** do setor ${departamento.nome}.\n\n⏳ Aguarde um momento enquanto conectamos você...`,
          newState: this.conversationState,
          shouldTransferToAgent: true,
        };
      }

      // Entrada não reconhecida: repete o menu de setores uma vez antes de transferir
      const retry = this.softRetry(BotFlowProcessor.SETOR_MENU);
      if (retry) return retry;

      return {
        response: '👤 Não entendi sua resposta. Vou transferir você para um atendente humano.\n\n⏳ Aguarde um momento...',
        newState: this.conversationState,
        shouldTransferToAgent: true,
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
      
      // ANTI-LOOP: Opção inválida = transferir para atendente IMEDIATAMENTE
      return {
        response: '👤 Não entendi sua resposta. Vou transferir você para um atendente humano.\n\n⏳ Aguarde um momento...',
        newState: this.conversationState,
        shouldTransferToAgent: true,
      };
    }

    // Verificar se é uma opção válida (número ou texto equivalente)
    const optionIndex = this.matchOptionIndex(options as string[], userInput);
    if (optionIndex >= 0) {
      const selectedOption = options[optionIndex];
      this.resetInvalidAttempts();

      // Salvar a escolha
      this.conversationState.collectedData[node.id] = selectedOption;
      
      // Encontrar o próximo nó baseado na opção
      const nextNode = this.getNextNodeByOption(node.id, optionIndex);
      if (nextNode) {
        return this.processNode(nextNode);
      }
    }

    // No menu principal, texto livre citando um setor vai direto para a
    // escolha de departamento (ex.: "quero falar com a manutenção").
    if (node.id === 'menu-1') {
      const nz = this.normalize(userInput);
      const setorMatch = BotFlowProcessor.SETORES.find(s =>
        s.keys.some(k => nz.includes(k))
      );
      if (setorMatch || /\b(atendente|humano|falar|pessoa)\b/.test(nz)) {
        this.resetInvalidAttempts();
        this.conversationState.currentNodeId = 'escolher-departamento';
        if (setorMatch) {
          return this.processQuestionResponse(
            {
              id: 'escolher-departamento',
              type: 'question',
              position: { x: 0, y: 0 },
              data: { label: 'Escolher Departamento', question: 'Selecione o departamento:', options: [] },
            } as BotFlowNode,
            setorMatch.nome,
          );
        }
        return {
          response: BotFlowProcessor.SETOR_MENU,
          newState: this.conversationState,
          shouldTransferToAgent: false,
        };
      }
    }

    // Entrada não reconhecida: repete a pergunta uma vez antes de transferir
    if (options.length > 0) {
      let repeatText = node.data.question || 'Escolha uma opção:';
      repeatText += '\n\n' + options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n');
      repeatText += '\n\nDigite o número da opção desejada ou **0** para voltar ao menu.';
      const retryOption = this.softRetry(repeatText);
      if (retryOption) return retryOption;
    }

    return {
      response: '👤 Não entendi sua resposta. Vou transferir você para um atendente humano.\n\n⏳ Aguarde um momento...',
      newState: this.conversationState,
      shouldTransferToAgent: true,
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

    // Fluxo "Falar com Atendente" - Início: mostrar opções de departamento
    if (node.id === 'atendente-inicio' || (actionType === 'transfer' && !this.conversationState.collectedData['departamento_selecionado'])) {
      // Se ainda não selecionou departamento, mostrar opções
      this.conversationState.currentNodeId = 'escolher-departamento';
      return {
        response: '👤 **Falar com Atendente**\n\nSelecione o departamento:\n\n1. 📞 Atendimento\n2. 💼 Comercial\n3. 🔧 Manutenção\n4. 💰 Financeiro\n5. 👥 RH\n\nDigite o número da opção desejada ou **0** para voltar ao menu.',
        newState: this.conversationState,
        shouldTransferToAgent: false,
      };
    }

    if (actionType === 'transfer') {
      // Se já tem departamento selecionado, transferir
      const departamento = this.conversationState.collectedData['departamento_selecionado'];
      const atendente = this.conversationState.collectedData['atendente_nome'];
      
      return {
        response: `✅ Você será atendido por **${atendente || 'nossa equipe'}** do setor ${departamento || 'Atendimento'}.\n\n⏳ Aguarde um momento enquanto conectamos você...`,
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
          0: '📋 **Como abrir um chamado?**\n\nPara abrir um chamado, selecione a opção **1 - Abrir Chamado** no menu principal. Você precisará informar:\n• Seu nome\n• A placa do veículo\n• O local\n• A descrição do problema\n\nDigite qualquer tecla para voltar às perguntas ou **0** para o menu principal.',
          1: '⏱️ **Tempo de atendimento**\n\nO tempo médio de resposta é de até **2 horas** em dias úteis. Chamados urgentes são priorizados.\n\nDigite qualquer tecla para voltar às perguntas ou **0** para o menu principal.',
          2: '🔍 **Como acompanhar meu chamado?**\n\nPara acompanhar seu chamado, selecione a opção **3 - Consultar Chamado** no menu principal e informe o número do seu chamado.\n\nDigite qualquer tecla para voltar às perguntas ou **0** para o menu principal.',
          3: '🕐 **Horário de atendimento**\n\nNosso horário de atendimento:\n\n• **Segunda a Quinta**: 7h às 17h\n• **Sexta-feira**: 7h às 16h\n\nFora deste horário, você pode abrir um chamado que será atendido no próximo dia útil.\n\nDigite qualquer tecla para voltar às perguntas ou **0** para o menu principal.'
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
