import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "bot" | "preview" | "resolved" | "internal">("all");
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

  // Combine preview and Supabase conversations
  useEffect(() => {
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
    
    // Map Supabase conversations
    const processedSupabaseConversations = supabaseConversations.map(conv => {
      const lastMessage = conv.messages && conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1] 
        : null;
      
      return {
        id: conv.id,
        name: conv.contact?.name || 'Cliente Web',
        channel: conv.channel as Channel,
        preview: lastMessage?.content || 'Nova conversa',
        time: new Date(conv.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        unread: conv.status === 'open' || conv.status === 'pending' ? 1 : 0,
        avatar: conv.contact?.avatar_url,
        is_preview: false
      } as Conversation & { is_preview: boolean };
    });
    
    // Combine both lists
    const combined = [...processedSupabaseConversations, ...processedPreviewConversations];
    logger.debug('Combined conversations:', combined.length);
    setAllConversations(combined);
  }, [previewConversations, supabaseConversations]);

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    onSelectConversation(conversationId);
    
    // Mark conversation as read
    setAllConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread: 0 } : conv
      )
    );
  };

  // Handle conversation resolve
  const handleConversationResolve = (conversationId: string) => {
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
  };

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
    } else if (activeTab === "bot") {
      // Show only bot conversations (channel = 'web')
      result = result.filter((conversation) => 
        conversation.channel === 'web' && !(conversation as any).is_preview && !resolvedConversations.has(conversation.id)
      );
    } else if (activeTab === "unread") {
      result = result.filter((conversation) => conversation.unread > 0 && !resolvedConversations.has(conversation.id));
    } else if (activeTab === "preview") {
      result = result.filter((conversation) => (conversation as any).is_preview === true && !resolvedConversations.has(conversation.id));
    } else if (activeTab === "resolved") {
      result = result.filter((conversation) => resolvedConversations.has(conversation.id));
    } else if (activeTab === "all") {
      result = result.filter((conversation) => !resolvedConversations.has(conversation.id));
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
        <Tabs defaultValue="all" className="px-3 pt-2">
          <TabsList className="w-full grid grid-cols-6 gap-1 h-auto p-1">
            <TabsTrigger value="all" className="text-[10px] px-1 py-1.5 h-auto">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="text-[10px] px-1 py-1.5 h-auto">Não lidas</TabsTrigger>
            <TabsTrigger value="bot" className="text-[10px] px-1 py-1.5 h-auto">Bot</TabsTrigger>
            <TabsTrigger value="internal" className="text-[10px] px-1 py-1.5 h-auto">Equipe</TabsTrigger>
            <TabsTrigger value="preview" className="text-[10px] px-1 py-1.5 h-auto">Preview</TabsTrigger>
            <TabsTrigger value="resolved" className="text-[10px] px-1 py-1.5 h-auto">Resolvidas</TabsTrigger>
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
      <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="px-3 pt-2">
        <TabsList className="w-full grid grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="all" className="text-[10px] px-1 py-1.5 h-auto">
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-[10px] px-1 py-1.5 h-auto">
            Não lidas {allConversations.filter(c => c.unread > 0 && !resolvedConversations.has(c.id)).length > 0 && `(${allConversations.filter(c => c.unread > 0 && !resolvedConversations.has(c.id)).length})`}
          </TabsTrigger>
          <TabsTrigger value="bot" className="text-[10px] px-1 py-1.5 h-auto">
            Bot {allConversations.filter(c => c.channel === 'web' && !resolvedConversations.has(c.id)).length > 0 && `(${allConversations.filter(c => c.channel === 'web' && !resolvedConversations.has(c.id)).length})`}
          </TabsTrigger>
          <TabsTrigger value="internal" className="text-[10px] px-1 py-1.5 h-auto flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" />
            Equipe {internalConversations.length > 0 && `(${internalConversations.length})`}
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-[10px] px-1 py-1.5 h-auto">
            Preview {allConversations.filter(c => (c as any).is_preview === true && !resolvedConversations.has(c.id)).length > 0 && `(${allConversations.filter(c => (c as any).is_preview === true && !resolvedConversations.has(c.id)).length})`}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-[10px] px-1 py-1.5 h-auto">
            Resolvidas {resolvedConversations.size > 0 && `(${resolvedConversations.size})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "internal" ? (
          internalConversations.length > 0 ? (
            internalConversations.map((conv) => {
              const otherParticipants = conv.profiles?.filter(p => p.email !== conv.profiles?.[0]?.email) || [];
              const title = conv.title || otherParticipants.map(p => p.name).join(', ') || 'Chat Interno';
              
              return (
                <ConversationItem
                  key={conv.id}
                  conversation={{
                    id: conv.id,
                    name: title,
                    channel: 'internal' as Channel,
                    preview: conv.last_message?.content || 'Nova conversa',
                    time: new Date(conv.last_message?.created_at || conv.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
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
