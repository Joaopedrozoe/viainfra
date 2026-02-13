
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/Sidebar";
import { MobileNavigation } from "@/components/app/MobileNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DialPad } from "@/components/app/calls/DialPad";
import { CallHistory } from "@/components/app/calls/CallHistory";

const WhatsAppCalls = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            {/* Banner em desenvolvimento */}
            <Alert className="border-amber-300 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 font-medium">
                🚧 Módulo em desenvolvimento — disponível em breve
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3">
              <Phone className="h-7 w-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Ligações WhatsApp</h1>
                <p className="text-sm text-muted-foreground">Discador e registro de chamadas</p>
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <PhoneIncoming className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Recebidas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <PhoneOutgoing className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xl font-bold">8</p>
                    <p className="text-xs text-muted-foreground">Realizadas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <PhoneMissed className="h-6 w-6 text-destructive" />
                  <div>
                    <p className="text-xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Perdidas</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="dialpad">
              <TabsList>
                <TabsTrigger value="dialpad">Discador</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
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
            </Tabs>
          </div>
        </main>
        <MobileNavigation />
      </div>
    </SidebarProvider>
  );
};

export default WhatsAppCalls;
