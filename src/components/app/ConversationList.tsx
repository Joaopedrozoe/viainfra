import { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SearchHeader } from "./conversation/SearchHeader";
import { ConversationItem } from "./conversation/ConversationItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from "@/lib/logger";
import { Conversation, Channel } from "@/types/conversation";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreviewConversation } from "@/contexts/PreviewConversationContext";
import { ConversationStorage } from "@/lib/conversation-storage";
import { useConversations } from "@/hooks/useConversations";
import { useInternalChat } from "@/hooks/useInternalChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { Users, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedId?: string;
  refreshTrigger?: number;
  onResolveConversation?: (id: string) => void;
  onSelectInternalChat?: (conversationId: string) => void;
}

export const resolveConversation = (conversationId: string) => {
  ConversationStorage.addResolvedConversation(conversationId);
};

export const ConversationList = ({ onSelectConversation, selectedId, refreshTrigger, onResolveConversation, onSelectInternalChat }: ConversationListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  // useDeferredValue para não bloquear a UI durante digitação
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedChannel, setSelectedChannel] = useState<Channel | "all">("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string | "all">("all");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "bot" | "preview" | "resolved" | "internal" | "archived">("all");
  const [resolvedConversations, setResolvedConversations] = useState<Set<string>>(() => {
    return ConversationStorage.getResolvedConversations();
  });
  const { previewConversations } = usePreviewConversation();
  const { conversations: supabaseConversations, loading: supabaseLoading, refetch, forceSync, lastSyncTime, clearNewMessageFlag } = useConversations();
  const [isSyncing, setIsSyncing] = useState(false);
  const { conversations: internalConversations } = useInternalChat();
  
  // Ref for virtualization scroll container
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Get conversation IDs for typing indicator
  const conversationIds = useMemo(() => 
    supabaseConversations.map(c => c.id), 
    [supabaseConversations]
  );
  const { isTyping } = useTypingIndicator(conversationIds);

  // Sync resolved conversations from localStorage when component mounts or refreshes
  useEffect(() => {
    setResolvedConversations(ConversationStorage.getResolvedConversations());
  }, [refreshTrigger]);

  // Refetch Supabase conversations when refresh is triggered
  useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Combine preview and Supabase conversations - memoized to prevent unnecessary recalculations
  const combinedConversations = useMemo(() => {
    logger.debug('Updating conversations - Preview:', previewConversations.length, 'Supabase:', supabaseConversations.length);
    
    // Map preview conversations
    const processedPreviewConversations = previewConversations.map(conv => ({
      id: conv.id,
      name: conv.name,
      channel: conv.channel as Channel,
      preview: conv.preview,
      time: conv.time,
      unread: conv.unread || 1,
      is_preview: true
    } as Conversation & { is_preview: boolean }));
    
    // Helper to format time with date if not today
    const formatConversationTime = (dateStr: string) => {
      try {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return '';
        }
        
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) {
          return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return `${day}/${month} ${time}`;
        }
      } catch {
        return '';
      }
    };

    // Map Supabase conversations
    const processedSupabaseConversations = supabaseConversations.map(conv => {
      // Use lastMessage from hook instead of messages array
      const lastMessage = conv.lastMessage;
      // Use lastRealMessage for sorting (excludes reactions)
      const lastRealMessage = (conv as any).lastRealMessage || lastMessage;
      
      // Use last REAL message time for sorting (excludes reactions)
      const lastActivityTime = lastRealMessage?.created_at || lastMessage?.created_at || conv.updated_at;
      
      // Use contact name, phone, or email for display
      let displayName = 'Sem identificação';
      if (conv.contact) {
        const { name, phone, email } = conv.contact;
        // Reject invalid names that look like message IDs
        const isInvalidName = name && (
          /^(cmj|wamid|BAE|msg)[a-zA-Z0-9]+$/i.test(name) ||
          /^[a-fA-F0-9]{20,}$/.test(name)
        );
        
        // Se nome é válido e não é "Visitante", use o nome
        if (name && name !== 'Visitante' && !isInvalidName) {
          displayName = name;
        }
        // Senão, tente usar o telefone
        else if (phone && /^\d{10,15}$/.test(phone)) {
          displayName = phone;
        }
        // Por último, tente o email
        else if (email) {
          displayName = email;
        }
        // Se nome é inválido mas tem telefone, use telefone
        else if (isInvalidName && phone) {
          displayName = phone;
        }
      }
      
      // Find if this conversation has new message flag from hook
      const hasNewMsg = (conv as any).hasNewMessage || false;
      
      // Filter out conversations with invalid JIDs in metadata
      const remoteJid = (conv.metadata as any)?.remoteJid || '';
      const isInvalidJid = /^(cmj|wamid|BAE|msg)[a-zA-Z0-9]+$/i.test(remoteJid) ||
                           (remoteJid && !remoteJid.includes('@'));
      
      if (isInvalidJid) {
        return null; // Will be filtered out below
      }
      
      // NEVER show "Nova conversa" if there's no message - hide these instead
      const hasValidPreview = lastMessage?.content && lastMessage.content.length > 0;
      
      return {
        id: conv.id,
        name: displayName,
        channel: conv.channel as Channel,
        preview: hasValidPreview ? lastMessage.content : (conv.status === 'open' ? 'Aguardando mensagem...' : 'Sem mensagens'),
        time: formatConversationTime(lastActivityTime),
        unread: hasNewMsg ? 1 : 0,
        avatar: conv.contact?.avatar_url,
        is_preview: false,
        status: conv.status,
        archived: (conv as any).archived || false,
        lastActivityTimestamp: new Date(lastActivityTime).getTime(),
        hasNewMessage: hasNewMsg,
        // Conversas web sempre devem aparecer, mesmo sem mensagens carregadas ainda
        hasMessages: !!lastMessage || conv.channel === 'web'
      } as Conversation & { is_preview: boolean; status?: string; archived?: boolean; lastActivityTimestamp?: number; hasNewMessage?: boolean; hasMessages?: boolean };
    }).filter(Boolean); // Remove null entries (invalid JIDs)
    
    // Combine both lists
    const combined = [...processedSupabaseConversations, ...processedPreviewConversations];
    logger.debug('Combined conversations:', combined.length);
    return combined;
  }, [previewConversations, supabaseConversations]);

  // Handle conversation selection - memoized
  const handleConversationSelect = useCallback((conversationId: string) => {
    clearNewMessageFlag(conversationId); // Limpar flag de nova mensagem
    onSelectConversation(conversationId);
  }, [onSelectConversation, clearNewMessageFlag]);

  // Handle conversation resolve - memoized
  const handleConversationResolve = useCallback((conversationId: string) => {
    logger.debug('Resolvendo conversa:', conversationId);
    ConversationStorage.addResolvedConversation(conversationId);
    setResolvedConversations(ConversationStorage.getResolvedConversations());
    onResolveConversation?.(conversationId);
  }, [onResolveConversation]);

  // Apply filters and sorting - use deferredSearchTerm for smooth typing
  const filteredConversations = useMemo(() => {
    logger.debug('Filtering conversations...');
    
    let result = [...combinedConversations];

    // Apply search filter (using deferred value)
    if (deferredSearchTerm) {
      result = result.filter((conversation) =>
        conversation.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        conversation.preview.toLowerCase().includes(deferredSearchTerm.toLowerCase())
      );
    }

    // Apply channel filter
    if (selectedChannel !== "all") {
      result = result.filter((conversation) => conversation.channel === selectedChannel);
    }

    // Apply department filter
    if (selectedDepartment !== "all") {
      const departments = ["atendimento", "comercial", "manutencao", "financeiro", "rh"];
      result = result.filter((conversation) => {
        const assignedDept = departments[parseInt(conversation.id) % departments.length];
        return assignedDept === selectedDepartment;
      });
    }

    // Apply tab filter
    if (activeTab === "internal") {
      // Show internal chats
      result = [];
    } else if (activeTab === "archived") {
      // Show only archived conversations
      result = result.filter((conversation) => (conversation as any).archived === true);
    } else if (activeTab === "bot") {
      // Show only bot conversations (channel = 'web')
      result = result.filter((conversation) => 
        conversation.channel === 'web' && !(conversation as any).is_preview && (conversation as any).status !== 'resolved' && !(conversation as any).archived
      );
    } else if (activeTab === "unread") {
      result = result.filter((conversation) => conversation.unread > 0 && (conversation as any).status !== 'resolved' && !(conversation as any).archived);
    } else if (activeTab === "preview") {
      result = result.filter((conversation) => (conversation as any).is_preview === true && (conversation as any).status !== 'resolved');
    } else if (activeTab === "resolved") {
      result = result.filter((conversation) => (conversation as any).status === 'resolved' && !(conversation as any).archived);
    } else if (activeTab === "all") {
      // Filter out resolved, archived AND empty conversations without messages
      result = result.filter((conversation) => {
        const isResolved = (conversation as any).status === 'resolved';
        const isArchived = (conversation as any).archived;
        const hasMessages = (conversation as any).hasMessages !== false; // Default true for backward compat
        return !isResolved && !isArchived && hasMessages;
      });
    }

    logger.debug('Final filtered conversations:', result.length);
    
    // Sort by last activity timestamp (most recent first)
    result.sort((a, b) => {
      const timeA = (a as any).lastActivityTimestamp || 0;
      const timeB = (b as any).lastActivityTimestamp || 0;
      return timeB - timeA;
    });
    
    return result;
  }, [combinedConversations, deferredSearchTerm, selectedChannel, selectedDepartment, activeTab, resolvedConversations]);
  
  // Virtualizer for efficient list rendering
  const rowVirtualizer = useVirtualizer({
    count: activeTab === "internal" ? internalConversations.length : filteredConversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each conversation item
    overscan: 5, // Extra items to render above/below viewport
  });

  // Loading state - only show skeleton on very first load
  const isInitialLoad = supabaseLoading && combinedConversations.length === 0 && refreshTrigger === 0;
  
  if (isInitialLoad) {
    return (
      <div className="flex flex-col h-full">
        <SearchHeader 
          searchTerm="" 
          onSearchChange={() => {}} 
          selectedChannel="all" 
          onChannelChange={() => {}} 
          selectedDepartment="all"
          onDepartmentChange={() => {}}
        />
        <Tabs defaultValue="all" className="px-2 pt-2">
          <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="all" className="text-xs px-2 py-1 h-7">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs px-2 py-1 h-7">Não lidas</TabsTrigger>
            <TabsTrigger value="bot" className="text-xs px-2 py-1 h-7">Bot</TabsTrigger>
            <TabsTrigger value="internal" className="text-xs px-2 py-1 h-7">Equipe</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-2 py-1 h-7">Preview</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs px-2 py-1 h-7">Resolvidas</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-2 py-1 h-7">Arquivadas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 rounded-md">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle force sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    toast.info("Sincronizando com WhatsApp...");
    try {
      await forceSync();
      toast.success("Sincronização concluída!");
    } catch (err) {
      toast.error("Erro na sincronização");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SearchHeader 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        selectedChannel={selectedChannel} 
        onChannelChange={setSelectedChannel}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment} 
      />
      
      {/* Sync status bar */}
      <div className="px-3 py-1.5 flex items-center justify-between text-xs border-b bg-muted/30">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {lastSyncTime ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>Sincronizado: {lastSyncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          ) : (
            <span>Carregando...</span>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs"
          onClick={handleForceSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="px-2 pt-2">
        <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
          <TabsTrigger value="all" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Não lidas {combinedConversations.filter(c => c.unread > 0 && (c as any).status !== 'resolved' && !(c as any).archived).length > 0 && `(${combinedConversations.filter(c => c.unread > 0 && (c as any).status !== 'resolved' && !(c as any).archived).length})`}
          </TabsTrigger>
          <TabsTrigger value="bot" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Bot
          </TabsTrigger>
          <TabsTrigger value="internal" className="text-xs px-2 py-1 h-7 flex-shrink-0 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Preview
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Resolvidas
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Arquivadas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto"
      >
        {activeTab === "internal" ? (
          internalConversations.length > 0 ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const conv = internalConversations[virtualRow.index];
                const otherParticipants = conv.profiles?.filter(p => p.email !== conv.profiles?.[0]?.email) || [];
                const title = conv.title || otherParticipants.map(p => p.name).join(', ') || 'Chat Interno';
                
                // Helper to format time with date if not today
                const formatTime = (dateStr: string) => {
                  const date = new Date(dateStr);
                  const today = new Date();
                  const isToday = date.toDateString() === today.toDateString();
                  if (isToday) {
                    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  } else {
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return `${day}/${month} ${time}`;
                  }
                };

                return (
                  <div
                    key={conv.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ConversationItem
                      conversation={{
                        id: conv.id,
                        name: title,
                        channel: 'internal' as Channel,
                        preview: conv.last_message?.content || 'Nova conversa',
                        time: formatTime(conv.last_message?.created_at || conv.created_at),
                        unread: conv.unread_count || 0,
                      }}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelectInternalChat?.(conv.id)}
                      showResolveButton={false}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Clique em um colega da Equipe no Dashboard para iniciar uma conversa interna
            </div>
          )
        ) : filteredConversations.length > 0 ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const conversation = filteredConversations[virtualRow.index];
              return (
                <div
                  key={conversation.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ConversationItem
                    conversation={conversation}
                    isSelected={selectedId === conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                    onResolve={() => handleConversationResolve(conversation.id)}
                    showResolveButton={activeTab !== "resolved"}
                    isTyping={isTyping(conversation.id)}
                    hasNewMessage={(conversation as any).hasNewMessage}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm || selectedChannel !== "all" || selectedDepartment !== "all" ? "Nenhuma conversa encontrada" : 
             activeTab === "preview" ? "Teste o preview do bot para ver as conversas aqui" :
             "Nenhuma conversa disponível"}
          </div>
        )}
      </div>
    </div>
  );
};
