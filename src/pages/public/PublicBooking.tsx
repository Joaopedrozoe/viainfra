
import { useState } from "react";
import { format, addDays, parseISO, isWithinInterval, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlot } from "@/components/app/schedule/TimeSlot";
import { toast } from "sonner";

const PublicBooking = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  
  // Mock company data - in real app this would come from API based on :companyId param
  const company = {
    name: "Empresa S.A.",
    logo: "/placeholder.svg",
    bookingSettings: {
      availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "09:00",
      endTime: "18:00",
      defaultDuration: 30,
      minInterval: 15
    },
    occupiedSlots: [
      // Mock occupied slots - in real app these would come from API
      { date: new Date().toISOString(), time: "10:00" },
      { date: new Date().toISOString(), time: "14:30" },
      { date: addDays(new Date(), 1).toISOString(), time: "11:00" },
    ]
  };

  // Generate time slots based on company settings
  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    
    const slots = [];
    const [startHour, startMinute] = company.bookingSettings.startTime.split(":").map(Number);
    const [endHour, endMinute] = company.bookingSettings.endTime.split(":").map(Number);
    
    let currentTime = new Date(selectedDate);
    currentTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    while (currentTime < endTime) {
      const timeSlot = format(currentTime, "HH:mm");
      
      // Check if slot is available
      const isOccupied = company.occupiedSlots.some(
        slot => 
          format(parseISO(slot.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") && 
          slot.time === timeSlot
      );
      
      slots.push({
        time: timeSlot,
        isAvailable: !isOccupied
      });
      
      // Add interval based on settings
      currentTime = addMinutes(currentTime, company.bookingSettings.minInterval);
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Handle slot selection
  const handleSlotSelect = (time: string) => {
    setSelectedSlot(time);
  };
  
  // Handle booking submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedSlot) {
      toast.error("Selecione uma data e horário");
      return;
    }
    
    if (!name || !email || !phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsBooked(true);
      toast.success("Agendamento realizado com sucesso!");
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <img src="/placeholder.svg" alt="Company Logo" className="h-10 mr-2" />
          <h1 className="text-2xl font-bold">{company.name}</h1>
        </div>
        
        {isBooked ? (
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Agendamento Confirmado!</CardTitle>
              <CardDescription>
                Obrigado por agendar sua reunião com {company.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                <p className="text-center text-green-700">
                  Seu agendamento para {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedSlot} foi confirmado.
                </p>
              </div>
              <p className="text-center text-sm text-gray-500">
                Um email de confirmação foi enviado para {email}.<br />
                Você receberá um lembrete antes do horário marcado.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => window.location.reload()}>
                Fazer outro agendamento
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar column */}
            <Card>
              <CardHeader>
                <CardTitle>Selecione uma data</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="p-3 pointer-events-auto"
                  disabled={(date) => {
                    // Disable dates in the past
                    if (date < new Date()) return true;
                    
                    // Disable dates based on available days
                    const dayOfWeek = format(date, "EEEE", { locale: ptBR }).toLowerCase();
                    return !company.bookingSettings.availableDays.includes(dayOfWeek as any);
                  }}
                />
                
                {selectedDate && (
                  <div className="w-full mt-6">
                    <h3 className="text-sm font-medium mb-2">Horários disponíveis:</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot, index) => (
                        <TimeSlot
                          key={index}
                          time={slot.time}
                          isAvailable={slot.isAvailable}
                          isSelected={selectedSlot === slot.time}
                          onSelect={handleSlotSelect}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Form column */}
            <Card>
              <CardHeader>
                <CardTitle>Seus dados</CardTitle>
                <CardDescription>Preencha as informações para confirmar seu agendamento</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo*</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail*</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone*</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem (opcional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Informe detalhes adicionais sobre o motivo do agendamento..."
                    />
                  </div>
                  
                  {selectedDate && selectedSlot && (
                    <div className="p-3 bg-gray-50 border rounded-md text-sm">
                      <p>Você está agendando para:</p>
                      <p className="font-medium">
                        {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} 
                        às {selectedSlot}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-bonina hover:bg-bonina/90" 
                    disabled={!selectedDate || !selectedSlot || isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Confirmar Agendamento"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;
