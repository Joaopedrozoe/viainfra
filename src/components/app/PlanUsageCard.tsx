import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, MessageSquare, Bot } from "lucide-react";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";

export const PlanUsageCard = () => {
  const { 
    currentPlan, 
    userPlan, 
    getUsagePercentage, 
    isNearLimit 
  } = usePlanPermissions();

  const usageItems = [
    {
      label: "Canais",
      icon: MessageSquare,
      current: userPlan.usage.channels,
      limit: currentPlan.limits.channels,
      percentage: getUsagePercentage('channels'),
      isNear: isNearLimit('channels')
    },
    {
      label: "Contatos",
      icon: Users,
      current: userPlan.usage.contacts,
      limit: currentPlan.limits.contacts === -1 ? "Ilimitado" : currentPlan.limits.contacts,
      percentage: getUsagePercentage('contacts'),
      isNear: isNearLimit('contacts')
    },
    ...(currentPlan.limits.hasAiAgents ? [{
      label: "Agentes de IA",
      icon: Bot,
      current: userPlan.usage.aiAgents,
      limit: currentPlan.limits.aiAgents,
      percentage: getUsagePercentage('aiAgents'),
      isNear: isNearLimit('aiAgents')
    }] : [])
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Plano {currentPlan.name}
              {currentPlan.popular && (
                <Badge className="bg-primary text-primary-foreground">
                  Popular
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{currentPlan.description}</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Fazer Upgrade
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.isNear && (
                  <Badge variant="destructive" className="text-xs">
                    Próximo do limite
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground">
                {item.current} / {item.limit}
              </span>
            </div>
            {typeof item.limit === 'number' && (
              <Progress 
                value={item.percentage} 
                className={`h-2 ${item.isNear ? 'bg-destructive/20' : ''}`}
              />
            )}
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <strong>Funcionalidades incluídas:</strong>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {currentPlan.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {currentPlan.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{currentPlan.features.length - 3} mais
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};