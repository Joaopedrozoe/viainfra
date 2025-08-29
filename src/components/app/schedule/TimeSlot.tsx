
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimeSlotProps {
  time: string;
  isAvailable: boolean;
  isSelected: boolean;
  onSelect: (time: string) => void;
}

export const TimeSlot = ({ time, isAvailable, isSelected, onSelect }: TimeSlotProps) => {
  return (
    <button
      className={cn(
        "py-2 px-3 text-sm rounded border transition-colors w-full relative flex items-center gap-2",
        isAvailable 
          ? "hover:bg-bonina/10 border-bonina/20" 
          : "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200",
        isSelected && "bg-bonina text-white hover:bg-bonina border-bonina"
      )}
      disabled={!isAvailable}
      onClick={() => isAvailable && onSelect(time)}
    >
      <Clock size={14} className={cn(isSelected ? "text-white" : "text-bonina")} />
      <span>{time}</span>
    </button>
  );
};
