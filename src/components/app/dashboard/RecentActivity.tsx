import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, User, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Conversation } from "@/types/conversation";

export const RecentActivity: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentActivity = async () => {
      setIsLoading(true);
      try {
        if (!isDemoMode) {
          // Buscar dados reais do Supabase
          const { data } = await supabase
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(5);
          setRecentConversations(data || []);
        } else {
          // No modo demo, mostrar lista vazia
          setRecentConversations([]);
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setRecentConversations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentActivity();
    
    // Listen for dashboard refresh events
    const handleRefresh = () => {
      fetchRecentActivity();
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [isDemoMode]);
  
  const getStatusIcon = (unread: number) => {
    if (unread === 0) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (unread > 3) {
      return <Clock className="h-4 w-4 text-destructive" />;
    } else {
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    }
  };
  
  const getStatusColor = (unread: number) => {
    if (unread === 0) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (unread > 3) {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    } else {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };
  
  const getStatusText = (unread: number) => {
    if (unread === 0) {
      return 'Resolvida';
    } else if (unread > 3) {
      return 'Urgente';
    } else {
      return 'Ativa';
    }
  };
  
  const formatTime = (time: string) => {
    return time;
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas conversas e interações</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
                <div className="h-3 w-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          {isDemoMode ? "Conecte uma API do WhatsApp para ver atividades reais" : "Últimas conversas e interações"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {recentConversations.length > 0 ? (
            recentConversations.map((conversation) => (
              <div 
                key={conversation.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {conversation.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium truncate">
                        {conversation.name || 'Usuário sem nome'}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs self-start sm:self-center ${getStatusColor(conversation.unread || 0)}`}
                      >
                        {getStatusText(conversation.unread || 0)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {conversation.preview || 'Sem mensagem'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0 self-start sm:self-center">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    {getStatusIcon(conversation.unread || 0)}
                    <span>{formatTime(conversation.time || '')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    via {conversation.channel || 'desconhecido'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isDemoMode 
                ? "Nenhuma atividade no modo demo" 
                : "Nenhuma atividade recente encontrada"
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};