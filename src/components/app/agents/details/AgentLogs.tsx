
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Agent } from "@/types/agent";

interface AgentLogsProps {
  agent: Agent;
}

// Sample log data
const sampleLogs = [
  {
    id: 'log1',
    conversation: 'conv123',
    timestamp: '2024-04-28T09:15:00Z',
    user: 'João Silva',
    message: 'Como faço para trocar minha senha?',
    response: 'Para trocar sua senha, acesse seu perfil e clique em "Trocar senha".',
    success: true,
    transferred: false
  },
  {
    id: 'log2',
    conversation: 'conv124',
    timestamp: '2024-04-28T10:22:00Z',
    user: 'Maria Oliveira',
    message: 'Quero cancelar minha assinatura.',
    response: 'Entendo que você gostaria de cancelar. Vou transferir para um atendente que poderá ajudar com isso.',
    success: false,
    transferred: true
  },
  {
    id: 'log3',
    conversation: 'conv125',
    timestamp: '2024-04-28T11:45:00Z',
    user: 'Pedro Santos',
    message: 'Qual o horário de atendimento?',
    response: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.',
    success: true,
    transferred: false
  },
  {
    id: 'log4',
    conversation: 'conv126',
    timestamp: '2024-04-28T13:10:00Z',
    user: 'Ana Costa',
    message: 'O sistema está dando erro ao tentar fazer login.',
    response: 'Vamos verificar isso. Você poderia me informar qual mensagem de erro está aparecendo?',
    success: true,
    transferred: false
  },
  {
    id: 'log5',
    conversation: 'conv127',
    timestamp: '2024-04-28T14:35:00Z',
    user: 'Lucas Mendes',
    message: 'Preciso de ajuda com um problema específico no meu projeto.',
    response: 'Para ajudar melhor com seu problema específico, vou transferir para um especialista.',
    success: false,
    transferred: true
  }
];

export const AgentLogs = ({ agent }: AgentLogsProps) => {
  const [period, setPeriod] = useState("today");
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Histórico de Interações</h2>
        <div className="flex items-center gap-2">
          <Select 
            defaultValue={period}
            onValueChange={setPeriod}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {formatDate(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    {log.user}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {log.message}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {log.response}
                  </TableCell>
                  <TableCell>
                    {log.transferred ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Transferido
                      </span>
                    ) : log.success ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Resolvido
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                        Falha
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Reexecutar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
