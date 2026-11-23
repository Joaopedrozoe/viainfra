import { Fragment } from "react";

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { useAuth } from "@/contexts/auth";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app/Sidebar";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNavigation } from "@/components/app/MobileNavigation";
import { GlobalAnnouncementBanner } from "@/components/app/announcements/GlobalAnnouncementBanner";


export const PrivateRoute = () => {
  const { isAuthenticated, isLoading, accessibleCompanies, company } = useAuth();
  const [hasWaited, setHasWaited] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const hasMultipleCompanies = (accessibleCompanies?.length || 0) > 1;

  
  // Add a small delay to ensure auth state is properly loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWaited(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // While checking authentication status, show loading spinner
  if (isLoading && !hasWaited) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-bonina border-solid rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if on root or any protected route without specific path
  if (window.location.pathname === "/" || window.location.pathname === "") {
    return <Navigate to="/dashboard" replace />;
  }

  // Render child routes if authenticated with sidebar layout
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="h-screen flex w-full overflow-hidden">
        {!isMobile && <AppSidebar />}
        
        <SidebarInset className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isMobile && hasMultipleCompanies ? 'pt-14' : ''}`}>
          <GlobalAnnouncementBanner />
          {!isMobile && (
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
            </header>
          )}
          
          <main className={`flex-1 min-h-0 overflow-y-auto ${isMobile ? 'pb-mobile-nav' : ''}`}>
            <AppErrorBoundary resetKey={location.pathname} inline>
              <Suspense fallback={<div className="flex h-full min-h-[60vh] items-center justify-center"><div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>}>
                {/* Trocar de empresa recria a tela: nada aberto da empresa anterior permanece. */}
                <Fragment key={company?.id ?? "no-company"}><Outlet /></Fragment>
              </Suspense>
            </AppErrorBoundary>
          </main>
        </SidebarInset>
        
        {isMobile && <MobileNavigation />}
        
      </div>
    </SidebarProvider>
  );
};
