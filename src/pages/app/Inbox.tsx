import { useState, useEffect, useCallback } from "react";
import { ConversationList } from "@/components/app/ConversationList";
import { ChatWindow } from "@/components/app/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, RefreshCw } from "lucide-react";
import { InternalChatWindow } from "@/components/app/InternalChatWindow";
import { useInternalChat } from "@/hooks/useInternalChat";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useConversations } from "@/hooks/useConversations";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { toast } from "sonner";

const Inbox = () => {
  const location = useLocation();
  const initialConversation = location.state?.selectedConversation;
  const shouldShowChat = location.state?.showChat;
  
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(initialConversation);
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(shouldShowChat !== undefined ? shouldShowChat : false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedInternalChat, setSelectedInternalChat] = useState<string | null>(null);
  const { conversations: internalConversations } = useInternalChat();
  const { updateConversationStatus, refetch } = useConversations();
  
  // Ativar notificações de mensagens
  useMessageNotifications();
  
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

  const handleRefresh = useCallback(() => {
    console.log('Refresh button clicked, updating conversations...');
    setRefreshKey(prev => prev + 1);
  }, []);

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
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
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
      <div className="flex h-full">
        <div className="flex flex-1 transition-all duration-300">
          <div className="w-80 min-w-[20rem] border-r border-border flex flex-col h-full">
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Conversas</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
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
          <div className="flex-1">
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