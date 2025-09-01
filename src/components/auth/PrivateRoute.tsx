
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app/Sidebar";
import { ProductionStatus } from "@/components/app/ProductionStatus";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNavigation } from "@/components/app/MobileNavigation";

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [hasWaited, setHasWaited] = useState(false);
  const isMobile = useIsMobile();
  
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
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        
        <SidebarInset className="flex-1">
          {!isMobile && (
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1" />
              <ProductionStatus />
            </header>
          )}
          
          <main className="flex-1 overflow-hidden">
            <div className={`h-full overflow-auto ${isMobile ? 'pt-16 pb-20' : ''}`}>
              <Outlet />
            </div>
          </main>
        </SidebarInset>
        
        {isMobile && <MobileNavigation />}
        
      </div>
    </SidebarProvider>
  );
};
