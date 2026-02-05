import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, User, CheckCircle, Clock } from "lucide-react";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Conversation } from "@/types/conversation";
import { useConversations } from "@/hooks/useConversations";

export const RecentActivity: React.FC = () => {
  const { isDemoMode } = useDemoMode();
  const { conversations: supabaseConversations, loading } = useConversations();
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  
  useEffect(() => {
    if (loading) return;
    
    try {
      // Mapear conversas do Supabase para o formato esperado
      const mapped = supabaseConversations
        .slice(0, 10) // Pegar apenas as 10 mais recentes
        .map(conv => {
          const lastMessage = conv.lastMessage;
          
          return {
            id: conv.id,
            name: conv.contact?.name || 'Cliente Web',
            channel: conv.channel as any,
            preview: lastMessage?.content || 'Nova conversa',
            time: new Date(conv.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            unread: conv.status === 'open' || conv.status === 'pending' ? 1 : 0,
            avatar: conv.contact?.avatar_url,
          };
        });
      
      setRecentConversations(mapped);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentConversations([]);
    }
  }, [supabaseConversations, loading]);
  
  const getStatusIcon = (unread: number) => {
    if (unread === 0) {
      return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    } else if (unread > 3) {
      return <Clock className="h-4 w-4 text-destructive" />;
    } else {
      return <MessageSquare className="h-4 w-4 text-primary" />;
    }
  };
  
  const getStatusColor = (unread: number) => {
    if (unread === 0) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
    } else if (unread > 3) {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    } else {
      return 'bg-primary/10 text-primary border-primary/20';
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
  
  if (loading) {
    return (
      <Card className="w-full shadow-sm border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
          <CardDescription>Últimas conversas e interações</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-sm border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
        <CardDescription>Últimas conversas e interações</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {recentConversations.length > 0 ? (
            recentConversations.map((conversation) => (
              <div 
                key={conversation.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
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