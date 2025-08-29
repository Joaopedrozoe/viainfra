
import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsNavigation } from "./settings/TabsNavigation";
import { IntegrationsTab } from "./settings/IntegrationsTab";
import { NotificationsTab } from "./settings/NotificationsTab";
import { BookingPageTab } from "./settings/BookingPageTab";
import { PermissionsTab } from "./settings/PermissionsTab";

export const ScheduleSettings = () => {
  const [activeTab, setActiveTab] = useState("integrations");
  
  // Tab items for navigation
  const tabItems = [
    { id: "integrations", label: "Integrações" },
    { id: "notifications", label: "Notificações" },
    { id: "booking", label: "Página de Booking" },
    { id: "permissions", label: "Permissões" }
  ];

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsNavigation 
        activeTab={activeTab} 
        tabItems={tabItems} 
        onChange={handleTabChange}
      />
      
      {/* Integrations Tab */}
      <TabsContent value="integrations">
        <IntegrationsTab />
      </TabsContent>
      
      {/* Notifications Tab */}
      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>
      
      {/* Booking Page Settings Tab */}
      <TabsContent value="booking">
        <BookingPageTab />
      </TabsContent>
      
      {/* User Permissions Tab */}
      <TabsContent value="permissions">
        <PermissionsTab />
      </TabsContent>
    </Tabs>
  );
};
