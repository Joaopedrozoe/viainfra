import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import {
  initNotificationSound,
  playNotificationSound as playSharedSound,
  unlockNotificationSound,
} from '@/lib/notification-sound';

export interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  newConversations: boolean;
  newMessages: boolean;
}

const STORAGE_KEY_PREFIX = 'viainfra_notifications_';

// Configurações padrão: tudo ativado
const DEFAULT_SETTINGS: NotificationSettings = {
  desktop: true,
  sound: true,
  newConversations: true,
  newMessages: true,
};

export const useNotifications = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Engine de som compartilhada: unlock global de autoplay que sobrevive a
  // remounts (antes cada instância do hook tinha o seu, e o som se perdia).
  useEffect(() => {
    initNotificationSound();
  }, []);

  // Gerar chave única para o localStorage
  const getStorageKey = useCallback(() => {
    if (!profile?.email) return null;
    return `${STORAGE_KEY_PREFIX}${profile.email}`;
  }, [profile?.email]);

  // Carregar configurações do localStorage quando o perfil carregar
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } else {
        // Salvar configurações padrão se não existir
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, [getStorageKey]);

  // Apenas verifica o estado da permissão. O pedido é feito por gesto do
  // usuário (banner do inbox / configurações), pois navegadores ignoram
  // solicitações automáticas sem interação.
  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);

    const onFocus = () => setPermission(Notification.permission);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Salvar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;

    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
      }
      return updated;
    });
  }, [getStorageKey]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    // O clique que pede permissão também serve de gesto para liberar o áudio.
    unlockNotificationSound();

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      return 'denied';
    }
  }, []);

  // Tocar som de notificação (debounce e fallbacks na engine compartilhada)
  const playNotificationSound = useCallback((force = false) => {
    if (!settings.sound) return;
    playSharedSound(force);
  }, [settings.sound]);

  // Mostrar notificação desktop
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!settings.desktop) return;

    const currentPermission = Notification.permission;

    if (currentPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/lovable-uploads/c71a4336-7d9d-4629-ab51-14961bb1424c.png',
          badge: '/lovable-uploads/c71a4336-7d9d-4629-ab51-14961bb1424c.png',
          requireInteraction: false,
          silent: false, // deixa o SO tocar o som também (redundância proposital)
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        // Silently fail
      }
    }
  }, [settings.desktop]);

  // Alerta visível no app quando a notificação do navegador não está disponível
  // (permissão negada, ainda não concedida, ou app rodando dentro de iframe/preview).
  const canUseDesktopNotification = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;
    try {
      if (window.self !== window.top) return false;
    } catch {
      return false;
    }
    return true;
  };

  // Notificação de nova conversa
  const notifyNewConversation = useCallback((contactName: string, channel: string) => {
    if (!settings.newConversations) return;

    playNotificationSound();
    toast.info('Nova conversa', {
      description: `${contactName} iniciou uma conversa via ${channel}`,
      duration: 6000,
    });
    if (canUseDesktopNotification()) {
      showNotification('Nova Conversa', {
        body: `${contactName} iniciou uma conversa via ${channel}`,
        tag: 'new-conversation',
      });
    }
  }, [settings.newConversations, showNotification, playNotificationSound]);

  // Notificação de nova mensagem
  const notifyNewMessage = useCallback((contactName: string, message: string) => {
    if (!settings.newMessages) return;

    const body = `${contactName}: ${message?.substring(0, 100) || ''}${message && message.length > 100 ? '...' : ''}`;

    // Balãozinho dentro do app sempre aparece (garante feedback visual mesmo
    // quando o SO/navegador suprime a notificação nativa).
    toast.message('Nova mensagem', { description: body, duration: 6000 });

    // Redundância proposital: a engine tem debounce, então se o caller já
    // tocou o som isto é ignorado — mas nunca ficamos sem alerta sonoro.
    playSharedSound();

    if (canUseDesktopNotification()) {
      showNotification('Nova Mensagem', {
        body,
        tag: `new-message-${Date.now()}`, // Tag única para permitir múltiplas notificações
      });
    }
  }, [settings.newMessages, showNotification]);

  return {
    settings,
    updateSettings,
    permission,
    requestPermission,
    notifyNewConversation,
    notifyNewMessage,
    playNotificationSound,
    showNotification,
  };
};

