import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Volume2, MessageSquare, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const NotificationsTab = () => {
  const { 
    settings, 
    updateSettings, 
    permission, 
    requestPermission 
  } = useNotifications();
  
  // Não solicitar permissão automaticamente - apenas quando usuário ativar
  const handleToggleDesktop = async (checked: boolean) => {
    if (checked) {
      // Sempre solicitar permissão quando ativar notificações desktop
      console.log('🔔 Solicitando permissão do navegador...');
      const result = await requestPermission();
      
      if (result !== 'granted') {
        toast.error("Você precisa permitir notificações no navegador para ativar esta funcionalidade");
        return;
      }
      
      console.log('🔔 Permissão concedida, ativando notificações desktop');
      toast.success("Notificações desktop ativadas com sucesso!");
    } else {
      toast.success("Notificações desktop desativadas");
    }
    
    updateSettings({ desktop: checked });
  };

  const handleToggleSound = (checked: boolean) => {
    updateSettings({ sound: checked });
    toast.success(checked ? "Som de notificação ativado" : "Som de notificação desativado");
  };

  const handleToggleNewConversations = (checked: boolean) => {
    updateSettings({ newConversations: checked });
    toast.success(checked ? "Notificações de novas conversas ativadas" : "Notificações de novas conversas desativadas");
  };

  const handleToggleNewMessages = (checked: boolean) => {
    updateSettings({ newMessages: checked });
    toast.success(checked ? "Notificações de novas mensagens ativadas" : "Notificações de novas mensagens desativadas");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações do Sistema</CardTitle>
        <CardDescription>
          Configure suas preferências de notificações para conversas e mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {permission === 'denied' && (
          <Alert variant="destructive">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              As notificações foram bloqueadas pelo navegador. Para reativar, acesse as configurações do navegador e permita notificações para este site.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Tipos de Notificação
          </h4>
          <div className="space-y-4 pl-6 border-l-2 border-border">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="notify-desktop" className="cursor-pointer">
                  Notificações Desktop
                </Label>
                <span className="text-xs text-muted-foreground">
                  Receba alertas no desktop do sistema
                </span>
              </div>
              <Switch 
                id="notify-desktop" 
                checked={settings.desktop} 
                onCheckedChange={handleToggleDesktop}
                disabled={permission === 'denied'}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="notify-sound" className="cursor-pointer flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Som de Notificação
                </Label>
                <span className="text-xs text-muted-foreground">
                  Reproduzir som ao receber notificações
                </span>
              </div>
              <Switch 
                id="notify-sound" 
                checked={settings.sound} 
                onCheckedChange={handleToggleSound}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Eventos para Notificar
          </h4>
          <div className="space-y-4 pl-6 border-l-2 border-border">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="notify-new-conversations" className="cursor-pointer flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Novas Conversas
                </Label>
                <span className="text-xs text-muted-foreground">
                  Notificar quando uma nova conversa for iniciada
                </span>
              </div>
              <Switch 
                id="notify-new-conversations" 
                checked={settings.newConversations} 
                onCheckedChange={handleToggleNewConversations}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="notify-new-messages" className="cursor-pointer flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Novas Mensagens
                </Label>
                <span className="text-xs text-muted-foreground">
                  Notificar quando receber novas mensagens
                </span>
              </div>
              <Switch 
                id="notify-new-messages" 
                checked={settings.newMessages} 
                onCheckedChange={handleToggleNewMessages}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pb-6 md:pb-4 text-sm text-muted-foreground">
        As configurações são salvas automaticamente e aplicadas imediatamente.
      </CardFooter>
    </Card>
  );
};
