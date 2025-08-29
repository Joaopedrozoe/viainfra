
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CalendarEvent, EventChannel, ReminderTime } from "@/types/calendar";
import { cn } from "@/lib/utils";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  defaultDate?: Date;
}

export const EventModal = ({ isOpen, onClose, event, defaultDate }: EventModalProps) => {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultDate || new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(defaultDate ? new Date(defaultDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [channel, setChannel] = useState<EventChannel>("Interno");
  const [description, setDescription] = useState("");
  const [reminder, setReminder] = useState<ReminderTime>(15);

  // Reset form or populate with event data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        const start = new Date(event.start);
        const end = new Date(event.end);
        
        setTitle(event.title);
        setStartDate(start);
        setEndDate(end);
        setStartTime(format(start, 'HH:mm'));
        setEndTime(format(end, 'HH:mm'));
        setChannel(event.channel);
        setDescription(event.description || "");
        setReminder(event.reminderMinutes);
      } else {
        // Default values for new event
        setTitle("");
        setStartDate(defaultDate || new Date());
        setEndDate(defaultDate ? new Date(defaultDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000));
        setStartTime("09:00");
        setEndTime("10:00");
        setChannel("Interno");
        setDescription("");
        setReminder(15);
      }
    }
  }, [isOpen, event, defaultDate]);

  const handleSubmit = () => {
    // Validate form
    if (!title) {
      toast.error("Digite o título do evento");
      return;
    }
    
    if (!startDate || !endDate) {
      toast.error("Selecione as datas de início e fim");
      return;
    }
    
    // Create start and end date objects with the selected times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const combinedStartDate = new Date(startDate);
    combinedStartDate.setHours(startHours, startMinutes);
    
    const combinedEndDate = new Date(endDate);
    combinedEndDate.setHours(endHours, endMinutes);
    
    // Validate that end time is after start time
    if (combinedEndDate <= combinedStartDate) {
      toast.error("O horário de fim deve ser após o horário de início");
      return;
    }
    
    // Create new event or update existing
    const updatedEvent: Partial<CalendarEvent> = {
      title,
      start: combinedStartDate.toISOString(),
      end: combinedEndDate.toISOString(),
      channel,
      description,
      reminderMinutes: reminder,
      status: "confirmed"
    };
    
    toast.success(event ? "Evento atualizado com sucesso!" : "Evento criado com sucesso!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{event ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título*</Label>
              <Input
                id="title"
                placeholder="Digite o título do evento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal w-full",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Horário de Início*</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    className="pl-10"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Fim*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal w-full",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Horário de Fim*</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    className="pl-10"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Canal*</Label>
              <Select value={channel} onValueChange={(value) => setChannel(value as EventChannel)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interno">Interno</SelectItem>
                  <SelectItem value="Videochamada">Videochamada</SelectItem>
                  <SelectItem value="Telefone">Telefone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Lembrete</Label>
              <Select
                value={reminder.toString()}
                onValueChange={(value) => setReminder(Number(value) as ReminderTime)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lembrete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutos antes</SelectItem>
                  <SelectItem value="10">10 minutos antes</SelectItem>
                  <SelectItem value="15">15 minutos antes</SelectItem>
                  <SelectItem value="30">30 minutos antes</SelectItem>
                  <SelectItem value="60">1 hora antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Adicione detalhes sobre o evento"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-bonina hover:bg-bonina/90" onClick={handleSubmit}>
            {event ? "Atualizar Evento" : "Criar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
