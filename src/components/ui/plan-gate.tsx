import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Zap } from "lucide-react";
import { PlanFeature } from "@/types/plans";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { PLANS } from "@/data/plans";

interface PlanGateProps {
  children: ReactNode;
  feature: PlanFeature;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export const PlanGate = ({ 
  children, 
  feature, 
  fallback, 
  showUpgrade = true 
}: PlanGateProps) => {
  const { hasFeature, currentPlan } = usePlanPermissions();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const requiredPlan = PLANS.find(plan => {
    switch (feature) {
      case "schedule":
        return plan.limits.hasSchedule;
      case "ai_agents":
        return plan.limits.hasAiAgents;
      case "bulk_messaging":
        return plan.limits.hasBulkMessaging;
      case "api":
        return plan.limits.hasApi;
      default:
        return false;
    }
  });

  const getFeatureName = (feature: PlanFeature): string => {
    switch (feature) {
      case "schedule":
        return "Agenda";
      case "ai_agents":
        return "Agentes de IA";
      case "bulk_messaging":
        return "Disparo em Massa";
      case "api":
        return "API Completa";
      default:
        return "Funcionalidade";
    }
  };

  return (
    <Card className="border-2 border-dashed border-muted">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {getFeatureName(feature)}
          <Badge variant="outline" className="text-xs">
            {requiredPlan?.name}+
          </Badge>
        </CardTitle>
        <CardDescription>
          Esta funcionalidade está disponível a partir do plano {requiredPlan?.name}.
          Seu plano atual: {currentPlan.name}
        </CardDescription>
      </CardHeader>
      {showUpgrade && (
        <CardContent className="text-center">
          <Button className="w-full" size="lg">
            <Zap className="w-4 h-4 mr-2" />
            Fazer Upgrade para {requiredPlan?.name}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            A partir de {requiredPlan?.price}/mês
          </p>
        </CardContent>
      )}
    </Card>
  );
};

interface PlanBadgeProps {
  feature: PlanFeature;
  className?: string;
}

export const PlanBadge = ({ feature, className }: PlanBadgeProps) => {
  const { hasFeature } = usePlanPermissions();

  if (hasFeature(feature)) {
    return null;
  }

  const requiredPlan = PLANS.find(plan => {
    switch (feature) {
      case "schedule":
        return plan.limits.hasSchedule;
      case "ai_agents":
        return plan.limits.hasAiAgents;
      case "bulk_messaging":
        return plan.limits.hasBulkMessaging;
      case "api":
        return plan.limits.hasApi;
      default:
        return false;
    }
  });

  return (
    <Badge variant="outline" className={className}>
      <Lock className="w-3 h-3 mr-1" />
      {requiredPlan?.name}+
    </Badge>
  );
};