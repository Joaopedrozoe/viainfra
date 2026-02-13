
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, MoreHorizontal, Users, Calendar, Settings, ExternalLink, Layers, BarChart3, Plug, HelpCircle, Radio, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

// Navigation items for the bottom bar
const mainNavItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <BarChart3 size={24} />
  },
  {
    title: "Conversas",
    path: "/inbox",
    icon: <MessageSquare size={24} />
  },
  {
    title: "Agentes IA",
    path: "/agents",
    icon: <Users size={24} />
  }
];

// Items for the "More" menu with icons
const moreNavItems = [
  {
    title: "Canais",
    path: "/channels",
    icon: <Layers size={20} />
  },
  {
    title: "Transmissão",
    path: "/broadcast",
    icon: <Radio size={20} />
  },
  {
    title: "Ligações",
    path: "/calls",
    icon: <Phone size={20} />
  },
  {
    title: "Agenda",
    path: "/schedule",
    icon: <Calendar size={20} />
  },
  {
    title: "Widget",
    path: "/widget",
    icon: <ExternalLink size={20} />
  },
  {
    title: "Configurações",
    path: "/settings",
    icon: <Settings size={20} />
  },
  {
    title: "Ajuda",
    path: "/help",
    icon: <HelpCircle size={20} />
  }
];

export const MobileNavigation = () => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex justify-around items-center z-40 pb-safe">
      {mainNavItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3",
              isActive ? "text-viainfra-primary" : "text-[#888888]"
            )}
          >
            <div className="flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-xs mt-0.5">{item.title}</span>
          </Link>
        );
      })}
      
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetTrigger asChild>
          <button
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3",
              isMoreOpen ? "text-viainfra-primary" : "text-[#888888]"
            )}
          >
            <div className="flex items-center justify-center">
              <MoreHorizontal size={24} />
            </div>
            <span className="text-xs mt-0.5">Mais</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[50vh] px-4 pb-20 focus:outline-none z-50">
          <div className="pt-6 pb-6">
            <h3 className="text-lg font-semibold mb-4">Mais opções</h3>
            <div className="grid grid-cols-3 gap-4">
              {moreNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <SheetClose key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                        isActive 
                          ? "bg-viainfra-primary/10 text-viainfra-primary" 
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                        isActive 
                          ? "bg-viainfra-primary/10" 
                          : "bg-gray-100"
                      )}>
                        {item.icon}
                      </div>
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
