import { useState, useEffect } from "react";
import { SearchHeader } from "./conversation/SearchHeader";
import { ConversationItem } from "./conversation/ConversationItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { DbConversation, mapDbConversationToConversation } from "@/types/supabase";
import { Conversation, Channel } from "@/types/conversation";
import { Skeleton } from "@/components/ui/skeleton";
import { useDemoMode } from "@/hooks/useDemoMode";

type ConversationListProps = {
  onSelectConversation: (id: string) => void;
  selectedId?: string;
};

export const ConversationList = ({ onSelectConversation, selectedId }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | "all">("all");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "preview">("all");
  const [isLoading, setIsLoading] = useState(true);
  const { isDemoMode } = useDemoMode();

  // Fetch conversations from Supabase with real-time updates
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        if (!isDemoMode) {
          // Use real Supabase data
          const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('time', { ascending: false });
            
          if (error) {
            console.error('Error fetching conversations:', error);
            return;
          }
          
          const mappedConversations = (data || []).map(mapDbConversationToConversation);
          setConversations(mappedConversations);
        } else {
          // In demo mode, show empty state for conversations
          setConversations([]);
        }
      } catch (error) {
        console.error('Error in conversation fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();

    // Set up real-time subscription for conversations
    if (!isDemoMode) {
      const channel = supabase
        .channel('conversations-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'conversations' }, 
          (payload) => {
            console.log('Conversation change:', payload);
            fetchConversations(); // Refresh conversations on any change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isDemoMode]);

  // Handle conversation selection
  const handleConversationSelect = (conversationId: string) => {
    onSelectConversation(conversationId);
    
    // Mark conversation as read in real mode (will be handled by backend)
    if (!isDemoMode) {
      // TODO: API call to mark as read when backend is connected
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unread: 0 } : conv
        )
      );
    }
  };

  // Apply filters when conversations, search term, channel or active tab changes
  useEffect(() => {
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

    // Apply tab filter
    if (activeTab === "unread") {
      result = result.filter((conversation) => conversation.unread > 0);
    } else if (activeTab === "preview") {
      result = result.filter((conversation) => (conversation as any).is_preview === true);
    }

    setFilteredConversations(result);
  }, [conversations, searchTerm, selectedChannel, activeTab]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <SearchHeader 
          searchTerm="" 
          onSearchChange={() => {}} 
          selectedChannel="all" 
          onChannelChange={() => {}} 
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
      />
      <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="px-4 pt-2">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all" className="text-xs">
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Não lidas {conversations.filter(c => c.unread > 0).length > 0 && `(${conversations.filter(c => c.unread > 0).length})`}
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">
            Preview {conversations.filter(c => (c as any).is_preview === true).length > 0 && `(${conversations.filter(c => (c as any).is_preview === true).length})`}
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
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchTerm || selectedChannel !== "all" ? "Nenhuma conversa encontrada" : 
             isDemoMode ? "Conecte uma API do WhatsApp para ver conversas reais" : "Nenhuma conversa disponível"}
          </div>
        )}
      </div>
    </div>
  );
};