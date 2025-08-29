import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Widget = () => {
  const [widgetTitle, setWidgetTitle] = useState("Chat de Atendimento");
  const [widgetColor, setWidgetColor] = useState("#B10B28");
  const [welcomeMessage, setWelcomeMessage] = useState("Olá! Como posso ajudar?");
  const [showPreviewBubble, setShowPreviewBubble] = useState(true);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const companyId = "empresa-123"; // In a real app, this would be the actual company ID
  
  const handleCopyCode = () => {
    const code = `<script src="https://zoe-chat.com/widget.js" data-company-id="${companyId}"></script>`;
    navigator.clipboard.writeText(code);
    
    toast({
      title: "Código copiado!",
      description: "O código do widget foi copiado para a área de transferência."
    });
  };
  
  const handleSaveSettings = () => {
    // In a real app, this would save the settings to the backend
    toast({
      title: "Configurações salvas!",
      description: "As configurações do widget foram atualizadas com sucesso."
    });
  };
  
  return (
    <div className="h-full">
      <main className="h-full overflow-auto">
      <div className={cn(
        "flex-1 p-4 pb-16 overflow-y-auto", 
        isMobile ? "w-full" : ""
      )}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Widget para Site</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Widget</CardTitle>
                  <CardDescription>
                    Personalize a aparência e o comportamento do widget de chat para seu site.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="appearance">
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="appearance">Aparência</TabsTrigger>
                      <TabsTrigger value="behavior">Comportamento</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="appearance" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="widget-title">Título do Chat</Label>
                        <Input
                          id="widget-title"
                          value={widgetTitle}
                          onChange={(e) => setWidgetTitle(e.target.value)}
                          maxLength={30}
                          aria-label="Título do Chat"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="widget-color">Cor Principal</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="widget-color"
                            type="color"
                            value={widgetColor}
                            onChange={(e) => setWidgetColor(e.target.value)}
                            className="w-12 p-1 h-10"
                            aria-label="Cor Principal"
                          />
                          <Input
                            type="text"
                            value={widgetColor}
                            onChange={(e) => setWidgetColor(e.target.value)}
                            className="flex-1"
                            placeholder="#B10B28"
                            aria-label="Código Hex da Cor"
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="behavior" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="welcome-message">Mensagem Inicial</Label>
                        <Textarea
                          id="welcome-message"
                          value={welcomeMessage}
                          onChange={(e) => setWelcomeMessage(e.target.value)}
                          rows={3}
                          aria-label="Mensagem Inicial"
                        />
                        <p className="text-xs text-gray-500">
                          Esta mensagem será exibida quando o usuário abrir o chat pela primeira vez.
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id="show-bubble"
                          checked={showPreviewBubble}
                          onChange={(e) => setShowPreviewBubble(e.target.checked)}
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="show-bubble">Mostrar bolha de visualização</Label>
                          <p className="text-xs text-gray-500">
                            Exibe uma prévia da mensagem inicial antes do usuário abrir o chat.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveSettings}
                    className="bg-bonina hover:bg-bonina/90 w-full md:w-auto"
                  >
                    Salvar Configurações
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Código de Incorporação</CardTitle>
                  <CardDescription>
                    Adicione este código antes do fechamento da tag {"</body>"} em todas as páginas do seu site.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-md border font-mono text-sm overflow-x-auto">
                    {`<script src="https://zoe-chat.com/widget.js" data-company-id="${companyId}"></script>`}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleCopyCode}
                    variant="outline"
                    className="w-full md:w-auto"
                  >
                    Copiar Código
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="h-auto">
                <CardHeader>
                  <CardTitle>Visualização</CardTitle>
                  <CardDescription>
                    Veja como o widget ficará em seu site.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="relative w-64 h-[500px] border rounded-lg overflow-hidden bg-gray-50">
                    {/* Mock website */}
                    <div className="h-10 bg-gray-200 flex items-center px-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="p-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-2 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-2 bg-gray-300 rounded w-4/5 mb-4"></div>
                      <div className="h-20 bg-gray-300 rounded w-full mb-4"></div>
                      <div className="h-2 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-2 bg-gray-300 rounded w-full mb-1"></div>
                    </div>
                    
                    {/* Chat widget bubble */}
                    <div className="absolute bottom-4 right-4 flex flex-col items-end">
                      {showPreviewBubble && (
                        <div className="mb-2 bg-white rounded-lg shadow-lg p-3 max-w-[200px]">
                          <p className="text-sm">{welcomeMessage}</p>
                          <div className="absolute bottom-2 right-[-5px] w-3 h-3 bg-white transform rotate-45"></div>
                        </div>
                      )}
                      <button 
                        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: widgetColor }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Expanded chat mockup */}
                    <div className="absolute bottom-20 right-4 w-60 h-80 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden border">
                      <div className="p-3 text-white text-left" style={{ backgroundColor: widgetColor }}>
                        {widgetTitle}
                      </div>
                      <div className="flex-1 p-3 flex flex-col space-y-2 overflow-auto">
                        <div className="bg-gray-100 p-2 rounded-lg text-left text-sm">
                          <p>{welcomeMessage}</p>
                          <span className="text-xs text-gray-500 block mt-1">09:30</span>
                        </div>
                      </div>
                      <div className="p-3 border-t">
                        <div className="flex">
                          <input className="flex-1 border rounded-l-lg p-2 text-sm" placeholder="Digite uma mensagem..." />
                          <button 
                            className="px-3 text-white rounded-r-lg"
                            style={{ backgroundColor: widgetColor }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 2L11 13"></path>
                              <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Widget;
