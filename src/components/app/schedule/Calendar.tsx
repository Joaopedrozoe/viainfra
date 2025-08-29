
import { useState, useEffect } from "react";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { CalendarView, CalendarEvent } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, addWeeks, addMonths, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { mockEvents } from "./mockData";
import { cn } from "@/lib/utils";

interface CalendarProps {
  view: CalendarView;
  onDateSelect: (date: Date) => void;
}

export const Calendar = ({ view, onDateSelect }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });

  useEffect(() => {
    // In a real app, this would fetch events from an API
    setEvents(mockEvents);
  }, []);

  useEffect(() => {
    // Set the visible date range based on the current view
    let start: Date, end: Date;
    
    if (view === "day") {
      start = currentDate;
      end = currentDate;
    } else if (view === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }
    
    setVisibleRange({ start, end });
  }, [view, currentDate]);

  const handleNext = () => {
    if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handlePrevious = () => {
    if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Title formatting based on view
  const renderTitle = () => {
    if (view === "day") {
      return format(currentDate, "dd 'de' MMMM yyyy", { locale: ptBR });
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM/yyyy", { locale: ptBR })}`;
    } else {
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10 shadow-sm">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <CalendarIcon size={20} className="text-bonina" />
          {renderTitle()}
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToday}
            className={cn(
              "border-bonina/30 hover:bg-bonina/5",
              isToday(currentDate) && "bg-bonina/10 border-bonina text-bonina font-medium"
            )}
          >
            Hoje
          </Button>
          <div className="flex border rounded-md overflow-hidden">
            <Button variant="ghost" size="icon" onClick={handlePrevious} className="hover:bg-gray-50">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="hover:bg-gray-50">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-white">
        {view === "day" && (
          <DayView 
            date={currentDate} 
            events={events.filter(event => {
              const eventDate = new Date(event.start);
              return eventDate.toDateString() === currentDate.toDateString();
            })}
            onDateSelect={onDateSelect} 
          />
        )}
        
        {view === "week" && (
          <WeekView 
            date={currentDate} 
            events={events.filter(event => {
              const eventDate = new Date(event.start);
              const start = startOfWeek(currentDate, { weekStartsOn: 1 });
              const end = endOfWeek(currentDate, { weekStartsOn: 1 });
              return eventDate >= start && eventDate <= end;
            })}
            onDateSelect={onDateSelect} 
          />
        )}
        
        {view === "month" && (
          <MonthView 
            date={currentDate} 
            events={events} 
            onDateSelect={onDateSelect} 
          />
        )}
      </div>
    </div>
  );
};
