import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

interface InstanceRow {
  id: string;
  instance_name: string;
  phone_number: string | null;
  connection_state: string | null;
  last_sync: string | null;
}

const STATE: Record<string, { label: string; cls: string; Icon: typeof CheckCircle }> = {
  open: { label: "Conectado", cls: "bg-primary/10 text-primary border-primary/20", Icon: CheckCircle },
  connecting: { label: "Conectando", cls: "bg-muted text-muted-foreground border-border", Icon: Clock },
};
const OFF = { label: "Desconectado", cls: "bg-destructive/10 text-destructive border-destructive/20", Icon: AlertTriangle };

export const ChannelHealthPanel: React.FC = () => {
  const { company } = useAuth();
  const [channels, setChannels] = useState<InstanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!company?.id) return;
      const companyId = company.id;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("id, instance_name, phone_number, connection_state, last_sync")
        .eq("company_id", companyId)
        .order("instance_name");
      if (cancelled) return;
      if (error) console.error("Error loading channels:", error);
      setChannels((data || []) as InstanceRow[]);
      setIsLoading(false);
    };
    load();
    window.addEventListener("dashboard-refresh", load);
    return () => { cancelled = true; window.removeEventListener("dashboard-refresh", load); };
  }, [company?.id]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Status dos Canais</CardTitle>
        <CardDescription>Números WhatsApp cadastrados nesta empresa</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="h-64 sm:h-80 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">Carregando...</div>
          ) : channels.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum canal configurado</div>
          ) : (
            channels.map((ch) => {
              const s = STATE[ch.connection_state || ""] || OFF;
              return (
                <div key={ch.id} className="flex items-center justify-between p-3 border rounded-lg gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <s.Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{ch.instance_name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        WhatsApp{ch.phone_number ? ` · ${ch.phone_number}` : ""}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${s.cls} text-xs whitespace-nowrap`}>{s.label}</Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
