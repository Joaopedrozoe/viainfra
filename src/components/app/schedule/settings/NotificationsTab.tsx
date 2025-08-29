
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { NotificationSettings } from "@/types/calendar";

export const NotificationsTab = () => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    whatsapp: true,
    email: true,
    sms: false,
    reminderMinutes: 15
  });
  
  // Save notification settings
  const saveNotificationSettings = () => {
    toast.success("Configurações de notificação salvas com sucesso");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações de Agenda</CardTitle>
        <CardDescription>
          Configurações de lembretes e notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Canais de Notificação</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-email">Notificação por E-mail</Label>
              <Switch 
                id="notify-email" 
                checked={notificationSettings.email} 
                onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email: checked }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-whatsapp">Notificação por WhatsApp</Label>
              <Switch 
                id="notify-whatsapp" 
                checked={notificationSettings.whatsapp} 
                onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, whatsapp: checked }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-sms">Notificação por SMS</Label>
              <Switch 
                id="notify-sms" 
                checked={notificationSettings.sms} 
                onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, sms: checked }))} 
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Tempo de Antecedência</h4>
          <Select 
            value={notificationSettings.reminderMinutes.toString()} 
            onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, reminderMinutes: Number(value) as any }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tempo de antecedência" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-full min-w-[240px]">
              <SelectItem value="5">5 minutos antes</SelectItem>
              <SelectItem value="10">10 minutos antes</SelectItem>
              <SelectItem value="15">15 minutos antes</SelectItem>
              <SelectItem value="30">30 minutos antes</SelectItem>
              <SelectItem value="60">1 hora antes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="pb-6 md:pb-4">
        <Button onClick={saveNotificationSettings} className="bg-bonina hover:bg-bonina/90">
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
};
