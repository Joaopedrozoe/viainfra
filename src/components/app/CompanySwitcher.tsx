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
import type { Profile, Company } from "@/contexts/auth/types";

interface CompanyItem {
  id: string;
  name: string;
}

interface CompanySwitcherProps {
  companies: CompanyItem[];
  currentCompanyId: string | null;
  onCompanyChange: (companyId: string) => void;
  onCompanyChangeWithProfile: (companyId: string, profile: Profile, company: Company) => void;
  userProfiles: Profile[];
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
  onCompanyChangeWithProfile,
  userProfiles,
  collapsed = false 
}: CompanySwitcherProps) => {
  const [authModal, setAuthModal] = useState<{ open: boolean; company: CompanyItem | null }>({
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

  const handleCompanySelect = (company: CompanyItem) => {
    if (company.id === currentCompanyId) return;

    // Check if user has a local profile for this company
    const hasLocalProfile = userProfiles.some(p => p.company_id === company.id);

    if (hasLocalProfile && isCompanyVerified(company.id)) {
      // Has profile and verified - instant switch
      onCompanyChange(company.id);
    } else if (hasLocalProfile) {
      // Has profile but not verified - mark as verified (same user_id = same session)
      const verified = JSON.parse(sessionStorage.getItem("verified_companies") || "[]");
      verified.push(company.id);
      sessionStorage.setItem("verified_companies", JSON.stringify(verified));
      onCompanyChange(company.id);
    } else if (isCompanyVerified(company.id)) {
      // No local profile but verified this session - switch with cached data
      onCompanyChange(company.id);
    } else {
      // No local profile and not verified - require authentication
      setAuthModal({ open: true, company });
    }
  };

  const handleAuthSuccess = (companyId: string, profileData?: any) => {
    setAuthModal({ open: false, company: null });
    
    if (profileData?.profile && profileData?.company) {
      // Use the profile data returned by the edge function
      const externalProfile: Profile = {
        id: profileData.profile.id,
        user_id: profileData.profile.user_id || '',
        company_id: companyId,
        name: profileData.profile.name,
        email: profileData.profile.email,
        role: profileData.profile.role || 'user',
        permissions: profileData.profile.permissions || [],
        avatar_url: profileData.profile.avatar_url,
        phone: profileData.profile.phone,
        created_at: profileData.profile.created_at || new Date().toISOString(),
        updated_at: profileData.profile.updated_at || new Date().toISOString(),
      };
      
      const companyData: Company = {
        id: profileData.company.id,
        name: profileData.company.name,
        domain: profileData.company.domain,
        plan: (profileData.company.plan || 'free') as 'free' | 'pro' | 'enterprise',
        logo_url: profileData.company.logo_url,
        settings: profileData.company.settings || {},
        created_at: profileData.company.created_at || new Date().toISOString(),
        updated_at: profileData.company.updated_at || new Date().toISOString(),
      };

      onCompanyChangeWithProfile(companyId, externalProfile, companyData);
    } else {
      onCompanyChange(companyId);
    }
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
