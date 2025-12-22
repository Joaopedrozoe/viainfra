import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusIcon } from "./StatusIcon";
import { Lock } from "lucide-react";

interface StatusItem {
  id: string;
  name: string;
  avatar?: string;
  time: string;
  viewed?: boolean;
}

interface StatusListProps {
  statuses: StatusItem[];
  onSelectStatus: (statusId: string) => void;
  selectedId?: string;
}

export const StatusList: React.FC<StatusListProps> = ({ 
  statuses, 
  onSelectStatus,
  selectedId 
}) => {
  const viewedStatuses = statuses.filter(s => s.viewed);
  const unviewedStatuses = statuses.filter(s => !s.viewed);

  return (
    <div className="flex flex-col h-full">
      {/* Meu Status - Header */}
      <div className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                VS
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
              <span className="text-xs text-primary-foreground font-bold">+</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">Meu status</p>
            <p className="text-sm text-muted-foreground">Clique para atualizar seu status</p>
          </div>
        </div>
      </div>

      {/* Lista de Status */}
      <div className="flex-1 overflow-y-auto">
        {unviewedStatuses.length > 0 && (
          <>
            <div className="px-4 py-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recentes
              </span>
            </div>
            {unviewedStatuses.map((status) => (
              <StatusListItem 
                key={status.id}
                status={status}
                isSelected={selectedId === status.id}
                onClick={() => onSelectStatus(status.id)}
              />
            ))}
          </>
        )}

        {viewedStatuses.length > 0 && (
          <>
            <div className="px-4 py-2 mt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Visto
              </span>
            </div>
            {viewedStatuses.map((status) => (
              <StatusListItem 
                key={status.id}
                status={status}
                isSelected={selectedId === status.id}
                onClick={() => onSelectStatus(status.id)}
                viewed
              />
            ))}
          </>
        )}

        {statuses.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <StatusIcon size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum status disponível
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Os status dos seus contatos aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatusListItemProps {
  status: StatusItem;
  isSelected: boolean;
  onClick: () => void;
  viewed?: boolean;
}

const StatusListItem: React.FC<StatusListItemProps> = ({ 
  status, 
  isSelected, 
  onClick,
  viewed 
}) => {
  return (
    <div 
      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      <Avatar className={`h-12 w-12 ring-2 ring-offset-2 ring-offset-background ${
        viewed ? 'ring-muted-foreground/30' : 'ring-primary'
      }`}>
        <AvatarImage src={status.avatar} />
        <AvatarFallback className="bg-muted">
          {status.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{status.name}</p>
        <p className="text-sm text-muted-foreground">{status.time}</p>
      </div>
    </div>
  );
};
