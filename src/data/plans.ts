import { Plan } from "@/types/plans";

export const PLANS: Plan[] = [
  {
    id: "inicial",
    name: "Inicial",
    price: "R$ 97",
    description: "Ideal para pequenas empresas iniciando",
    features: [
      "Central de atendimento (Inbox)",
      "Até 3 canais de comunicação",
      "1.000 contatos",
      "Histórico de 30 dias",
      "Widget básico para site",
      "Suporte por email"
    ],
    limits: {
      channels: 3,
      contacts: 1000,
      historyDays: 30,
      users: 1,
      aiAgents: 0,
      hasSchedule: false,
      hasBulkMessaging: false,
      hasAiAgents: false,
      hasApi: false,
      supportLevel: "email"
    }
  },
  {
    id: "intermediario",
    name: "Intermediário",
    price: "R$ 197",
    description: "Para empresas em crescimento",
    features: [
      "Todas as funcionalidades do plano inicial",
      "Agenda integrada",
      "Disparo de mensagens para lista",
      "5.000 contatos",
      "Histórico de 90 dias",
      "Widget personalizado",
      "Suporte prioritário"
    ],
    limits: {
      channels: 3,
      contacts: 5000,
      historyDays: 90,
      users: 3,
      aiAgents: 0,
      hasSchedule: true,
      hasBulkMessaging: true,
      hasAiAgents: false,
      hasApi: false,
      supportLevel: "priority"
    },
    popular: true
  },
  {
    id: "avancado",
    name: "Avançado",
    price: "R$ 397",
    description: "Para operações completas",
    features: [
      "Todas as funcionalidades do plano intermediário",
      "Módulo Agentes de IA (1 incluso)",
      "Até 5 canais de comunicação",
      "Contatos ilimitados",
      "Histórico ilimitado",
      "API completa",
      "Suporte 24/7",
      "Agentes adicionais: R$ 97/mês cada"
    ],
    limits: {
      channels: 5,
      contacts: -1, // unlimited
      historyDays: "unlimited",
      users: 10,
      aiAgents: 1,
      hasSchedule: true,
      hasBulkMessaging: true,
      hasAiAgents: true,
      hasApi: true,
      supportLevel: "24_7"
    }
  }
];

// Mock user plan data (será substituído pelo Supabase)
export const MOCK_USER_PLAN = {
  type: "inicial" as const,
  limits: PLANS[0].limits,
  usage: {
    channels: 0,
    contacts: 0,
    aiAgents: 0
  }
};