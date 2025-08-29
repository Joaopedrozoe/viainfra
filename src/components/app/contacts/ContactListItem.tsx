import { Contact } from "@/types/contact";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChannelIcon } from "@/components/app/conversation/ChannelIcon";

interface ContactListItemProps {
  contact: Contact;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

export const ContactListItem = ({
  contact,
  isSelected,
  isChecked,
  onSelect,
  onToggle
}: ContactListItemProps) => {
  const pendingTasks = contact.notes.reduce((count, note) => 
    count + note.tasks.filter(task => !task.completed).length, 0
  );

  const lastInteraction = contact.lastInteraction 
    ? formatDistanceToNow(new Date(contact.lastInteraction), { 
        addSuffix: true, 
        locale: ptBR 
      })
    : 'Sem interação';

  return (
    <div
      className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/10 border border-primary/20' 
          : 'hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      />
      
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-muted text-muted-foreground">
          {contact.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{contact.name}</h4>
          {contact.channel && (
            <ChannelIcon channel={contact.channel as any} />
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mb-2">
          {contact.email || contact.phone || 'Sem contato'}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{contact.tags.length - 2}
              </span>
            )}
          </div>
          
          {pendingTasks > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingTasks} tarefa{pendingTasks !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {lastInteraction}
        </div>
      </div>
    </div>
  );
};