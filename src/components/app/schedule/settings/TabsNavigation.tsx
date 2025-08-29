
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
}

interface TabsNavigationProps {
  activeTab: string;
  tabItems: TabItem[];
  onChange: (value: string) => void;
}

export const TabsNavigation = ({ activeTab, tabItems, onChange }: TabsNavigationProps) => {
  const isMobile = useIsMobile();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isTabsOverflowing, setIsTabsOverflowing] = useState(false);

  // Check if tabs are overflowing
  useEffect(() => {
    if (!tabsRef.current || !isMobile) return;
    
    const checkOverflow = () => {
      const element = tabsRef.current;
      if (element) {
        setIsTabsOverflowing(element.scrollWidth > element.clientWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    return () => window.removeEventListener('resize', checkOverflow);
  }, [isMobile]);

  if (isMobile && isTabsOverflowing) {
    const activeItem = tabItems.find(tab => tab.id === activeTab);
    
    return (
      <div className="mb-6 flex justify-center w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {activeItem?.label || "Selecione uma aba"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full min-w-[200px]" align="center">
            {tabItems.map(tab => (
              <DropdownMenuItem 
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={activeTab === tab.id ? "bg-accent" : ""}
              >
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
  
  return (
    <div ref={tabsRef} className="relative mb-6 w-full overflow-x-auto">
      <TabsList className="w-full">
        {tabItems.map(tab => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id} 
            className={isMobile ? "text-xs sm:text-sm px-2 sm:px-4" : ""}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};
