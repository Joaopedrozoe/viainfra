
export type AgentStatus = "active" | "training" | "error";

export type AgentFunction = "SDR" | "Suporte" | "Vendas" | "Genérico";

export type AgentTemplate = "SDR" | "Suporte N1" | "Vendas" | "Genérico";

export type AgentChannel = "WhatsApp" | "Instagram" | "Email" | "Website";

export type AgentProcess = {
  id: string;
  order: number;
  description: string;
};

export type AgentIntegration = {
  type: "n8n" | "zapier" | "custom";
  webhookUrl?: string;
  headers?: string;
  payloadTemplate?: string;
  enabled: boolean;
  sharedResources?: {
    knowledgeBase: boolean;
    processes: boolean;
    conversations: boolean;
    userData: boolean;
  };
};

export interface Agent {
  id: string;
  name: string;
  function: AgentFunction;
  status: AgentStatus;
  tone: string;
  description: string;
  channels: AgentChannel[];
  knowledgeFiles: string[];
  knowledgeQA: { question: string; answer: string }[];
  knowledgeURLs: string[];
  template: AgentTemplate;
  processes: AgentProcess[];
  integrations?: AgentIntegration[];
  createdAt: string;
  updatedAt: string;
  metrics: {
    conversations: number;
    successRate: number;
    humanTransfers: number;
  };
}
