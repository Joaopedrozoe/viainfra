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
      console.log('🔔 Aguardando perfil carregar...');
      return;
    }

    console.log('🔔 Carregando configurações para:', profile?.email);
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🔔 Configurações carregadas:', parsed);
        setSettings(parsed);
      } else {
        console.log('🔔 Nenhuma configuração salva, usando padrão:', DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('🔔 Erro ao carregar configurações:', error);
      setSettings(DEFAULT_SETTINGS);
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
      console.error('🔔 Erro: perfil não carregado, não é possível salvar');
      return;
    }

    const updated = { ...settings, ...newSettings };
    console.log('🔔 Salvando configurações para', profile?.email, ':', updated);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSettings(updated);
      console.log('🔔 Configurações salvas com sucesso!');
    } catch (error) {
      console.error('🔔 Erro ao salvar configurações:', error);
    }
  }, [settings, profile?.email]);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.log('🔔 Notificações não suportadas neste navegador');
      return 'denied';
    }

    console.log('🔔 Solicitando permissão para notificações...');
    
    try {
      const result = await Notification.requestPermission();
      console.log('🔔 Resultado da permissão:', result);
      setPermission(result);
      return result;
    } catch (error) {
      console.error('🔔 Erro ao solicitar permissão:', error);
      return 'denied';
    }
  }, []);

  // Tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (!settings.sound) {
      console.log('🔔 Som desativado nas configurações');
      return;
    }
    
    console.log('🔔 Tocando som de notificação');
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('🔔 Erro ao tocar som:', err));
    } catch (error) {
      console.log('🔔 Erro ao criar áudio:', error);
    }
  }, [settings.sound]);

  // Mostrar notificação desktop
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    console.log('🔔 Tentando mostrar notificação:', title);
    console.log('🔔 Desktop ativado:', settings.desktop);
    console.log('🔔 Permissão atual:', permission);

    if (!settings.desktop) {
      console.log('🔔 Notificações desktop desativadas');
      return;
    }

    // Verificar permissão atual
    const currentPermission = Notification.permission;
    console.log('🔔 Permissão do navegador:', currentPermission);

    if (currentPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/lovable-uploads/c71a4336-7d9d-4629-ab51-14961bb1424c.png',
          badge: '/lovable-uploads/c71a4336-7d9d-4629-ab51-14961bb1424c.png',
          requireInteraction: false,
          ...options,
        });

        console.log('🔔 Notificação criada com sucesso');

        // Tocar som junto com a notificação
        playNotificationSound();

        // Focar na janela quando clicar na notificação
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-fechar após 5 segundos
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('🔔 Erro ao criar notificação:', error);
      }
    } else if (currentPermission === 'default') {
      console.log('🔔 Permissão não concedida ainda');
    } else {
      console.log('🔔 Permissão negada');
    }
  }, [settings.desktop, permission, playNotificationSound]);

  // Notificação de nova conversa
  const notifyNewConversation = useCallback((contactName: string, channel: string) => {
    if (!settings.newConversations) {
      console.log('🔔 Notificações de novas conversas desativadas');
      return;
    }
    
    console.log('🔔 Enviando notificação de nova conversa:', contactName);
    showNotification('Nova Conversa', {
      body: `${contactName} iniciou uma conversa via ${channel}`,
      tag: 'new-conversation',
    });
  }, [settings.newConversations, showNotification]);

  // Notificação de nova mensagem
  const notifyNewMessage = useCallback((contactName: string, message: string) => {
    if (!settings.newMessages) {
      console.log('🔔 Notificações de novas mensagens desativadas');
      return;
    }
    
    console.log('🔔 Enviando notificação de nova mensagem:', contactName);
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
