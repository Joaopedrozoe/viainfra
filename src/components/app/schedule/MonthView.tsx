
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
}

export const MonthView = ({ date, events, onDateSelect }: MonthViewProps) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const generateCalendarDays = () => {
    const days = [];
    let day = calendarStart;
    
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start);
      return isSameDay(eventStart, day);
    });
  };
  
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day of week header */}
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dayName, i) => (
          <div key={i} className="p-2 text-sm font-medium text-center bg-white">
            {dayName}
          </div>
        ))}
        
        {/* Calendar grid */}
        {calendarDays.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, date);
          
          return (
            <div 
              key={i} 
              className={cn(
                "min-h-[100px] p-1 bg-white border border-gray-100",
                !isCurrentMonth && "bg-gray-50 text-gray-500"
              )}
              onClick={() => onDateSelect(day)}
            >
              <div className="text-right text-sm p-1">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1 rounded truncate",
                      event.color ? `bg-${event.color}-100` : "bg-blue-100"
                    )}
                  >
                    {format(parseISO(event.start), 'HH:mm')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    + {dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
