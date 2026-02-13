
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallRecord as CallRecordType } from "@/types/calls";

const typeConfig = {
  incoming: { icon: PhoneIncoming, color: "text-green-600", label: "Recebida" },
  outgoing: { icon: PhoneOutgoing, color: "text-blue-600", label: "Realizada" },
  missed: { icon: PhoneMissed, color: "text-destructive", label: "Perdida" },
};

const formatDuration = (seconds: number) => {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

interface CallRecordItemProps {
  record: CallRecordType;
}

export const CallRecordItem = ({ record }: CallRecordItemProps) => {
  const cfg = typeConfig[record.type];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors">
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-full bg-muted", cfg.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{record.contactName}</p>
        <p className="text-xs text-muted-foreground">{record.phone}</p>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {record.callType === "video" ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
          <span>{cfg.label}</span>
        </div>
        <p className="text-xs text-muted-foreground">{formatDuration(record.duration)}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(record.startedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};
