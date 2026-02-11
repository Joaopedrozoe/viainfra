import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompanyAuthModal } from "./CompanyAuthModal";

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

const isCompanyVerified = (companyId: string): boolean => {
  const verified = JSON.parse(sessionStorage.getItem("verified_companies") || "[]");
  return verified.includes(companyId);
};

export const CompanySwitcher = ({ 
  companies, 
  currentCompanyId, 
  onCompanyChange,
  collapsed = false 
}: CompanySwitcherProps) => {
  const [authModal, setAuthModal] = useState<{ open: boolean; company: Company | null }>({
    open: false,
    company: null,
  });

  // Mark the current (logged-in) company as verified on mount
  useEffect(() => {
    if (currentCompanyId && !isCompanyVerified(currentCompanyId)) {
      const verified = JSON.parse(sessionStorage.getItem("verified_companies") || "[]");
      verified.push(currentCompanyId);
      sessionStorage.setItem("verified_companies", JSON.stringify(verified));
    }
  }, [currentCompanyId]);

  const currentCompany = companies.find(c => c.id === currentCompanyId);
  
  const sortedCompanies = [...companies].sort((a, b) => {
    const aName = a.name?.toUpperCase();
    const bName = b.name?.toUpperCase();
    if (aName === 'VIAINFRA') return -1;
    if (bName === 'VIAINFRA') return 1;
    return 0;
  });

  const handleCompanySelect = (company: Company) => {
    if (company.id === currentCompanyId) return;

    // If switching to a different company, check if verified in this session
    if (isCompanyVerified(company.id)) {
      onCompanyChange(company.id);
    } else {
      // The current company (where they logged in) is always verified
      // Only require auth for companies they haven't verified yet
      setAuthModal({ open: true, company });
    }
  };

  const handleAuthSuccess = (companyId: string) => {
    setAuthModal({ open: false, company: null });
    onCompanyChange(companyId);
  };

  const renderDropdownItems = () =>
    sortedCompanies.map((company) => (
      <DropdownMenuItem
        key={company.id}
        onClick={() => handleCompanySelect(company)}
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
    ));

  return (
    <>
      {collapsed ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Building2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {renderDropdownItems()}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
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
            {renderDropdownItems()}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {authModal.company && (
        <CompanyAuthModal
          isOpen={authModal.open}
          onClose={() => setAuthModal({ open: false, company: null })}
          onSuccess={handleAuthSuccess}
          targetCompany={authModal.company}
        />
      )}
    </>
  );
};
