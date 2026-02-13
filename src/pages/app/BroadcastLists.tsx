
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/Sidebar";
import { MobileNavigation } from "@/components/app/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Radio, Plus, Users, Send, BarChart3, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BroadcastListForm } from "@/components/app/broadcast/BroadcastListForm";
import { BroadcastComposer } from "@/components/app/broadcast/BroadcastComposer";
import { BroadcastHistory } from "@/components/app/broadcast/BroadcastHistory";
import { toast } from "sonner";
import type { BroadcastList } from "@/types/broadcast";

const mockContacts: { id: string; name: string; phone: string }[] = [];

const BroadcastLists = () => {
  const [lists, setLists] = useState<BroadcastList[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<BroadcastList | null>(null);

  const handleCreateList = (data: { name: string; description: string; contactIds: string[] }) => {
    const newList: BroadcastList = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      contactIds: data.contactIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLists(prev => [newList, ...prev]);
    toast.success("Lista criada com sucesso!");
  };

  const handleSend = (list: BroadcastList) => {
    setSelectedList(list);
    setComposerOpen(true);
  };

  const handleSendMessage = (templateId: string) => {
    toast.success(`Mensagem enviada para ${selectedList?.contactIds.length} contatos!`);
    setComposerOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* Banner em desenvolvimento */}
            <Alert className="border-amber-300 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 font-medium">
                🚧 Módulo em desenvolvimento — disponível em breve
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className="h-7 w-7 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Lista de Transmissão</h1>
                  <p className="text-sm text-muted-foreground">Envie mensagens em massa via WhatsApp Cloud API</p>
                </div>
              </div>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nova Lista
              </Button>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{lists.length}</p>
                    <p className="text-xs text-muted-foreground">Listas criadas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Send className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Enviadas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">0%</p>
                    <p className="text-xs text-muted-foreground">Taxa de leitura</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Falhas</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="lists">
              <TabsList>
                <TabsTrigger value="lists">Listas</TabsTrigger>
                <TabsTrigger value="history">Histórico de envios</TabsTrigger>
              </TabsList>
              <TabsContent value="lists" className="space-y-3 mt-4">
                {lists.map(list => (
                  <Card key={list.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{list.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {list.contactIds.length} contatos · Criada em {new Date(list.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                        {list.lastUsedAt && (
                          <p className="text-xs text-muted-foreground">
                            Último envio: {new Date(list.lastUsedAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <Button size="sm" onClick={() => handleSend(list)}>
                        <Send className="h-4 w-4 mr-1" /> Enviar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <BroadcastHistory />
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <MobileNavigation />
      </div>

      <BroadcastListForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleCreateList}
        contacts={mockContacts}
      />

      {selectedList && (
        <BroadcastComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          listName={selectedList.name}
          contactCount={selectedList.contactIds.length}
          onSend={handleSendMessage}
        />
      )}
    </SidebarProvider>
  );
};

export default BroadcastLists;
