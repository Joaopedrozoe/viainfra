import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Delete } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { ActiveCallDialog } from "./ActiveCallDialog";

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export const DialPad = () => {
  const { company } = useAuth();
  const [number, setNumber] = useState("");
  const [callOpen, setCallOpen] = useState(false);
  const [callPhone, setCallPhone] = useState("");
  const loading = false;

  const callsEnabled = /viainfra|vialogistic/i.test(company?.name || "");

  const handleKey = (key: string) => setNumber(prev => prev + key);
  const handleDelete = () => setNumber(prev => prev.slice(0, -1));

  const handleCall = () => {
    if (!number.trim()) return;
    if (!callsEnabled) {
      toast.error("Ligações disponíveis apenas para contas na WhatsApp Cloud API (Meta).");
      return;
    }
    setCallPhone(number.trim());
    setCallOpen(true);
  };


  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-xs bg-muted rounded-lg p-4 text-center min-h-[3rem] flex items-center justify-center">
        <span className="text-2xl font-mono tracking-widest">
          {number || <span className="text-muted-foreground text-lg">Digite o número</span>}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {keys.flat().map(key => (
          <Button
            key={key}
            variant="outline"
            className="h-14 text-xl font-semibold rounded-full"
            onClick={() => handleKey(key)}
            disabled={loading}
          >
            {key}
          </Button>
        ))}
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <Button
          className="flex-1 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white"
          onClick={handleCall}
          disabled={!number.trim() || loading}
        >
          <Phone className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          className="h-14 w-14 rounded-full"
          onClick={handleDelete}
          disabled={loading}
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>

      {!callsEnabled && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Este recurso usa a WhatsApp Business Calling API (Meta Cloud) e está ativo para contas na API oficial (VIAINFRA e VIALOGISTIC).
        </p>
      )}

      <ActiveCallDialog
        open={callOpen}
        phone={callPhone}
        onClose={() => { setCallOpen(false); setNumber(""); }}
      />
    </div>
  );
};
