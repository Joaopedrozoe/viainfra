import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/Sidebar";
import { MobileNavigation } from "@/components/app/MobileNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react";
import { DialPad } from "@/components/app/calls/DialPad";
import { CallHistory } from "@/components/app/calls/CallHistory";
import { CallSettings } from "@/components/app/calls/CallSettings";
import { useCalls } from "@/hooks/useCalls";

const WhatsAppCalls = () => {
  const { stats } = useCalls();
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <Phone className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Ligações WhatsApp</h1>
                <p className="text-sm text-muted-foreground">Discador e registro de chamadas (VIAINFRA · WhatsApp Cloud API)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <PhoneIncoming className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-xl font-bold">{stats.incoming}</p>
                    <p className="text-xs text-muted-foreground">Recebidas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <PhoneOutgoing className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xl font-bold">{stats.outgoing}</p>
                    <p className="text-xs text-muted-foreground">Realizadas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <PhoneMissed className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="text-xl font-bold">{stats.missed}</p>
                    <p className="text-xs text-muted-foreground">Perdidas</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="dialpad">
              <TabsList>
                <TabsTrigger value="dialpad">Discador</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              <TabsContent value="dialpad" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <DialPad />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <CallHistory />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <CallSettings />
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <MobileNavigation />
      </div>
    </SidebarProvider>
  );
};

export default WhatsAppCalls;

