
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { CallRecordItem } from "./CallRecord";
import type { CallRecord } from "@/types/calls";

const mockCalls: CallRecord[] = [
  { id: "1", contactName: "João Silva", phone: "+5511999887766", type: "incoming", status: "completed", duration: 185, startedAt: "2026-02-13T10:30:00Z", callType: "voice" },
  { id: "2", contactName: "Maria Santos", phone: "+5511988776655", type: "outgoing", status: "completed", duration: 42, startedAt: "2026-02-13T09:15:00Z", callType: "voice" },
  { id: "3", contactName: "Carlos Oliveira", phone: "+5511977665544", type: "missed", status: "missed", duration: 0, startedAt: "2026-02-12T16:45:00Z", callType: "voice" },
  { id: "4", contactName: "Ana Costa", phone: "+5511966554433", type: "incoming", status: "completed", duration: 320, startedAt: "2026-02-12T14:20:00Z", callType: "video" },
  { id: "5", contactName: "Pedro Lima", phone: "+5511955443322", type: "missed", status: "no_answer", duration: 0, startedAt: "2026-02-11T11:00:00Z", callType: "voice" },
];

export const CallHistory = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = mockCalls.filter(c => {
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
        {filtered.map(call => (
          <CallRecordItem key={call.id} record={call} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma chamada encontrada</p>
        )}
      </div>
    </div>
  );
};
