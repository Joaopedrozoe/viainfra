
import { NavLink, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  MessageSquare, 
  Share2, 
  Bot, 
  Calendar, 
  Settings, 
  HelpCircle,
  LogOut,
  BarChart3,
  Users,
  Workflow
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
import { StatusSelector } from "@/components/app/StatusSelector";
import { CompanySwitcher } from "@/components/app/CompanySwitcher";


export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, company, userProfiles, switchCompany, signOut } = useAuth();
  const { hasFeature } = usePlanPermissions();
  const collapsed = state === "collapsed";
  
  const companies = userProfiles.map(p => ({
    id: p.company_id,
    name: p.companies?.name || 'Empresa'
  }));
  
  const isActive = (path: string) => location.pathname === path;

  // Route preloaders for instant perceived navigation
  const routePreloaders: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/pages/app/Dashboard'),
    '/inbox': () => import('@/pages/app/Inbox'),
    '/bot-builder': () => import('@/pages/app/BotBuilder'),
    '/channels': () => import('@/pages/app/Channels'),
    '/contacts': () => import('@/pages/app/Contacts'),
    '/agents': () => import('@/pages/app/Agents'),
    '/schedule': () => import('@/pages/app/Schedule'),
    '/settings': () => import('@/pages/app/Settings'),
    '/help': () => import('@/pages/app/Help'),
  };

  // Preload route on hover for instant navigation
  const handleMouseEnter = (url: string) => {
    if (routePreloaders[url]) {
      routePreloaders[url]();
    }
  };

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart3, available: true },
    { title: "Conversas", url: "/inbox", icon: MessageSquare, available: hasFeature(PLAN_FEATURES.INBOX) },
    { title: "Construtor de Bots", url: "/bot-builder", icon: Workflow, available: true },
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
    <Sidebar collapsible="icon" className="border-r border-border/50">
      {/* Logo Area - Premium floating effect */}
      <SidebarHeader className="bg-white dark:bg-background shadow-sm">
        <div className={`flex items-center ${collapsed ? 'justify-center py-4 px-2' : 'py-5 px-4'} transition-all duration-200`}>
          <Link 
            to="/dashboard" 
            className={`transition-all duration-200 hover:opacity-90 ${
              collapsed ? 'flex justify-center' : ''
            }`}
          >
            <img 
              src={company?.name === 'VIALOGISTIC' 
                ? "/lovable-uploads/vialogistic-logo.png" 
                : "/lovable-uploads/c4694f21-258b-4986-8611-4b1b7fb7a727.png"
              } 
              alt={company?.name || 'Logo'} 
              className={`${collapsed ? 'h-10' : 'h-14'} w-auto transition-all duration-200`}
            />
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {companies.length > 1 && (
              <div className="px-2 mb-2">
                <CompanySwitcher 
                  companies={companies}
                  currentCompanyId={company?.id || null}
                  onCompanyChange={switchCompany}
                  collapsed={collapsed}
                />
              </div>
            )}
            
            {!collapsed && (
              <div className="px-3 mb-4 space-y-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full flex items-center justify-start gap-3 text-left p-2 h-auto hover:bg-accent/50 transition-colors">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                          {profile?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden flex-1">
                        <div className="font-semibold truncate text-sm text-foreground">{profile?.name || 'Usuário'}</div>
                        <div className="text-xs text-muted-foreground/70 truncate">{profile?.email || ''}</div>
                      </div>
                      <StatusSelector />
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
            
            <SidebarMenu className="gap-1.5 px-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className={cn(
                      "transition-all duration-150",
                      isActive(item.url) 
                        ? "bg-sidebar-accent font-medium border-l-[3px] border-primary rounded-l-none" 
                        : "hover:bg-accent/50"
                    )}
                  >
                    <NavLink 
                      to={item.url}
                      onMouseEnter={() => handleMouseEnter(item.url)}
                    >
                      <item.icon className="h-5 w-5" />
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.feature && !collapsed && (
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
