import { useState, useEffect, useCallback } from "react";
import { ConversationList } from "@/components/app/ConversationList";
import { ChatWindow } from "@/components/app/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, RefreshCw } from "lucide-react";

const Inbox = () => {
  const location = useLocation();
  const initialConversation = location.state?.selectedConversation;
  const shouldShowChat = location.state?.showChat;
  
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(initialConversation);
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(shouldShowChat !== undefined ? shouldShowChat : false);
  const [refreshKey, setRefreshKey] = useState(0);
  
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

  const handleResolveConversation = useCallback((conversationId: string) => {
    console.log("✅ Conversa resolvida:", conversationId);
  }, []);

  const handleEndConversation = useCallback((conversationId: string) => {
    console.log("Encerrando conversa:", conversationId);
    // Resolver a conversa quando encerrar
    handleResolveConversation(conversationId);
  }, [handleResolveConversation]);

  const handleRefresh = useCallback(() => {
    console.log('Refresh button clicked, updating conversations...');
    setRefreshKey(prev => prev + 1);
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full bg-background overflow-hidden">
        {showChat ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <ChatWindow 
                conversationId={selectedConversation || ""} 
                key={selectedConversation}
                onBack={handleBackToList}
              />
            </div>
          </div>
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
          <div className="w-80 min-w-[20rem] border-r border-border">
            <div className="p-4 border-b border-border">
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
            <ConversationList 
              onSelectConversation={handleSelectConversation}
              selectedId={selectedConversation}
              refreshTrigger={refreshKey}
              onResolveConversation={handleResolveConversation}
            />
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
    </>
  );
};

export default Inbox;