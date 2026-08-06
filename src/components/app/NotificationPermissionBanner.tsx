import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

const DISMISS_KEY = "viainfra_notification_prompt_dismissed";

/**
 * Banner de permissão de notificações.
 * Navegadores só concedem permissão a partir de um gesto do usuário,
 * por isso o pedido acontece no clique deste botão.
 */
export const NotificationPermissionBanner = () => {
  const { permission, requestPermission, updateSettings, playNotificationSound } = useNotifications();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (permission === "granted" || dismissed) return null;

  const handleEnable = async () => {
    if (permission === "denied") {
      toast.error("Notificações bloqueadas pelo navegador", {
        description:
          "Abra o ícone de cadeado na barra de endereço e permita notificações para este site.",
      });
      return;
    }

    const result = await requestPermission();
    if (result === "granted") {
      updateSettings({ desktop: true, sound: true, newMessages: true, newConversations: true });
      playNotificationSound();
      toast.success("Notificações ativadas", {
        description: "Você será avisado de novas mensagens mesmo em outra aba.",
      });
    } else {
      toast.error("Permissão não concedida", {
        description: "Sem a permissão do navegador não é possível exibir alertas na área de trabalho.",
      });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-border/60 bg-primary/10 px-4 py-2">
      <Bell className="h-4 w-4 text-primary flex-shrink-0" />
      <p className="flex-1 text-xs text-foreground">
        Ative as notificações para ser avisado de novas mensagens do WhatsApp mesmo com o app em outra aba.
      </p>
      <Button size="sm" onClick={handleEnable} className="flex-shrink-0">
        Ativar
      </Button>
      <Button size="icon" variant="ghost" onClick={handleDismiss} className="h-7 w-7 flex-shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
