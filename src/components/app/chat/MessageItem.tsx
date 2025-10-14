
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Message } from "./types";
import { format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns";
import { ptBR } from "date-fns/locale";

type MessageItemProps = {
  message: Message;
};

const formatMessageTimestamp = (dateString: string) => {
  const date = new Date(dateString);
  const time = format(date, "HH:mm", { locale: ptBR });
  
  // Sempre incluir a data
  if (isThisYear(date)) {
    // Este ano: "dd/MM, HH:mm"
    return format(date, "dd/MM, HH:mm", { locale: ptBR });
  }
  
  // Outros anos: "dd/MM/yyyy, HH:mm"
  return format(date, "dd/MM/yyyy, HH:mm", { locale: ptBR });
};

export const MessageItem = memo(({ message }: MessageItemProps) => {
  const formattedTimestamp = formatMessageTimestamp(message.timestamp);
  
  return (
    <div
      className={cn(
        "flex",
        message.sender === "agent" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] p-3 rounded-lg",
          message.sender === "agent"
            ? "bg-viainfra-primary text-white rounded-tr-none"
            : "bg-white border border-gray-200 rounded-tl-none"
        )}
      >
        <div>{message.content}</div>
        <div className={cn(
          "text-xs mt-1 text-right",
          message.sender === "agent" ? "text-white/70" : "text-gray-500"
        )}>
          {formattedTimestamp}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";
