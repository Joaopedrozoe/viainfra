
import { Agent } from "@/types/agent";

export const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Atendente Virtual",
    function: "Suporte",
    status: "active",
    tone: "Formal",
    description: "Agente para atendimento de suporte nível 1",
    channels: ["WhatsApp", "Website"],
    knowledgeFiles: ["manual.pdf", "faq.pdf"],
    knowledgeQA: [
      { question: "Como trocar senha?", answer: "Acesse seu perfil e clique em 'Trocar senha'" },
      { question: "Como cancelar assinatura?", answer: "Entre em contato com o suporte através do e-mail cancelamento@empresa.com" }
    ],
    knowledgeURLs: ["https://empresa.com/faq", "https://empresa.com/tutoriais"],
    template: "Suporte N1",
    processes: [
      { id: "p1", order: 1, description: "Cumprimentar e identificar cliente" },
      { id: "p2", order: 2, description: "Identificar problema" },
      { id: "p3", order: 3, description: "Buscar solução na base de conhecimento" },
      { id: "p4", order: 4, description: "Transferir para humano se necessário" }
    ],
    createdAt: "2024-04-01T10:00:00Z",
    updatedAt: "2024-04-10T14:30:00Z",
    metrics: {
      conversations: 143,
      successRate: 78,
      humanTransfers: 22
    }
  },
  {
    id: "2",
    name: "Vendas Automático",
    function: "Vendas",
    status: "training",
    tone: "Amigável",
    description: "Agente para qualificação de leads",
    channels: ["Instagram", "Website"],
    knowledgeFiles: ["produtos.pdf", "precos.csv"],
    knowledgeQA: [
      { question: "Qual o preço do plano básico?", answer: "O plano básico custa R$ 99,90 por mês" },
      { question: "Aceitam pagamento anual?", answer: "Sim, com 20% de desconto no pagamento anual" }
    ],
    knowledgeURLs: ["https://empresa.com/produtos", "https://empresa.com/precos"],
    template: "Vendas",
    processes: [
      { id: "p1", order: 1, description: "Cumprimentar e qualificar lead" },
      { id: "p2", order: 2, description: "Identificar necessidades" },
      { id: "p3", order: 3, description: "Apresentar soluções adequadas" },
      { id: "p4", order: 4, description: "Agendar demonstração" }
    ],
    createdAt: "2024-03-15T09:00:00Z",
    updatedAt: "2024-04-12T11:20:00Z",
    metrics: {
      conversations: 87,
      successRate: 65,
      humanTransfers: 15
    }
  },
  {
    id: "3",
    name: "SDR Virtual",
    function: "SDR",
    status: "error",
    tone: "Profissional",
    description: "Agente para prospecção de clientes",
    channels: ["Email", "WhatsApp"],
    knowledgeFiles: ["prospects.csv", "scripts.pdf"],
    knowledgeQA: [
      { question: "Quem é o público-alvo?", answer: "Empresas de médio porte nos segmentos de varejo e serviços" },
      { question: "Qual a proposta de valor?", answer: "Aumentar conversão de vendas em 30% com automação" }
    ],
    knowledgeURLs: ["https://empresa.com/casos-de-sucesso"],
    template: "SDR",
    processes: [
      { id: "p1", order: 1, description: "Enviar primeira mensagem" },
      { id: "p2", order: 2, description: "Identificar interesse" },
      { id: "p3", order: 3, description: "Qualificar lead" },
      { id: "p4", order: 4, description: "Agendar reunião com vendedor" }
    ],
    createdAt: "2024-02-20T14:00:00Z",
    updatedAt: "2024-04-15T09:40:00Z",
    metrics: {
      conversations: 212,
      successRate: 45,
      humanTransfers: 8
    }
  },
  {
    id: "4",
    name: "Recepcionista Digital",
    function: "Suporte",
    status: "active",
    tone: "Cordial",
    description: "Agente para recepção e direcionamento de visitantes",
    channels: ["WhatsApp", "Website"],
    knowledgeFiles: ["horarios.pdf", "localizacao.pdf"],
    knowledgeQA: [
      { question: "Qual o horário de funcionamento?", answer: "Funcionamos de segunda a sexta das 8h às 18h" },
      { question: "Como chegar até vocês?", answer: "Estamos localizados na Rua das Flores, 123 - Centro" }
    ],
    knowledgeURLs: ["https://empresa.com/contato", "https://empresa.com/como-chegar"],
    template: "Suporte N1",
    processes: [
      { id: "p1", order: 1, description: "Saudar visitante" },
      { id: "p2", order: 2, description: "Identificar motivo da visita" },
      { id: "p3", order: 3, description: "Direcionar para setor adequado" },
      { id: "p4", order: 4, description: "Agendar reunião se necessário" }
    ],
    createdAt: "2024-03-10T08:00:00Z",
    updatedAt: "2024-04-18T16:45:00Z",
    metrics: {
      conversations: 324,
      successRate: 89,
      humanTransfers: 45
    }
  },
  {
    id: "5",
    name: "Consultor Financeiro",
    function: "Genérico",
    status: "active",
    tone: "Técnico",
    description: "Agente especializado em consultoria financeira",
    channels: ["WhatsApp", "Email"],
    knowledgeFiles: ["produtos-financeiros.pdf", "regulamentacoes.pdf"],
    knowledgeQA: [
      { question: "Quais são as taxas de juros?", answer: "As taxas variam de 1,2% a 3,5% ao mês dependendo do produto" },
      { question: "Qual o prazo máximo de financiamento?", answer: "O prazo máximo é de 60 meses para pessoa física" }
    ],
    knowledgeURLs: ["https://empresa.com/produtos-financeiros"],
    template: "Genérico",
    processes: [
      { id: "p1", order: 1, description: "Analisar perfil do cliente" },
      { id: "p2", order: 2, description: "Identificar necessidade financeira" },
      { id: "p3", order: 3, description: "Apresentar produtos adequados" },
      { id: "p4", order: 4, description: "Encaminhar para análise de crédito" }
    ],
    createdAt: "2024-01-15T11:30:00Z",
    updatedAt: "2024-04-20T10:15:00Z",
    metrics: {
      conversations: 156,
      successRate: 72,
      humanTransfers: 28
    }
  },
  {
    id: "6",
    name: "Assistente de RH",
    function: "Suporte",
    status: "training",
    tone: "Empático",
    description: "Agente para atendimento de colaboradores e candidatos",
    channels: ["Website", "Email", "WhatsApp"],
    knowledgeFiles: ["politicas-rh.pdf", "beneficios.pdf"],
    knowledgeQA: [
      { question: "Como solicitar férias?", answer: "Acesse o portal do colaborador e preencha o formulário de solicitação" },
      { question: "Quais são os benefícios oferecidos?", answer: "Vale alimentação, plano de saúde, auxílio creche e gympass" }
    ],
    knowledgeURLs: ["https://empresa.com/portal-colaborador"],
    template: "Suporte N1",
    processes: [
      { id: "p1", order: 1, description: "Identificar tipo de solicitação" },
      { id: "p2", order: 2, description: "Verificar políticas aplicáveis" },
      { id: "p3", order: 3, description: "Orientar sobre procedimentos" },
      { id: "p4", order: 4, description: "Encaminhar para analista se necessário" }
    ],
    createdAt: "2024-02-28T14:20:00Z",
    updatedAt: "2024-04-22T09:30:00Z",
    metrics: {
      conversations: 98,
      successRate: 81,
      humanTransfers: 19
    }
  }
];
