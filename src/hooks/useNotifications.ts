import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  newConversations: boolean;
  newMessages: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  desktop: true,
  sound: true,
  newConversations: true,
  newMessages: true,
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Carregar configurações do localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`notifications_${user.id}`);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }
  }, [user]);

  // Verificar permissão do browser
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Salvar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (user) {
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [user]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return Notification.permission;
  }, []);

  // Tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (!settings.sound) return;
    
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Erro ao tocar som:', err));
  }, [settings.sound]);

  // Mostrar notificação desktop
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!settings.desktop) return;

    // Solicitar permissão se necessário
    if (permission === 'default') {
      const result = await requestPermission();
      if (result !== 'granted') return;
    }

    if (permission === 'granted' || Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/lovable-uploads/c71a4336-7d9d-4629-ab51-14961bb1424c.png',
        badge: '/lovable-uploads/c71a4336-7d9d-4629-ab51-14961bb1424c.png',
        ...options,
      });

      // Tocar som junto com a notificação
      playNotificationSound();

      // Focar na janela quando clicar na notificação
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-fechar após 5 segundos
      setTimeout(() => notification.close(), 5000);
    }
  }, [settings.desktop, permission, requestPermission, playNotificationSound]);

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
