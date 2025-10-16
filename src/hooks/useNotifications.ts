import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';

export interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  newConversations: boolean;
  newMessages: boolean;
}

const STORAGE_KEY_PREFIX = 'viainfra_notifications_';

const DEFAULT_SETTINGS: NotificationSettings = {
  desktop: false,
  sound: false,
  newConversations: false,
  newMessages: false,
};

export const useNotifications = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Gerar chave única para o localStorage
  const getStorageKey = () => {
    if (!profile?.email) return null;
    return `${STORAGE_KEY_PREFIX}${profile.email}`;
  };

  // Carregar configurações do localStorage quando o perfil carregar
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, [profile?.email]);

  // Verificar permissão do browser
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      console.log('🔔 Permissão atual do navegador:', currentPermission);
      setPermission(currentPermission);
    } else {
      console.log('🔔 Notificações não suportadas neste navegador');
    }
  }, []);

  // Salvar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      return;
    }

    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar configurações:', error);
      }
      return updated;
    });
  }, [profile?.email]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      return 'denied';
    }
  }, []);

  // Tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (!settings.sound) return;
    
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Silently fail
    }
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
          ...options,
        });

        playNotificationSound();

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        // Silently fail
      }
    }
  }, [settings.desktop, permission, playNotificationSound]);

  // Notificação de nova conversa
  const notifyNewConversation = useCallback((contactName: string, channel: string) => {
    if (!settings.newConversations) return;
    
    showNotification('Nova Conversa', {
      body: `${contactName} iniciou uma conversa via ${channel}`,
      tag: 'new-conversation',
    });
  }, [settings.newConversations, showNotification]);

  // Notificação de nova mensagem
  const notifyNewMessage = useCallback((contactName: string, message: string) => {
    if (!settings.newMessages) return;
    
    showNotification('Nova Mensagem', {
      body: `${contactName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      tag: 'new-message',
    });
  }, [settings.newMessages, showNotification]);

  return {
    settings,
    updateSettings,
    permission,
    requestPermission,
    notifyNewConversation,
    notifyNewMessage,
    playNotificationSound,
  };
};
