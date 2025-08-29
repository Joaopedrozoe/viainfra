import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, User, CheckCircle, Clock } from "lucide-react";
import { getDemoConversations } from "@/data/mockConversations";

export const RecentActivity: React.FC = () => {
  // Pegar as 5 conversas mais recentes (simulado baseado em ID)
  const recentConversations = getDemoConversations()
    .sort((a, b) => parseInt(b.id) - parseInt(a.id))
    .slice(0, 5);
  
  const getStatusIcon = (unread: number) => {
    if (unread === 0) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (unread > 3) {
      return <Clock className="h-4 w-4 text-red-600" />;
    } else {
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    }
  };
  
  const getStatusColor = (unread: number) => {
    if (unread === 0) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (unread > 3) {
      return 'bg-red-50 text-red-700 border-red-200';
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
    // Como o time já vem formatado dos dados mock, retornamos como está
    return time;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          Últimas conversas e interações
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {recentConversations.map((conversation) => (
            <div 
              key={conversation.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {conversation.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium truncate">
                      {conversation.name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs self-start sm:self-center ${getStatusColor(conversation.unread)}`}
                    >
                      {getStatusText(conversation.unread)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conversation.preview}
                  </div>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0 self-start sm:self-center">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  {getStatusIcon(conversation.unread)}
                  <span>{formatTime(conversation.time)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  via {conversation.channel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};