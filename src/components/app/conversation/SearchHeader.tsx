
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Channel } from "@/types/conversation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedChannel: Channel | "all";
  onChannelChange: (channel: Channel | "all") => void;
  onSearch?: (term: string) => void;  // Add the onSearch prop for backward compatibility
}

const channelLabels: Record<Channel | "all", string> = {
  all: "Todos os canais",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
  telegram: "Telegram"
};

export const SearchHeader = ({
  searchTerm,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  onSearch,
}: SearchHeaderProps) => {
  // If onSearch is provided, use it, otherwise use onSearchChange
  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex gap-2">
        <Input
          placeholder="Pesquisar conversas..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-10"
          aria-label="Pesquisar conversas"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10",
                selectedChannel !== "all" && "bg-gray-100"
              )}
              aria-label="Filtrar por canal"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {(["all", "whatsapp", "instagram", "messenger", "telegram"] as const).map(channel => (
              <DropdownMenuItem 
                key={channel} 
                onClick={() => onChannelChange(channel)}
                className={cn(
                  selectedChannel === channel && "bg-gray-100"
                )}
              >
                {channelLabels[channel]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {selectedChannel !== "all" && (
        <div className="flex gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChannelChange("all")}
            className="text-xs"
          >
            Limpar filtro
          </Button>
        </div>
      )}
    </div>
  );
};
