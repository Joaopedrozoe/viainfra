import { useState, useEffect, useCallback } from "react";
import { ConversationList } from "@/components/app/ConversationList";
import { ChatWindow } from "@/components/app/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { InternalChatWindow } from "@/components/app/InternalChatWindow";
import { useInternalChat } from "@/hooks/useInternalChat";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useConversations } from "@/hooks/useConversations";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

const Inbox = () => {
  const location = useLocation();
  const initialConversation = location.state?.selectedConversation;
  const shouldShowChat = location.state?.showChat;
  
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(initialConversation);
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(shouldShowChat !== undefined ? shouldShowChat : false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedInternalChat, setSelectedInternalChat] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { conversations: internalConversations } = useInternalChat();
  const { updateConversationStatus, refetch } = useConversations();
  const { company } = useAuth();
  
  // Ativar notificações de mensagens
  useMessageNotifications();
  
  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      if (!isSyncing) {
        console.log('🔄 Auto-refresh triggered (30s interval)');
        refetch();
      }
    }, 30000);
    
    return () => clearInterval(autoRefreshInterval);
  }, [refetch, isSyncing]);
  
  // Effect to update the state when navigation happens
  useEffect(() => {
    if (location.state?.selectedConversation !== undefined) {
      setSelectedConversation(location.state.selectedConversation);
    }
    
    if (location.state?.showChat !== undefined) {
      setShowChat(location.state.showChat);
    } else if (!isMobile && location.state?.selectedConversation) {
      // On desktop, always show chat when a conversation is selected
      setShowChat(true);
    }
  }, [location.state, isMobile]);
  
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversation(id);
    if (isMobile) {
      setShowChat(true);
    }
  }, [isMobile]);
  
  const handleBackToList = useCallback(() => {
    setShowChat(false);
  }, []);

  const handleResolveConversation = useCallback(async (conversationId: string) => {
    try {
      await updateConversationStatus(conversationId, 'resolved');
      toast.success("Conversa encerrada com sucesso");
      setRefreshKey(prev => prev + 1);
      await refetch();
    } catch (error) {
      console.error("Erro ao resolver conversa:", error);
      toast.error("Erro ao encerrar conversa");
    }
  }, [updateConversationStatus, refetch]);

  const handleEndConversation = useCallback(async (conversationId: string) => {
    await handleResolveConversation(conversationId);
    // Voltar para lista em mobile após encerrar
    if (isMobile) {
      setShowChat(false);
    }
  }, [handleResolveConversation, isMobile]);

  const handleRefresh = useCallback(async () => {
    if (isSyncing) return;
    
    console.log('Refresh button clicked, syncing conversations...');
    setIsSyncing(true);
    
    try {
      if (!company?.id) {
        toast.error('Empresa não identificada');
        setIsSyncing(false);
        return;
      }
      
      let totalNew = 0;
      let totalMessages = 0;
      let totalUpdated = 0;
      
      // 1. Chamar realtime-sync para sincronização completa
      try {
        console.log('🔄 Calling realtime-sync...');
        const { data: syncData, error: syncError } = await supabase.functions.invoke('realtime-sync');
        
        if (syncError) {
          console.error('Realtime sync error:', syncError);
        } else if (syncData?.stats) {
          totalNew = syncData.stats.conversationsCreated || 0;
          totalMessages = syncData.stats.messagesImported || 0;
          totalUpdated = syncData.stats.conversationsUpdated || 0;
          console.log('✅ Realtime sync complete:', syncData.stats);
        }
      } catch (err) {
        console.error('Error in realtime-sync:', err);
      }
      
      // 2. Sincronizar fotos de perfil
      let photosUpdated = 0;
      try {
        const { data: photoData } = await supabase.functions.invoke('sync-profile-pictures', {
          body: { forceUpdate: false }
        });
        if (photoData?.updated) {
          photosUpdated = photoData.updated;
        }
      } catch (err) {
        console.error('Photo sync error:', err);
      }
      
      // 3. Refetch para atualizar a UI
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetch();
      setRefreshKey(prev => prev + 1);
      
      // Mostrar resultado
      const parts = [];
      if (totalNew > 0) parts.push(`${totalNew} nova(s)`);
      if (totalMessages > 0) parts.push(`${totalMessages} msg`);
      if (totalUpdated > 0) parts.push(`${totalUpdated} atualizada(s)`);
      if (photosUpdated > 0) parts.push(`${photosUpdated} foto(s)`);
      
      if (parts.length > 0) {
        toast.success(parts.join(', '));
      } else {
        toast.success('Conversas sincronizadas');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
    }
  }, [refetch, isSyncing, company?.id]);

  const handleSelectInternalChat = useCallback((conversationId: string) => {
    setSelectedInternalChat(conversationId);
  }, []);

  const selectedInternalConversation = internalConversations.find(c => c.id === selectedInternalChat);

  if (isMobile) {
    return (
      <div className="h-full w-full overflow-hidden">
        {showChat ? (
          <ChatWindow 
            conversationId={selectedConversation || ""} 
            key={selectedConversation}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-none p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Conversas</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isSyncing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
            <ConversationList 
              onSelectConversation={handleSelectConversation}
              selectedId={selectedConversation}
              refreshTrigger={refreshKey}
              onResolveConversation={handleResolveConversation}
              onSelectInternalChat={handleSelectInternalChat}
            />
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-1 h-full overflow-hidden">
          <div className="w-80 min-w-[20rem] border-r border-border flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Conversas</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isSyncing}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList 
                onSelectConversation={handleSelectConversation}
                selectedId={selectedConversation}
                refreshTrigger={refreshKey}
                onResolveConversation={handleResolveConversation}
                onSelectInternalChat={handleSelectInternalChat}
              />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWindow 
              conversationId={selectedConversation || ""} 
              key={selectedConversation}
              onEndConversation={() => selectedConversation && handleEndConversation(selectedConversation)}
            />
          </div>
        </div>
      </div>

      <Sheet open={!!selectedInternalChat} onOpenChange={(open) => !open && setSelectedInternalChat(null)}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0">
          {selectedInternalConversation && (
            <InternalChatWindow 
              conversation={selectedInternalConversation} 
              onBack={() => setSelectedInternalChat(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Inbox;