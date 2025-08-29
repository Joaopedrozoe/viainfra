
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Message } from "./types";

type MessageItemProps = {
  message: Message;
};

export const MessageItem = memo(({ message }: MessageItemProps) => {
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
            ? "bg-bonina text-white rounded-tr-none"
            : "bg-white border border-gray-200 rounded-tl-none"
        )}
      >
        <div>{message.content}</div>
        <div className={cn(
          "text-xs mt-1 text-right",
          message.sender === "agent" ? "text-white/70" : "text-gray-500"
        )}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";
