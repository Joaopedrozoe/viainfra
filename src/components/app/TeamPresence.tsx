import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Circle, MessageCircle } from "lucide-react";
import { useUserPresence, UserStatus } from "@/hooks/useUserPresence";
import { useAuth } from "@/contexts/auth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamPresenceProps {
  onStartChat?: (userId: string) => void;
}

const statusConfig = {
  online: { label: 'Online', color: 'bg-green-500' },
  away: { label: 'Ausente', color: 'bg-yellow-500' },
  busy: { label: 'Ocupado', color: 'bg-red-500' },
  offline: { label: 'Offline', color: 'bg-gray-400' },
};

export const TeamPresence = ({ onStartChat }: TeamPresenceProps) => {
  const { userPresences, loading } = useUserPresence();
  const { user, profile } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  };

  const sortedPresences = [...userPresences].sort((a, b) => {
    const statusOrder: Record<UserStatus, number> = { online: 0, busy: 1, away: 2, offline: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipe</CardTitle>
        <CardDescription>
          {userPresences.filter(p => p.status !== 'offline').length} online • {userPresences.length} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {/* Adicionar botão para conversa consigo mesmo */}
            {user && (
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors border border-dashed">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">
                      {getInitials(profile?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 fill-current border-2 border-background rounded-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      Minhas Anotações
                    </p>
                    <Badge variant="secondary" className="text-xs">Privado</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Espaço pessoal para anotações
                  </p>
                </div>

                {onStartChat && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStartChat(user.id)}
                    className="h-8 w-8 p-0"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {sortedPresences.map((presence) => {
              const config = statusConfig[presence.status];
              const isCurrentUser = presence.user_id === user?.id;

              return (
                <div
                  key={presence.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs">
                        {getInitials(presence.profile?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <Circle
                      className={`absolute bottom-0 right-0 w-3 h-3 ${config.color} fill-current border-2 border-background rounded-full`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {presence.profile?.name}
                        {isCurrentUser && ' (Você)'}
                      </p>
                      {presence.profile?.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{config.label}</span>
                      {presence.status !== 'offline' && (
                        <>
                          <span>•</span>
                          <span>{getTimeAgo(presence.last_seen)}</span>
                        </>
                      )}
                    </div>
                    {presence.custom_message && (
                      <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                        {presence.custom_message}
                      </p>
                    )}
                  </div>

                  {!isCurrentUser && onStartChat && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStartChat(presence.user_id)}
                      className="h-8 w-8 p-0"
                      title={presence.status === 'offline' ? 'Iniciar conversa (offline)' : 'Iniciar conversa'}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
