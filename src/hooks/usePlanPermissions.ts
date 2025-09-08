import { useMemo } from "react";
import { PlanFeature, PLAN_FEATURES } from "@/types/plans";
import { MOCK_USER_PLAN, PLANS } from "@/data/plans";

export const usePlanPermissions = () => {
  // TODO: Substituir por dados reais do backend via API
  const userPlan = MOCK_USER_PLAN;
  
  const currentPlan = useMemo(() => {
    return PLANS.find(plan => plan.id === userPlan.type) || PLANS[0];
  }, [userPlan.type]);

  const hasFeature = (feature: PlanFeature): boolean => {
    switch (feature) {
      case PLAN_FEATURES.INBOX:
        return true; // Todos os planos têm inbox
      case PLAN_FEATURES.SCHEDULE:
        return true; // Permitir acesso à agenda sempre
      case PLAN_FEATURES.AI_AGENTS:
        return true; // Permitir acesso aos agentes sempre
      case PLAN_FEATURES.BULK_MESSAGING:
        return currentPlan.limits.hasBulkMessaging;
      case PLAN_FEATURES.API:
        return currentPlan.limits.hasApi;
      case PLAN_FEATURES.WIDGET:
        return true; // Todos os planos têm widget
      default:
        return false;
    }
  };

  const canAddChannel = (): boolean => {
    return userPlan.usage.channels < currentPlan.limits.channels;
  };

  const canAddContact = (): boolean => {
    if (currentPlan.limits.contacts === -1) return true; // unlimited
    return userPlan.usage.contacts < currentPlan.limits.contacts;
  };

  const canAddAiAgent = (): boolean => {
    if (!currentPlan.limits.hasAiAgents) return false;
    return userPlan.usage.aiAgents < currentPlan.limits.aiAgents;
  };

  const getUsagePercentage = (type: 'channels' | 'contacts' | 'aiAgents'): number => {
    const usage = userPlan.usage[type];
    const limit = type === 'contacts' && currentPlan.limits.contacts === -1 
      ? 100 
      : currentPlan.limits[type];
    
    if (limit === -1 || limit === 0) return 0;
    return Math.round((usage / limit) * 100);
  };

  const isNearLimit = (type: 'channels' | 'contacts' | 'aiAgents', threshold = 80): boolean => {
    return getUsagePercentage(type) >= threshold;
  };

  return {
    userPlan,
    currentPlan,
    hasFeature,
    canAddChannel,
    canAddContact,
    canAddAiAgent,
    getUsagePercentage,
    isNearLimit
  };
};