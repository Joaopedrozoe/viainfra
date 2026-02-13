
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import type { BroadcastSend } from "@/types/broadcast";

const mockHistory: BroadcastSend[] = [
  {
    id: "1",
    listId: "1",
    templateId: "1",
    templateName: "boas_vindas",
    sentAt: "2026-02-12T14:30:00Z",
    totalRecipients: 45,
    delivered: 42,
    read: 28,
    failed: 3,
    status: "completed",
  },
  {
    id: "2",
    listId: "2",
    templateId: "2",
    templateName: "promocao_mensal",
    sentAt: "2026-02-10T09:00:00Z",
    totalRecipients: 120,
    delivered: 115,
    read: 89,
    failed: 5,
    status: "completed",
  },
];

const statusConfig = {
  sending: { label: "Enviando", icon: Clock, variant: "outline" as const },
  completed: { label: "Concluído", icon: CheckCircle, variant: "default" as const },
  partial: { label: "Parcial", icon: AlertTriangle, variant: "secondary" as const },
  failed: { label: "Falhou", icon: XCircle, variant: "destructive" as const },
};

export const BroadcastHistory = () => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Template</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-center">Enviadas</TableHead>
            <TableHead className="text-center">Entregues</TableHead>
            <TableHead className="text-center">Lidas</TableHead>
            <TableHead className="text-center">Falhas</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockHistory.map(send => {
            const cfg = statusConfig[send.status];
            const Icon = cfg.icon;
            return (
              <TableRow key={send.id}>
                <TableCell className="font-medium">{send.templateName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(send.sentAt).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-center">{send.totalRecipients}</TableCell>
                <TableCell className="text-center text-green-600">{send.delivered}</TableCell>
                <TableCell className="text-center text-blue-600">{send.read}</TableCell>
                <TableCell className="text-center text-destructive">{send.failed}</TableCell>
                <TableCell>
                  <Badge variant={cfg.variant} className="gap-1">
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
