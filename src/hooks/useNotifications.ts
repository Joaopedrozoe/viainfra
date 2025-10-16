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
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isInitialized, setIsInitialized] = useState(false);

  // Gerar chave única para o localStorage usando email do perfil
  const getStorageKey = useCallback(() => {
    if (profile?.email) {
      return `notifications_${profile.email}`;
    }
    return null;
  }, [profile?.email]);

  // Carregar configurações do localStorage
  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey && !isInitialized) {
      console.log('🔔 Carregando configurações de notificação para:', profile?.email);
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('🔔 Configurações carregadas:', parsed);
          setSettings(parsed);
        } catch (error) {
          console.error('Erro ao carregar configurações:', error);
        }
      } else {
        console.log('🔔 Nenhuma configuração salva encontrada, usando padrões');
      }
      setIsInitialized(true);
    }
  }, [getStorageKey, isInitialized, profile?.email]);

  // Verificar permissão do browser
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      console.log('🔔 Permissão atual do navegador:', currentPermission);
      setPermission(currentPermission);
    }
  }, []);

  // Salvar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      console.error('🔔 Não foi possível salvar: chave de armazenamento não disponível');
      return;
    }

    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      console.log('🔔 Salvando configurações para', profile?.email, ':', updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [getStorageKey, profile?.email]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('🔔 Notificações não suportadas neste navegador');
      return 'denied';
    }

    console.log('🔔 Solicitando permissão para notificações...');
    const result = await Notification.requestPermission();
    console.log('🔔 Resultado da permissão:', result);
    setPermission(result);
    return result;
  }, []);

  // Tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (!settings.sound) {
      console.log('🔔 Som desativado nas configurações');
      return;
    }
    
    console.log('🔔 Tocando som de notificação');
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('🔔 Erro ao tocar som:', err));
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
