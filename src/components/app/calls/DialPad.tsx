import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Delete, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initiateCall } from "@/hooks/useCalls";
import { useAuth } from "@/contexts/auth";

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export const DialPad = () => {
  const { company } = useAuth();
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const isViainfra = /viainfra/i.test(company?.name || "");

  const handleKey = (key: string) => setNumber(prev => prev + key);
  const handleDelete = () => setNumber(prev => prev.slice(0, -1));

  const handleCall = async () => {
    if (!number.trim()) return;
    if (!isViainfra) {
      toast.error("Ligações estão disponíveis apenas para a VIAINFRA (WhatsApp Cloud API).");
      return;
    }
    setLoading(true);
    try {
      await initiateCall({ phone: number, callType: "voice" });
      toast.success("Ligação iniciada. Aguardando o destinatário atender.");
      setNumber("");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao iniciar ligação");
    } finally {
      setLoading(false);
    }
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
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Phone className="h-6 w-6" />}
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

      {!isViainfra && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Este recurso usa a WhatsApp Business Calling API (Meta Cloud) e está ativo apenas para VIAINFRA.
        </p>
      )}
    </div>
  );
};
