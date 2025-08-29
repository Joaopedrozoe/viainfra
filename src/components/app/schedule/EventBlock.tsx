
import { useState, useRef } from "react";
import { CalendarEvent } from "@/types/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Clock, VideoIcon, Phone, Users, Cloud } from "lucide-react";

interface EventBlockProps {
  event: CalendarEvent;
  style?: React.CSSProperties;
  isDraggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
}

export const EventBlock = ({ event, style, isDraggable = false, onDragStart, onDragEnd, onClick }: EventBlockProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragResizing, setIsDragResizing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  // Determine color and icon based on channel
  const getEventStyles = () => {
    switch (event.channel) {
      case "Interno": 
        return {
          bgColor: "bg-blue-50 hover:bg-blue-100",
          borderColor: "border-l-4 border-blue-400",
          textColor: "text-blue-800",
          icon: <Users size={12} className="text-blue-600" />
        };
      case "Videochamada": 
        return {
          bgColor: "bg-green-50 hover:bg-green-100",
          borderColor: "border-l-4 border-green-400",
          textColor: "text-green-800",
          icon: <VideoIcon size={12} className="text-green-600" />
        };
      case "Telefone": 
        return {
          bgColor: "bg-orange-50 hover:bg-orange-100",
          borderColor: "border-l-4 border-orange-400",
          textColor: "text-orange-800",
          icon: <Phone size={12} className="text-orange-600" />
        };
      default: 
        return {
          bgColor: "bg-gray-50 hover:bg-gray-100",
          borderColor: "border-l-4 border-gray-400",
          textColor: "text-gray-800",
          icon: <Clock size={12} className="text-gray-600" />
        };
    }
  };

  const { bgColor, borderColor, textColor, icon } = getEventStyles();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
    setIsDragging(true);
    if (onDragStart) onDragStart();
    // Set data for drag operation
    e.dataTransfer.setData("text/plain", event.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute w-[calc(100%-4px)] left-0.5 p-1.5 rounded overflow-hidden cursor-pointer transition-colors shadow-sm",
        bgColor,
        borderColor,
        textColor,
        isDragging && "opacity-50 shadow-md",
        isDragResizing && "resize-y"
      )}
      style={style}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{format(parseISO(event.start), 'HH:mm')}</span>
        <div className="flex items-center gap-1">
          {icon}
          {event.isFromGoogle && <Cloud size={12} />}
        </div>
      </div>
      <div className="truncate text-xs font-semibold mt-0.5">{event.title}</div>
      
      {/* Drag handle for resizing */}
      {isDraggable && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-gray-400"
          onMouseDown={() => setIsDragResizing(true)}
          onMouseUp={() => setIsDragResizing(false)}
        ></div>
      )}
    </div>
  );
};
