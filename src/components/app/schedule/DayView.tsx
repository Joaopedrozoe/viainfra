import { useState, useRef, useEffect } from "react";
import { format, addMinutes, isSameDay, parseISO, differenceInMinutes, startOfDay, isToday, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "@/types/calendar";
import { EventBlock } from "./EventBlock";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimeSlot } from "./TimeSlot";

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
}

export const DayView = ({ date, events, onDateSelect }: DayViewProps) => {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  
  // Only show 24 hours (0-23), nothing beyond that
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Update current time position
  useEffect(() => {
    if (isToday(date)) {
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
    }
  }, [date]);
  
  // Scroll to current time or business hours when component mounts or date changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      let scrollToPosition: number;
      
      if (isToday(date)) {
        // If today, scroll to current time with context (show 2 hours before)
        const now = new Date();
        const hour = Math.max(now.getHours() - 2, 0);
        scrollToPosition = 48 + 16 + (hour * 96); // Header height + padding + hour position
      } else {
        // Default to business hours (8 AM) for other days
        scrollToPosition = 48 + 16 + (8 * 96); // Header height + padding + 8 AM position
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
  }, [date]);
  
  const handleHourClick = (hour: number) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(hour, 0, 0, 0);
    onDateSelect(selectedDate);
  };

  // Ultra strict filtering - absolutely no events outside 0-23 hours
  const getDayEvents = () => {
    return events.filter(event => {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      
      // Must be exactly on the selected date
      if (!isSameDay(eventStart, date)) return false;
      
      // Must start within valid hours (0-23)
      if (eventStart.getHours() < 0 || eventStart.getHours() > 23) return false;
      
      // Must not extend beyond the day
      if (eventEnd > new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)) return false;
      
      return true;
    });
  };

  const eventsByHour = hours.map(hour => {
    return getDayEvents().filter(event => {
      const eventStart = parseISO(event.start);
      return eventStart.getHours() === hour;
    });
  });

  const calculateEventPosition = (event: CalendarEvent) => {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    
    // Only calculate position if event is on the current date
    if (!isSameDay(eventStart, date)) {
      return { top: '0rem', height: '0rem' };
    }
    
    // Ensure event doesn't extend beyond 23:59
    const maxEndTime = new Date(date);
    maxEndTime.setHours(23, 59, 59, 999);
    const actualEventEnd = eventEnd > maxEndTime ? maxEndTime : eventEnd;
    
    // Calculate top position based on time
    const dayStart = startOfDay(eventStart);
    const minutesFromDayStart = differenceInMinutes(eventStart, dayStart);
    const top = (minutesFromDayStart / 60) * 6; // 6rem per hour
    
    // Calculate height based on duration (capped to end of day)
    const durationMinutes = differenceInMinutes(actualEventEnd, eventStart);
    const height = Math.max((durationMinutes / 60) * 6, 0.5); // Minimum 0.5rem height
    
    return { top: `${top}rem`, height: `${height}rem` };
  };

  const formatHourLabel = (hour: number) => {
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 relative">
        <div className="h-full max-h-[calc(100vh-230px)] overflow-auto" ref={scrollContainerRef}>
          {/* Header space with date info */}
          <div className="sticky top-0 z-30 bg-gradient-to-b from-gray-50 to-transparent h-12 flex items-center justify-center border-b border-gray-100">
            <div className="text-sm text-gray-600 font-medium">
              {format(date, "EEEE", { locale: ptBR })}
            </div>
          </div>
          
          {/* Exactly 24 hours grid with padding top to show 00:00 */}
          <div className="h-[2304px] relative overflow-hidden pt-4">{/* 24 hours * 96px = 2304px exactly + padding */}
            <div className="grid grid-cols-[4rem_1fr] relative">
              {/* Time labels - exactly 24 hours */}
              <div className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 h-full">
                {hours.map(hour => (
                  <div key={hour} className="h-24 relative">
                    <div className="absolute -top-2 right-2 text-xs text-gray-500 font-medium">
                      {formatHourLabel(hour)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Main grid - capped at 24 hours */}
              <div className="h-full overflow-hidden">
                {hours.map(hour => {
                  const hourEvents = eventsByHour[hour];
                  const isCurrentHour = isToday(date) && new Date().getHours() === hour;
                  
                  return (
                    <div 
                      key={hour} 
                      className={cn(
                        "h-24 border-b border-gray-200 relative hover:bg-gray-50 transition-colors",
                        isCurrentHour && "bg-blue-50/30"
                      )}
                      onClick={() => handleHourClick(hour)}
                    >
                      {/* Half-hour marker */}
                      <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-200" />
                      
                      {/* Events - final validation */}
                      {hourEvents.map(event => {
                        const eventStart = parseISO(event.start);
                        
                        // Final checks before rendering
                        if (!isSameDay(eventStart, date)) return null;
                        if (eventStart.getHours() !== hour) return null;
                        if (hour > 23 || hour < 0) return null;
                        
                        const { top, height } = calculateEventPosition(event);
                        
                        return (
                          <EventBlock
                            key={event.id}
                            event={event}
                            style={{ top, height }}
                            isDraggable
                            onDragStart={() => setDraggedEvent(event)}
                            onDragEnd={() => setDraggedEvent(null)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
                
                {/* Current time indicator - only for today and within bounds */}
                {isToday(date) && (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ 
                      top: `${Math.min(currentTimePosition, 144)}rem`, // Cap at 24 hours
                      display: currentTimePosition > 144 ? 'none' : 'block' 
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-md animate-pulse ml-[-6px]" />
                      <div className="h-[2px] flex-1 bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};