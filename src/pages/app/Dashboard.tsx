import React from "react";
import { DashboardHeader } from "@/components/app/dashboard/DashboardHeader";
import { MetricsOverview } from "@/components/app/dashboard/MetricsOverview";
import { ActivityChart } from "@/components/app/dashboard/ActivityChart";
import { ChannelDistributionChart } from "@/components/app/dashboard/ChannelDistributionChart";
import { WeeklyTrendChart } from "@/components/app/dashboard/WeeklyTrendChart";
import { ChannelHealthPanel } from "@/components/app/dashboard/ChannelHealthPanel";
import { RecentActivity } from "@/components/app/dashboard/RecentActivity";

const Dashboard = () => {
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-full overflow-hidden">
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
          <ChannelHealthPanel />
        </div>
      </div>
      
      <RecentActivity />
    </div>
  );
};

export default Dashboard;