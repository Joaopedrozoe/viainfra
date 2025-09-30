
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Channel } from "@/types/conversation";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/contexts/DepartmentsContext";
import { useAuth } from "@/contexts/auth";
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
  selectedDepartment?: string | "all";
  onDepartmentChange?: (department: string | "all") => void;
  onSearch?: (term: string) => void;  // Add the onSearch prop for backward compatibility
}

const channelLabels: Record<Channel | "all", string> = {
  all: "Todos os canais",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  messenger: "Messenger",
  telegram: "Telegram",
  web: "Website",
  internal: "Equipe"
};

export const SearchHeader = ({
  searchTerm,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  selectedDepartment = "all",
  onDepartmentChange,
  onSearch,
}: SearchHeaderProps) => {
  const { profile } = useAuth();
  const { getFilteredDepartments } = useDepartments();
  
  const userDepartments = profile ? getFilteredDepartments(profile.id || '') : [];
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
            {(["all", "whatsapp", "instagram", "messenger", "telegram", "web", "internal"] as const).map(channel => (
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
        
        {onDepartmentChange && userDepartments.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10",
                  selectedDepartment !== "all" && "bg-gray-100"
                )}
                aria-label="Filtrar por departamento"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => onDepartmentChange("all")}
                className={cn(
                  selectedDepartment === "all" && "bg-gray-100"
                )}
              >
                Todos os departamentos
              </DropdownMenuItem>
              {userDepartments.map(department => (
                <DropdownMenuItem 
                  key={department.id} 
                  onClick={() => onDepartmentChange(department.id)}
                  className={cn(
                    selectedDepartment === department.id && "bg-gray-100"
                  )}
                >
                  {department.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {(selectedChannel !== "all" || selectedDepartment !== "all") && (
        <div className="flex gap-2 mt-2">
          {selectedChannel !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChannelChange("all")}
              className="text-xs"
            >
              Limpar filtro de canal
            </Button>
          )}
          {selectedDepartment !== "all" && onDepartmentChange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDepartmentChange("all")}
              className="text-xs"
            >
              Limpar filtro de departamento
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
