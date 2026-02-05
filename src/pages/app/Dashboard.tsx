import React, { useState } from "react";
import { DashboardHeader } from "@/components/app/dashboard/DashboardHeader";
import { MetricsOverview } from "@/components/app/dashboard/MetricsOverview";
import { ActivityChart } from "@/components/app/dashboard/ActivityChart";
import { ChannelDistributionChart } from "@/components/app/dashboard/ChannelDistributionChart";
import { WeeklyTrendChart } from "@/components/app/dashboard/WeeklyTrendChart";
import { ChannelHealthPanel } from "@/components/app/dashboard/ChannelHealthPanel";
import { RecentActivity } from "@/components/app/dashboard/RecentActivity";
import { SystemHealthCheck } from "@/components/app/SystemHealthCheck";
import { TeamPresence } from "@/components/app/TeamPresence";
import { InternalChatWindow } from "@/components/app/InternalChatWindow";
import { useInternalChat, InternalConversation } from "@/hooks/useInternalChat";
import { useAuth } from "@/contexts/auth";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const Dashboard = () => {
  const [selectedChat, setSelectedChat] = useState<InternalConversation | null>(null);
  const { conversations, createConversation } = useInternalChat();
  const { user } = useAuth();

  const handleStartChat = async (userId: string) => {
    if (!user?.id) return;
    
    // Para "Minhas Anotações" (conversa consigo mesmo)
    if (userId === user.id) {
      const selfConversation = conversations.find(
        conv => {
          // Verifica se é uma conversa não-grupo com 2 participantes iguais (self-chat)
          return !conv.is_group && 
                 conv.participants.length === 2 && 
                 conv.participants[0] === user.id && 
                 conv.participants[1] === user.id;
        }
      );

      if (selfConversation) {
        setSelectedChat(selfConversation);
      } else {
        // Cria conversa consigo mesmo (ambos participantes são o mesmo usuário)
        const newConversation = await createConversation([user.id]);
        if (newConversation) {
          setSelectedChat(newConversation);
        }
      }
    } else {
      // Para conversas com outros usuários
      const existingConversation = conversations.find(
        conv => {
          // Conversa não-grupo com exatamente 2 participantes: current user e target user
          if (!conv.is_group && conv.participants.length === 2) {
            return conv.participants.includes(userId) && conv.participants.includes(user.id);
          }
          return false;
        }
      );

      if (existingConversation) {
        setSelectedChat(existingConversation);
      } else {
        // Cria nova conversa com o outro usuário
        const newConversation = await createConversation([userId]);
        if (newConversation) {
          setSelectedChat(newConversation);
        }
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 bg-muted/30 min-h-full">
      <DashboardHeader />
      <MetricsOverview />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="w-full min-w-0">
          <ActivityChart />
        </div>
        <div className="w-full min-w-0">
          <ChannelDistributionChart />
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="w-full min-w-0">
          <WeeklyTrendChart />
        </div>
        <div className="w-full min-w-0">
          <SystemHealthCheck />
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="w-full min-w-0">
          <ChannelHealthPanel />
        </div>
        <div className="w-full min-w-0">
          <TeamPresence onStartChat={handleStartChat} />
        </div>
      </div>

      <div className="w-full min-w-0">
        <RecentActivity />
      </div>

      <Sheet open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
        <SheetContent side="right" className="w-full sm:w-[500px] p-0">
          {selectedChat && (
            <InternalChatWindow 
              conversation={selectedChat} 
              onBack={() => setSelectedChat(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;