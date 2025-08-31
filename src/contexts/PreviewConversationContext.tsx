import React, { createContext, useContext, useState, useCallback } from 'react';
import { Conversation } from '@/types/conversation';

type Message = {
  content: string;
  isBot: boolean;
  timestamp: string;
};

type PreviewConversation = Conversation & {
  messages: Message[];
  is_preview?: boolean;
};

type PreviewConversationContextType = {
  previewConversations: PreviewConversation[];
  createPreviewConversation: (botName: string) => string;
  updatePreviewConversation: (id: string, messages: Message[]) => void;
  getPreviewConversation: (id: string) => PreviewConversation | undefined;
};

const PreviewConversationContext = createContext<PreviewConversationContextType | undefined>(undefined);

export const PreviewConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [previewConversations, setPreviewConversations] = useState<PreviewConversation[]>([]);

  const createPreviewConversation = useCallback((botName: string): string => {
    const id = `preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newConversation: PreviewConversation = {
      id,
      name: `Preview Bot - ${botName}`,
      channel: 'whatsapp',
      preview: 'Conversa de preview iniciada...',
      time: new Date().toISOString(),
      unread: 1,
      is_preview: true,
      messages: []
    };

    console.log('🎬 CONTEXT: Criando nova conversa de preview:', newConversation);
    setPreviewConversations(prev => {
      const updated = [newConversation, ...prev];
      console.log('🎬 CONTEXT: Preview conversations atualizadas. Total:', updated.length);
      console.log('🎬 CONTEXT: Lista completa:', updated);
      return updated;
    });
    return id;
  }, []);

  const updatePreviewConversation = useCallback((id: string, messages: Message[]) => {
    console.log('Atualizando conversa de preview:', id, 'com', messages.length, 'mensagens');
    setPreviewConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === id) {
          const lastMessage = messages[messages.length - 1];
          const preview = lastMessage 
            ? (lastMessage.content.length > 50 
                ? lastMessage.content.substring(0, 50) + '...'
                : lastMessage.content)
            : 'Conversa de preview';

          const updatedConv = {
            ...conv,
            messages,
            preview,
            time: new Date().toISOString(),
            unread: 1
          };
          console.log('Conversa atualizada:', updatedConv);
          return updatedConv;
        }
        return conv;
      });
      console.log('Lista atualizada de conversas de preview:', updated.length);
      return updated;
    });
  }, []);

  const getPreviewConversation = useCallback((id: string) => {
    return previewConversations.find(conv => conv.id === id);
  }, [previewConversations]);

  return (
    <PreviewConversationContext.Provider 
      value={{ 
        previewConversations, 
        createPreviewConversation, 
        updatePreviewConversation, 
        getPreviewConversation 
      }}
    >
      {children}
    </PreviewConversationContext.Provider>
  );
};

export const usePreviewConversation = () => {
  const context = useContext(PreviewConversationContext);
  if (context === undefined) {
    throw new Error('usePreviewConversation must be used within a PreviewConversationProvider');
  }
  return context;
};