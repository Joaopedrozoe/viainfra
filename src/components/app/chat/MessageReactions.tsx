import { memo } from "react";
import { cn } from "@/lib/utils";
import { MessageReaction } from "./types";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type ReactionChipsProps = {
  reactions: MessageReaction[];
  isAgentMessage: boolean;
  onToggle?: (emoji: string) => void;
};

/** Chips agrupados por emoji, no padrão do WhatsApp */
export const ReactionChips = memo(({ reactions, isAgentMessage, onToggle }: ReactionChipsProps) => {
  if (!reactions.length) return null;

  const grouped = reactions.reduce<Record<string, MessageReaction[]>>((acc, reaction) => {
    acc[reaction.emoji] = acc[reaction.emoji] || [];
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  return (
    <div className={cn("flex flex-wrap gap-1 mt-1", isAgentMessage ? "justify-end" : "justify-start")}>
      {Object.entries(grouped).map(([emoji, items]) => {
        const mine = items.some((r) => r.reactorType === "agent");
        const names = items
          .map((r) => (r.reactorType === "agent" ? "Você" : r.reactorName || "Contato"))
          .join(", ");
        return (
          <button
            key={emoji}
            type="button"
            title={names}
            onClick={onToggle ? () => onToggle(emoji) : undefined}
            className={cn(
              "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition-colors bg-card",
              mine ? "border-primary/60 text-primary" : "border-border text-foreground",
              onToggle ? "hover:bg-muted cursor-pointer" : "cursor-default"
            )}
          >
            <span className="emoji-text leading-none">{emoji}</span>
            {items.length > 1 && <span className="tabular-nums">{items.length}</span>}
          </button>
        );
      })}
    </div>
  );
});
ReactionChips.displayName = "ReactionChips";

type ReactionPickerProps = {
  isAgentMessage: boolean;
  onSelect: (emoji: string) => void;
};

/** Botão discreto que aparece no hover da mensagem para reagir */
export const ReactionPicker = memo(({ isAgentMessage, onSelect }: ReactionPickerProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="Reagir à mensagem"
        className={cn(
          "absolute -bottom-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity",
          "rounded-full border border-border bg-card p-1 text-muted-foreground shadow-sm hover:text-foreground",
          isAgentMessage ? "-left-3" : "-right-3"
        )}
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-1" align={isAgentMessage ? "end" : "start"} side="top">
      <div className="flex gap-1">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="emoji-text rounded-full px-1.5 py-1 text-lg leading-none hover:bg-muted"
          >
            {emoji}
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
));
ReactionPicker.displayName = "ReactionPicker";
