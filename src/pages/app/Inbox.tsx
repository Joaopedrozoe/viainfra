import { useState, useEffect, useCallback } from "react";
import { ConversationList } from "@/components/app/ConversationList";
import { ChatWindow } from "@/components/app/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare } from "lucide-react";
import { InternalChatWindow } from "@/components/app/InternalChatWindow";
import { useInternalChat } from "@/hooks/useInternalChat";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useConversations } from "@/hooks/useConversations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { StatusTab, StatusIcon } from "@/components/app/status";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Inbox = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialConversation = location.state?.selectedConversation;
  const shouldShowChat = location.state?.showChat;
  const conversationFromUrl = searchParams.get('conversation');
  
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>(
    conversationFromUrl || initialConversation
  );
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(
    shouldShowChat !== undefined ? shouldShowChat : !!conversationFromUrl
  );
  // refreshKey removed — useConversations realtime + refetch handle updates
  const [selectedInternalChat, setSelectedInternalChat] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"conversations" | "status">("conversations");
  const { conversations: internalConversations } = useInternalChat();
  const { updateConversationStatus, refetch } = useConversations();
  const { company } = useAuth();
  
  // Notificações de novas mensagens já são disparadas dentro de useConversations,
  // evitando subscription + query duplicadas por mensagem recebida.
  
  // REMOVED: Auto-refresh redundante - useConversations já tem realtime + polling
  // O realtime do Supabase é a fonte primária de updates agora

  // Auto-sync de avatares a cada hora (verificar contatos sem foto ou desatualizados)
  useEffect(() => {
    const syncAvatars = async () => {
      try {
        console.log('📷 Auto-sync avatares iniciado...');
        await supabase.functions.invoke('auto-sync-avatars', {
          body: { mode: 'missing', limit: 20 }
        });
      } catch (err) {
        console.error('Avatar sync error:', err);
      }
    };

    // Sync inicial após 10 segundos
    const initialTimeout = setTimeout(syncAvatars, 10000);
    
    // Sync periódico a cada hora
    const avatarSyncInterval = setInterval(syncAvatars, 60 * 60 * 1000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(avatarSyncInterval);
    };
  }, []);
  
  // Effect para tratar conversa vinda da URL (ex: /inbox?conversation=xxx)
  useEffect(() => {
    if (conversationFromUrl) {
      setSelectedConversation(conversationFromUrl);
      setShowChat(true);
    }
  }, [conversationFromUrl]);
  
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
      
      // 1. Sincronização principal - aguarda
      let totalNew = 0;
      let totalMessages = 0;
      let totalUpdated = 0;
      
      try {
        const { data: syncData, error: syncError } = await supabase.functions.invoke('realtime-sync');
        if (syncError) {
          console.error('Realtime sync error:', syncError);
        } else if (syncData?.stats) {
          totalNew = syncData.stats.conversationsCreated || 0;
          totalMessages = syncData.stats.messagesImported || 0;
          totalUpdated = syncData.stats.conversationsUpdated || 0;
        }
      } catch (err) {
        console.error('Error in realtime-sync:', err);
      }
      
      // 2. Refetch e atualizar UI imediatamente (sem aguardar avatares/nomes)
      await refetch();
      
      // 3. Background: avatares + enriquecimento de nomes (não bloqueia o toast)
      Promise.all([
        supabase.functions.invoke('sync-profile-pictures', { body: { forceUpdate: false } }),
        supabase.functions.invoke('auto-sync-avatars', { body: { mode: 'missing', limit: 30 } }),
        supabase.functions.invoke('enrich-contact-names', { body: { limit: 50 } }),
      ]).then(() => {
        console.log('🔄 Background sync (avatars + names) completo');
        refetch();
      }).catch(err => console.error('Background sync error:', err));
      
      const parts: string[] = [];
      if (totalNew > 0) parts.push(`${totalNew} nova(s)`);
      if (totalMessages > 0) parts.push(`${totalMessages} msg`);
      if (totalUpdated > 0) parts.push(`${totalUpdated} atualizada(s)`);
      
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

  // Ocultar barra inferior fixa quando estiver dentro de um chat no mobile (WhatsApp-like)
  useEffect(() => {
    if (!isMobile) return;
    const hide = showChat && activeMainTab === "conversations";
    document.body.dataset.hideMobileNav = hide ? "true" : "false";
    return () => { document.body.dataset.hideMobileNav = "false"; };
  }, [isMobile, showChat, activeMainTab]);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className={cn("h-full w-full overflow-hidden", !(showChat && activeMainTab === "conversations") && "pb-mobile-nav")}>

        {showChat && activeMainTab === "conversations" ? (
          <ChatWindow 
            conversationId={selectedConversation || ""} 
            key={selectedConversation}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex-none border-b border-border">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeMainTab === "conversations" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMainTab("conversations")}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Conversas
                  </Button>
                  <Button
                    variant={activeMainTab === "status" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveMainTab("status")}
                    className="gap-2"
                  >
                    <StatusIcon size={16} />
                    Status
                  </Button>
                </div>
                {activeMainTab === "conversations" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeMainTab === "conversations" ? (
                <ConversationList 
                  onSelectConversation={handleSelectConversation}
                  selectedId={selectedConversation}
                  refreshTrigger={0}
                  onResolveConversation={handleResolveConversation}
                  onSelectInternalChat={handleSelectInternalChat}
                />
              ) : (
                <StatusTab />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Desktop Layout
  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Left Sidebar - Navigation Icons */}
        <div className="w-14 min-w-[3.5rem] border-r border-border flex flex-col items-center py-4 bg-muted/30">
          <button
            onClick={() => setActiveMainTab("conversations")}
            className={`p-3 rounded-lg transition-colors ${
              activeMainTab === "conversations" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Conversas"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveMainTab("status")}
            className={`p-3 rounded-lg transition-colors mt-2 ${
              activeMainTab === "status" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title="Status"
          >
            <StatusIcon size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 h-full overflow-hidden">
          {activeMainTab === "conversations" ? (
            <>
              {/* Conversations List */}
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
                    refreshTrigger={0}
                    onResolveConversation={handleResolveConversation}
                    onSelectInternalChat={handleSelectInternalChat}
                  />
                </div>
              </div>
              
              {/* Chat Window */}
              <div className="flex-1 overflow-hidden">
                <ChatWindow 
                  conversationId={selectedConversation || ""} 
                  key={selectedConversation}
                  onEndConversation={() => selectedConversation && handleEndConversation(selectedConversation)}
                />
              </div>
            </>
          ) : (
            <StatusTab />
          )}
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