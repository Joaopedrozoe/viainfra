import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  // Pre-carregar áudio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.6;
    audioRef.current.preload = 'auto';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
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

  // Verificar e solicitar permissão do browser automaticamente
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      
      // Solicitar permissão automaticamente se ainda não foi perguntado
      if (currentPermission === 'default') {
        Notification.requestPermission().then(result => {
          setPermission(result);
        });
      }
    }
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
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      return 'denied';
    }
  }, []);

  // Tocar som de notificação com debounce
  const playNotificationSound = useCallback(() => {
    if (!settings.sound) return;
    
    // Debounce: não tocar se tocou há menos de 1 segundo
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 1000) return;
    lastSoundTimeRef.current = now;
    
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Fallback: criar novo elemento de áudio
          const fallbackAudio = new Audio('/notification.mp3');
          fallbackAudio.volume = 0.6;
          fallbackAudio.play().catch(() => {});
        });
      }
    } catch (error) {
      console.warn('Erro ao tocar som:', error);
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
          silent: true, // Som é controlado separadamente
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

  // Notificação de nova conversa
  const notifyNewConversation = useCallback((contactName: string, channel: string) => {
    if (!settings.newConversations) return;
    
    playNotificationSound();
    showNotification('Nova Conversa', {
      body: `${contactName} iniciou uma conversa via ${channel}`,
      tag: 'new-conversation',
    });
  }, [settings.newConversations, showNotification, playNotificationSound]);

  // Notificação de nova mensagem
  const notifyNewMessage = useCallback((contactName: string, message: string) => {
    if (!settings.newMessages) return;
    
    // Som é tocado separadamente pelo caller (useConversations) para timing mais preciso
    showNotification('Nova Mensagem', {
      body: `${contactName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      tag: `new-message-${Date.now()}`, // Tag única para permitir múltiplas notificações
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
