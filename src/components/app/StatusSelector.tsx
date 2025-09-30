import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Circle, Check } from "lucide-react";
import { UserStatus, useUserPresence } from "@/hooks/useUserPresence";

const statusConfig = {
  online: { label: 'Online', color: 'bg-green-500', description: 'Disponível para atendimento' },
  away: { label: 'Ausente', color: 'bg-yellow-500', description: 'Voltarei em breve' },
  busy: { label: 'Ocupado', color: 'bg-red-500', description: 'Não disponível' },
  offline: { label: 'Offline', color: 'bg-gray-400', description: 'Desconectado' },
};

export const StatusSelector = () => {
  const { myStatus, updateStatus } = useUserPresence();
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('online');

  const handleStatusChange = async (status: UserStatus) => {
    if (status === 'away') {
      setSelectedStatus(status);
      setShowCustomMessage(true);
    } else {
      await updateStatus(status);
    }
  };

  const handleSaveCustomMessage = async () => {
    await updateStatus(selectedStatus, customMessage);
    setShowCustomMessage(false);
    setCustomMessage('');
  };

  const currentConfig = statusConfig[myStatus];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3">
            <Circle className={`w-3 h-3 ${currentConfig.color} fill-current`} />
            <span className="text-sm font-medium">{currentConfig.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(statusConfig).map(([status, config]) => (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status as UserStatus)}
              className="flex items-center gap-3 py-2"
            >
              <Circle className={`w-3 h-3 ${config.color} fill-current`} />
              <div className="flex-1">
                <div className="font-medium">{config.label}</div>
                <div className="text-xs text-muted-foreground">{config.description}</div>
              </div>
              {myStatus === status && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCustomMessage} onOpenChange={setShowCustomMessage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mensagem de ausência</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: Almoço, estarei de volta às 14h"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomMessage(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCustomMessage}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
