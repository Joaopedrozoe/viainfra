import { useState, useEffect } from "react";
import { SearchHeader } from "./conversation/SearchHeader";
import { ConversationItem } from "./conversation/ConversationItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import { Conversation, Channel } from "@/types/conversation";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreviewConversation } from "@/contexts/PreviewConversationContext";
import { ConversationStorage } from "@/lib/conversation-storage";

// Forçar re-render quando há mudanças nas conversas de preview
let conversationUpdateCounter = 0;

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedId?: string;
  refreshTrigger?: number;
  onResolveConversation?: (id: string) => void;
}

// Função para expor o resolve conversation para componentes externos
export const resolveConversation = (conversationId: string) => {
  ConversationStorage.addResolvedConversation(conversationId);
};

export const ConversationList = ({ onSelectConversation, selectedId, refreshTrigger, onResolveConversation }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | "all">("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string | "all">("all");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "preview" | "resolved">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedConversations, setResolvedConversations] = useState<Set<string>>(() => {
    return ConversationStorage.getResolvedConversations();
  });
  const { previewConversations } = usePreviewConversation();

  // Sync resolved conversations from localStorage when component mounts or refreshes
  useEffect(() => {
    setResolvedConversations(ConversationStorage.getResolvedConversations());
  }, [refreshTrigger]);

  // SOLUÇÃO DIRETA: Sempre mostrar conversas de preview
  useEffect(() => {
    logger.debug('ConversationList: Updating with preview conversations:', previewConversations.length);
    
    // Mapear conversas de preview para o formato correto SEMPRE
    const processedConversations = previewConversations.map(conv => {
      logger.debug('Processing conversation:', conv.id, conv.name);
      return {
        id: conv.id,
        name: conv.name,
        channel: conv.channel as Channel,
        preview: conv.preview,
        time: conv.time,
        unread: conv.unread || 1,
        is_preview: true
      } as Conversation & { is_preview: boolean };
    });
    
    logger.debug('Setting conversations:', processedConversations.length);
    setConversations(processedConversations);
    setIsLoading(false);
  }, [previewConversations]);

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    onSelectConversation(conversationId);
    
    // Mark conversation as read (for preview conversations, update locally)
    setConversations(prev => 
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
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread: 0 } : conv
      )
    );
    
    // Call parent callback if provided
    onResolveConversation?.(conversationId);
  };

  // Apply filters when conversations, search term, channel or active tab changes
  useEffect(() => {
    logger.debug('Filtering conversations...');
    
    let result = [...conversations];

    // Apply search filter if search term exists
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

    // Apply department filter if needed
    if (selectedDepartment !== "all") {
      // For now, we'll filter based on a random assignment since conversations don't have departments yet
      // In a real implementation, conversations would have department assignment
      result = result.filter((conversation) => {
        // Simulate department assignment based on conversation ID
        const departments = ["atendimento", "comercial", "manutencao", "financeiro", "rh"];
        const assignedDept = departments[parseInt(conversation.id) % departments.length];
        return assignedDept === selectedDepartment;
      });
    }

    // Apply tab filter
    if (activeTab === "unread") {
      result = result.filter((conversation) => conversation.unread > 0 && !resolvedConversations.has(conversation.id));
    } else if (activeTab === "preview") {
      result = result.filter((conversation) => (conversation as any).is_preview === true && !resolvedConversations.has(conversation.id));
    } else if (activeTab === "resolved") {
      result = result.filter((conversation) => resolvedConversations.has(conversation.id));
    } else if (activeTab === "all") {
      // Show all non-resolved conversations
      result = result.filter((conversation) => !resolvedConversations.has(conversation.id));
    }

    logger.debug('Final filtered conversations:', result.length);
    setFilteredConversations(result);
  }, [conversations, searchTerm, selectedChannel, selectedDepartment, activeTab, resolvedConversations]);

  // Loading state
  if (isLoading) {
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
        <Tabs defaultValue="all" className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">Não lidas</TabsTrigger>
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
      <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="px-4 pt-2">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Não lidas {conversations.filter(c => c.unread > 0 && !resolvedConversations.has(c.id)).length > 0 && `(${conversations.filter(c => c.unread > 0 && !resolvedConversations.has(c.id)).length})`}
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">
            Preview {conversations.filter(c => (c as any).is_preview === true && !resolvedConversations.has(c.id)).length > 0 && `(${conversations.filter(c => (c as any).is_preview === true && !resolvedConversations.has(c.id)).length})`}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs">
            Resolvidas {resolvedConversations.size > 0 && `(${resolvedConversations.size})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
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