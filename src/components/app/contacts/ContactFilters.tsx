import { ContactFilter } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ContactFiltersProps {
  filters: ContactFilter;
  onFiltersChange: (filters: ContactFilter) => void;
  availableTags: string[];
  availableChannels: string[];
}

export const ContactFilters = ({
  filters,
  onFiltersChange,
  availableTags,
  availableChannels
}: ContactFiltersProps) => {
  const updateFilter = (key: keyof ContactFilter, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateFilter('tags', newTags.length > 0 ? newTags : undefined);
  };

  const toggleChannel = (channel: string) => {
    const currentChannels = filters.channels || [];
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel];
    updateFilter('channels', newChannels.length > 0 ? newChannels : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof ContactFilter] !== undefined
  );

  return (
    <Card className="mt-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Filtros</CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-auto p-1 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Filter */}
        <div>
          <Label className="text-xs font-medium mb-2 block">Status</Label>
          <Select 
            value={filters.status || "all"} 
            onValueChange={(value) => updateFilter('status', value === "all" ? undefined : value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Source Filter */}
        <div>
          <Label className="text-xs font-medium mb-2 block">Origem</Label>
          <Select 
            value={filters.source || "all"} 
            onValueChange={(value) => updateFilter('source', value === "all" ? undefined : value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="conversation">Da Conversa</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Channels */}
        {availableChannels.length > 0 && (
          <div>
            <Label className="text-xs font-medium mb-2 block">Canais</Label>
            <div className="flex flex-wrap gap-1">
              {availableChannels.map((channel) => (
                <Badge
                  key={channel}
                  variant={filters.channels?.includes(channel) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleChannel(channel)}
                >
                  {channel}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {availableTags.length > 0 && (
          <div>
            <Label className="text-xs font-medium mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-1">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.tags?.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Boolean Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="has-email" className="text-xs">Tem E-mail</Label>
            <Switch
              id="has-email"
              checked={filters.hasEmail === true}
              onCheckedChange={(checked) => updateFilter('hasEmail', checked ? true : undefined)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="has-tasks" className="text-xs">Tarefas Pendentes</Label>
            <Switch
              id="has-tasks"
              checked={filters.hasPendingTasks === true}
              onCheckedChange={(checked) => updateFilter('hasPendingTasks', checked ? true : undefined)}
            />
          </div>
        </div>

        {/* Last Interaction */}
        <div>
          <Label className="text-xs font-medium mb-2 block">Última Interação</Label>
          <Select 
            value={filters.lastInteractionDays?.toString() || "all"} 
            onValueChange={(value) => updateFilter('lastInteractionDays', value === "all" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer período</SelectItem>
              <SelectItem value="1">Último dia</SelectItem>
              <SelectItem value="7">Última semana</SelectItem>
              <SelectItem value="30">Último mês</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};