
import { NavLink, Link, useLocation } from "react-router-dom";
import { 
  MessageSquare, 
  Share2, 
  Bot, 
  Calendar, 
  Settings, 
  HelpCircle,
  LogOut,
  BarChart3,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { PlanBadge } from "@/components/ui/plan-gate";
import { PLAN_FEATURES } from "@/types/plans";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";


export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { hasFeature } = usePlanPermissions();
  const collapsed = state === "collapsed";
  
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart3, available: true },
    { title: "Conversas", url: "/inbox", icon: MessageSquare, available: hasFeature(PLAN_FEATURES.INBOX) },
    { title: "Canais", url: "/channels", icon: Share2, available: true },
    { title: "Relacionamento", url: "/contacts", icon: Users, available: true },
    { 
      title: "Agentes IA", 
      url: "/agents", 
      icon: Bot, 
      available: true, // Sempre disponível
      feature: PLAN_FEATURES.AI_AGENTS
    },
    { 
      title: "Agenda", 
      url: "/schedule", 
      icon: Calendar, 
      available: true, // Sempre disponível
      feature: PLAN_FEATURES.SCHEDULE
    },
    { title: "Configurações", url: "/settings", icon: Settings, available: true },
    { title: "Ajuda", url: "/help", icon: HelpCircle, available: true },
  ];
  
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className={`flex items-center px-2 py-2 ${collapsed ? 'justify-center' : 'gap-2'}`}>
          <Link 
            to="/dashboard" 
            className={`transition-all duration-200 ${
              collapsed ? 'flex justify-center' : ''
            }`}
          >
            <img 
              src="/lovable-uploads/c4694f21-258b-4986-8611-4b1b7fb7a727.png" 
              alt="ViaInfra" 
              className={`${collapsed ? 'h-8' : 'h-10'} w-auto transition-all duration-200`}
            />
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {!collapsed && (
              <div className="px-2 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full flex items-center justify-start gap-2 text-left p-2 h-auto">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                          {profile?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <div className="font-medium truncate text-sm">{profile?.name || 'Usuário'}</div>
                        <div className="text-xs text-muted-foreground truncate">{profile?.email || ''}</div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                  >
                    <NavLink 
                      to={item.url}
                    >
                      <item.icon className="h-4 w-4" />
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.feature && !hasFeature(item.feature) && !collapsed && (
                            <PlanBadge feature={item.feature} className="ml-2 text-xs" />
                          )}
                        </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        {collapsed ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} className="text-destructive">
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
