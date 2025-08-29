
import { useRef, useEffect, useState } from "react";
import { format, addDays, startOfWeek, parseISO, isSameDay, differenceInMinutes, startOfDay, isToday, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/types/calendar";
import { EventBlock } from "./EventBlock";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
}

export const WeekView = ({ date, events, onDateSelect }: WeekViewProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday as first day
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Update current time position
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const dayStart = startOfDay(now);
      const minutesSinceDayStart = differenceInMinutes(now, dayStart);
      const position = (minutesSinceDayStart / 60) * 6; // 6rem per hour
      setCurrentTimePosition(position);
    };
    
    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, []);
  
  // Scroll to current time or business hours when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      let scrollToPosition: number;
      
      if (days.some(day => isToday(day))) {
        // If today is in the current week, scroll to current time with context
        const now = new Date();
        const hour = Math.max(now.getHours() - 2, 0);
        scrollToPosition = hour * 96; // 96px per hour (6rem = 96px)
      } else {
        // Default to business hours (8 AM) for other weeks
        scrollToPosition = 8 * 96;
      }
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [date, days]);
  
  const handleCellClick = (day: Date, hour: number) => {
    const selectedDate = new Date(day);
    selectedDate.setHours(hour, 0, 0, 0);
    onDateSelect(selectedDate);
  };
  
  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start);
      return eventStart.getHours() === hour && isSameDay(eventStart, day);
    });
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    
    // Calculate top position based on time
    const dayStart = startOfDay(eventStart);
    const minutesFromDayStart = differenceInMinutes(eventStart, dayStart);
    const top = (minutesFromDayStart % 60) / 60 * 6; // 6rem per hour
    
    // Calculate height based on duration
    const durationMinutes = differenceInMinutes(eventEnd, eventStart);
    const height = (durationMinutes / 60) * 6; // 6rem per hour
    
    return { top: `${top}rem`, height: `${height}rem` };
  };

  const formatHourLabel = (hour: number) => {
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  };

  const getDayAbbreviation = (day: Date) => {
    const weekdayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return weekdayNames[day.getDay()];
  };

  const isWeekend = (day: Date) => {
    return day.getDay() === 0 || day.getDay() === 6; // 0 = Sunday, 6 = Saturday
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b sticky top-0 bg-white z-10 shadow-sm">
        <div className="border-r border-gray-200 bg-gray-50"></div>
        {days.map((day, index) => {
          const isCurrentDay = isToday(day);
          const isSameMonthAsCurrentDate = isSameMonth(day, date);
          
          return (
            <div 
              key={index} 
              className={cn(
                "p-2 text-center border-r border-gray-200",
                isCurrentDay && "bg-bonina/10",
                isWeekend(day) && "bg-blue-50/30",
                !isSameMonthAsCurrentDate && "text-gray-400"
              )}
            >
              <div className="text-xs uppercase">{getDayAbbreviation(day)}</div>
              <div className={cn(
                "flex items-center justify-center mt-1",
                isCurrentDay ? "bg-bonina text-white rounded-full w-7 h-7" : "font-medium"
              )}>
                {format(day, 'd', { locale: ptBR })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Time grid */}
      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        <div className="min-h-[2304px]">{/* 24 hours * 96px per hour */}
          <div className="grid grid-cols-[4rem_repeat(7,1fr)]">
            {/* Time labels */}
            <div className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200">
              {hours.map(hour => (
                <div key={hour} className="h-24 relative">
                  <div className="absolute -top-3 right-2 text-xs text-gray-500 font-medium">
                    {formatHourLabel(hour)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className={cn(
                "relative",
                isWeekend(day) && "bg-blue-50/10"
              )}>
                {hours.map((hour, hourIndex) => {
                  const isCurrentHour = isToday(day) && new Date().getHours() === hour;
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  
                  return (
                    <div 
                      key={`${dayIndex}-${hourIndex}`}
                      className={cn(
                        "h-24 border-b border-r border-gray-200 relative hover:bg-gray-50 transition-colors",
                        isCurrentHour && "bg-blue-50/30"
                      )}
                      onClick={() => handleCellClick(day, hour)}
                    >
                      {/* Half-hour marker */}
                      <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-200" />
                      
                      {/* Events */}
                      {dayEvents.map(event => {
                        const { top, height } = calculateEventPosition(event);
                        
                        return (
                          <EventBlock
                            key={event.id}
                            event={event}
                            style={{ top, height }}
                            isDraggable
                          />
                        );
                      })}
                    </div>
                  );
                })}
                
                {/* Current time indicator */}
                {isToday(day) && (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${currentTimePosition}rem` }}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-md animate-pulse ml-[-6px]" />
                      <div className="h-[2px] flex-1 bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
