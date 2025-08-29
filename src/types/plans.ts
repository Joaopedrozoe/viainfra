export type PlanType = "inicial" | "intermediario" | "avancado";

export interface PlanLimits {
  channels: number;
  contacts: number;
  historyDays: number | "unlimited";
  users: number;
  aiAgents: number;
  hasSchedule: boolean;
  hasBulkMessaging: boolean;
  hasAiAgents: boolean;
  hasApi: boolean;
  supportLevel: "email" | "priority" | "24_7";
}

export interface Plan {
  id: PlanType;
  name: string;
  price: string;
  description: string;
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
}

export interface UserPlan {
  type: PlanType;
  limits: PlanLimits;
  usage: {
    channels: number;
    contacts: number;
    aiAgents: number;
  };
}

export const PLAN_FEATURES = {
  INBOX: "inbox",
  SCHEDULE: "schedule", 
  AI_AGENTS: "ai_agents",
  BULK_MESSAGING: "bulk_messaging",
  API: "api",
  WIDGET: "widget"
} as const;

export type PlanFeature = typeof PLAN_FEATURES[keyof typeof PLAN_FEATURES];