
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookingSettings, WeekDay } from "@/types/calendar";
import { Copy, CopyCheck } from "lucide-react";

export const BookingPageTab = () => {
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    availableDays: [],
    startTime: "09:00",
    endTime: "18:00",
    defaultDuration: 30,
    minInterval: 15
  });
  
  const [bookingUrl, setBookingUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  // Toggle day selection
  const handleDayToggle = (day: WeekDay) => {
    setBookingSettings(prev => {
      if (prev.availableDays.includes(day)) {
        return {
          ...prev,
          availableDays: prev.availableDays.filter(d => d !== day)
        };
      } else {
        return {
          ...prev,
          availableDays: [...prev.availableDays, day]
        };
      }
    });
  };
  
  // Save booking settings
  const saveBookingSettings = () => {
    toast.success("Configurações de página de agendamento salvas com sucesso");
  };
  
  // Copy booking link to clipboard
  const handleCopyLink = () => {
    const fullUrl = `viainfra.com/agendar/${bookingUrl}`;
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setIsCopied(true);
        toast.success("Link de agendamento copiado!");
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Falha ao copiar o link");
      });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Página de Agendamento</CardTitle>
        <CardDescription>
          Configure sua página pública de agendamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Disponibilidade</h4>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="day-monday" 
                checked={bookingSettings.availableDays.includes("monday")} 
                onCheckedChange={() => handleDayToggle("monday")} 
              />
              <label htmlFor="day-monday">Segunda</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="day-tuesday" 
                checked={bookingSettings.availableDays.includes("tuesday")} 
                onCheckedChange={() => handleDayToggle("tuesday")} 
              />
              <label htmlFor="day-tuesday">Terça</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="day-wednesday" 
                checked={bookingSettings.availableDays.includes("wednesday")} 
                onCheckedChange={() => handleDayToggle("wednesday")} 
              />
              <label htmlFor="day-wednesday">Quarta</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="day-thursday" 
                checked={bookingSettings.availableDays.includes("thursday")} 
                onCheckedChange={() => handleDayToggle("thursday")} 
              />
              <label htmlFor="day-thursday">Quinta</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="day-friday" 
                checked={bookingSettings.availableDays.includes("friday")} 
                onCheckedChange={() => handleDayToggle("friday")} 
              />
              <label htmlFor="day-friday">Sexta</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="day-saturday" 
                checked={bookingSettings.availableDays.includes("saturday")} 
                onCheckedChange={() => handleDayToggle("saturday")} 
              />
              <label htmlFor="day-saturday">Sábado</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="day-sunday" 
                checked={bookingSettings.availableDays.includes("sunday")} 
                onCheckedChange={() => handleDayToggle("sunday")} 
              />
              <label htmlFor="day-sunday">Domingo</label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Horário de Início</Label>
            <Input 
              id="start-time" 
              type="time" 
              value={bookingSettings.startTime} 
              onChange={(e) => setBookingSettings(prev => ({ ...prev, startTime: e.target.value }))} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Horário de Fim</Label>
            <Input 
              id="end-time" 
              type="time" 
              value={bookingSettings.endTime} 
              onChange={(e) => setBookingSettings(prev => ({ ...prev, endTime: e.target.value }))} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="session-duration">Duração da Sessão</Label>
            <Select 
              value={bookingSettings.defaultDuration.toString()} 
              onValueChange={(value) => setBookingSettings(prev => ({ ...prev, defaultDuration: Number(value) as any }))} 
            >
              <SelectTrigger id="session-duration">
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-full min-w-[240px]">
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">60 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="min-interval">Intervalo Mínimo</Label>
            <Select 
              value={bookingSettings.minInterval.toString()} 
              onValueChange={(value) => setBookingSettings(prev => ({ ...prev, minInterval: Number(value) }))} 
            >
              <SelectTrigger id="min-interval">
                <SelectValue placeholder="Selecione o intervalo" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-full min-w-[240px]">
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">60 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="booking-url">URL de Agendamento</Label>
          <div className="flex items-center">
            <span className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 text-gray-500">
              viainfra.com/agendar/
            </span>
            <Input 
              id="booking-url" 
              placeholder="sua-empresa" 
              className="rounded-l-none rounded-r-none border-r-0" 
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
            />
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-l-none h-10 px-3"
              onClick={handleCopyLink}
            >
              {isCopied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Este é o link que você compartilhará com seus clientes para agendamento
          </p>
        </div>
      </CardContent>
      <CardFooter className="pb-6 md:pb-4">
        <Button onClick={saveBookingSettings} className="bg-viainfra-primary hover:bg-viainfra-primary/90">
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
};
