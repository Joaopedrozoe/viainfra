import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { CallRecordItem } from "./CallRecord";
import { useCalls } from "@/hooks/useCalls";
import type { CallRecord } from "@/types/calls";

export const CallHistory = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const { calls, loading } = useCalls();

  const mapped: CallRecord[] = calls.map(c => ({
    id: c.id,
    contactId: c.contact_id ?? undefined,
    contactName: c.contact_name || c.phone,
    phone: c.phone,
    type: c.status === "missed" || c.status === "no_answer" ? "missed" : c.direction,
    status: c.status === "completed" ? "completed"
      : c.status === "missed" ? "missed"
      : c.status === "declined" ? "declined"
      : "no_answer",
    duration: c.duration || 0,
    startedAt: c.started_at,
    endedAt: c.ended_at || undefined,
    callType: c.call_type,
  }));

  const filtered = mapped.filter(c => {
    const matchSearch = c.contactName.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchFilter = filter === "all" || c.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar chamada..." className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="incoming">Recebidas</SelectItem>
            <SelectItem value="outgoing">Realizadas</SelectItem>
            <SelectItem value="missed">Perdidas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
          </div>
        )}
        {!loading && filtered.map(call => (
          <CallRecordItem key={call.id} record={call} />
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma chamada registrada</p>
        )}
      </div>
    </div>
  );
};
