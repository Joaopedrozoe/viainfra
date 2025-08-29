
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export const IntegrationsTab = () => {
  const [googleConnected, setGoogleConnected] = useState(false);
  
  // Toggle Google connection
  const handleGoogleConnect = () => {
    if (googleConnected) {
      setGoogleConnected(false);
      toast.success("Conta Google desconectada");
    } else {
      // In a real app, this would trigger OAuth flow
      setTimeout(() => {
        setGoogleConnected(true);
        toast.success("Conta Google conectada com sucesso");
      }, 1000);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Sincronize eventos com sua conta do Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border p-4 rounded-md">
            <div className="space-y-0.5">
              <h4 className="font-medium">Status de Conexão</h4>
              <p className="text-sm text-muted-foreground">
                {googleConnected ? "Conectado" : "Desconectado"}
              </p>
            </div>
            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
              {googleConnected ? (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-green-500">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-red-500">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Opções de Sincronização</h4>
            <div className="flex items-center space-x-2">
              <Switch id="sync-to-google" checked={googleConnected} disabled={!googleConnected} />
              <Label htmlFor="sync-to-google">Enviar eventos para o Google Calendar</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="sync-from-google" checked={googleConnected} disabled={!googleConnected} />
              <Label htmlFor="sync-from-google">Importar eventos do Google Calendar</Label>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              Procurando por mais integrações? Visite nossa página de integrações para ver todas as opções disponíveis.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild size="sm">
                <Link to="/integrations">
                  Ver Todas as Integrações
                </Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link to="/api-docs" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Documentação da API
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pb-6 md:pb-4">
          <Button onClick={handleGoogleConnect} className={googleConnected ? "bg-red-600 hover:bg-red-700" : "bg-bonina hover:bg-bonina/90"}>
            {googleConnected ? "Desconectar Conta" : "Conectar Conta Google"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
