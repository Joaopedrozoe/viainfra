import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
}

interface CompanySwitcherProps {
  companies: Company[];
  currentCompanyId: string | null;
  onCompanyChange: (companyId: string) => void;
  collapsed?: boolean;
}

export const CompanySwitcher = ({ 
  companies, 
  currentCompanyId, 
  onCompanyChange,
  collapsed = false 
}: CompanySwitcherProps) => {
  const currentCompany = companies.find(c => c.id === currentCompanyId);
  
  // Ordenar empresas: VIAINFRA primeiro, depois outras
  const sortedCompanies = [...companies].sort((a, b) => {
    const aName = a.name?.toUpperCase();
    const bName = b.name?.toUpperCase();
    if (aName === 'VIAINFRA') return -1;
    if (bName === 'VIAINFRA') return 1;
    return 0;
  });

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Building2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {sortedCompanies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => onCompanyChange(company.id)}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  currentCompanyId === company.id ? "opacity-100" : "opacity-0"
                )}
              />
              {company.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between h-auto py-2 px-3"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium truncate">
              {currentCompany?.name || "Selecione uma empresa"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {sortedCompanies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => onCompanyChange(company.id)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                currentCompanyId === company.id ? "opacity-100" : "opacity-0"
              )}
            />
            {company.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
