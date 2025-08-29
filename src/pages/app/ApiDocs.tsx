
import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ApiDocsSidebar } from "@/components/app/api/ApiDocsSidebar";
import { ApiDocsContent } from "@/components/app/api/ApiDocsContent";

const ApiDocs = () => {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("introduction");
  
  return (
    <div className="h-full">
      <main className="h-full overflow-auto">
      <div className={cn(
        "flex-1 overflow-hidden",
        isMobile ? "w-full" : ""
      )}>
        <div className="h-full flex flex-col md:flex-row">
          {/* API Documentation Sidebar */}
          <ApiDocsSidebar 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          
          {/* API Documentation Content */}
          <div className="flex-1 overflow-y-auto pb-16">
            <ApiDocsContent activeSection={activeSection} />
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default ApiDocs;
