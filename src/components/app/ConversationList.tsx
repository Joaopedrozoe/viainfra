import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Users } from "lucide-react";

let conversationUpdateCounter = 0;

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
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | "all">("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string | "all">("all");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "bot" | "preview" | "resolved" | "internal" | "archived">("all");
  const [resolvedConversations, setResolvedConversations] = useState<Set<string>>(() => {
    return ConversationStorage.getResolvedConversations();
  });
  const { previewConversations } = usePreviewConversation();
  const { conversations: supabaseConversations, loading: supabaseLoading, refetch } = useConversations();
  const { conversations: internalConversations } = useInternalChat();

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

    // Map Supabase conversations
    const processedSupabaseConversations = supabaseConversations.map(conv => {
      const lastMessage = conv.messages && conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1] 
        : null;
      
      // Use contact name, phone, or email for display
      let displayName = 'Sem identificação';
      if (conv.contact) {
        const { name, phone, email } = conv.contact;
        // Se nome não é "Visitante", use o nome
        if (name && name !== 'Visitante') {
          displayName = name;
        }
        // Senão, tente usar o telefone
        else if (phone) {
          displayName = phone;
        }
        // Por último, tente o email
        else if (email) {
          displayName = email;
        }
        // Se ainda for "Visitante" mas tem telefone, mostre o telefone
        else if (name === 'Visitante' && phone) {
          displayName = phone;
        }
      }
      
      return {
        id: conv.id,
        name: displayName,
        channel: conv.channel as Channel,
        preview: lastMessage?.content || 'Nova conversa',
        time: formatConversationTime(conv.updated_at),
        unread: conv.status === 'open' || conv.status === 'pending' ? 1 : 0,
        avatar: conv.contact?.avatar_url,
        is_preview: false,
        status: conv.status,
        archived: (conv as any).archived || false
      } as Conversation & { is_preview: boolean; status?: string; archived?: boolean };
    });
    
    // Combine both lists
    const combined = [...processedSupabaseConversations, ...processedPreviewConversations];
    logger.debug('Combined conversations:', combined.length);
    return combined;
  }, [previewConversations, supabaseConversations]);

  // Update state only when combined conversations change
  useEffect(() => {
    setAllConversations(combinedConversations);
  }, [combinedConversations]);

  // Handle conversation selection - memoized
  const handleConversationSelect = useCallback((conversationId: string) => {
    onSelectConversation(conversationId);
    
    // Mark conversation as read
    setAllConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread: 0 } : conv
      )
    );
  }, [onSelectConversation]);

  // Handle conversation resolve - memoized
  const handleConversationResolve = useCallback((conversationId: string) => {
    logger.debug('Resolvendo conversa:', conversationId);
    ConversationStorage.addResolvedConversation(conversationId);
    setResolvedConversations(ConversationStorage.getResolvedConversations());
    
    // Mark as read when resolved
    setAllConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread: 0 } : conv
      )
    );
    
    onResolveConversation?.(conversationId);
  }, [onResolveConversation]);

  // Apply filters
  useEffect(() => {
    logger.debug('Filtering conversations...');
    
    let result = [...allConversations];

    // Apply search filter
    if (searchTerm) {
      result = result.filter((conversation) =>
        conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.preview.toLowerCase().includes(searchTerm.toLowerCase())
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
      result = result.filter((conversation) => (conversation as any).status !== 'resolved' && !(conversation as any).archived);
    }

    logger.debug('Final filtered conversations:', result.length);
    setFilteredConversations(result);
  }, [allConversations, searchTerm, selectedChannel, selectedDepartment, activeTab, resolvedConversations]);

  // Loading state - only show skeleton on very first load (no conversations and first time loading)
  const isInitialLoad = supabaseLoading && allConversations.length === 0 && refreshTrigger === 0;
  
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
      <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="px-2 pt-2">
        <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
          <TabsTrigger value="all" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs px-2 py-1 h-7 flex-shrink-0">
            Não lidas {allConversations.filter(c => c.unread > 0 && (c as any).status !== 'resolved' && !(c as any).archived).length > 0 && `(${allConversations.filter(c => c.unread > 0 && (c as any).status !== 'resolved' && !(c as any).archived).length})`}
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

      <div className="flex-1 overflow-y-auto">
        {activeTab === "internal" ? (
          internalConversations.length > 0 ? (
            internalConversations.map((conv) => {
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
                <ConversationItem
                  key={conv.id}
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
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              Clique em um colega da Equipe no Dashboard para iniciar uma conversa interna
            </div>
          )
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={() => handleConversationSelect(conversation.id)}
              onResolve={() => handleConversationResolve(conversation.id)}
              showResolveButton={activeTab !== "resolved"}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm || selectedChannel !== "all" || selectedDepartment !== "all" ? "Nenhuma conversa encontrada" : 
             activeTab === "preview" ? "Teste o preview do bot para ver as conversas aqui" :
             "Nenhuma conversa disponível"}
          </div>
        )}
      </div>
    </div>
  );
};
