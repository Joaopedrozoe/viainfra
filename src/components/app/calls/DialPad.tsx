
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Delete, Video, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export const DialPad = () => {
  const [number, setNumber] = useState("");

  const handleKey = (key: string) => setNumber(prev => prev + key);
  const handleDelete = () => setNumber(prev => prev.slice(0, -1));
  const handleCall = (type: 'voice' | 'video') => {
    if (!number.trim()) return;
    toast.info("Funcionalidade de chamadas em desenvolvimento. Aguarde atualização da API.");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Alert className="border-amber-300 bg-amber-50 text-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-xs">
          A WhatsApp Cloud API ainda não suporta iniciar chamadas programaticamente.
          O discador está preparado para quando a funcionalidade for disponibilizada.
        </AlertDescription>
      </Alert>

      <div className="w-full max-w-xs bg-muted rounded-lg p-4 text-center min-h-[3rem] flex items-center justify-center">
        <span className="text-2xl font-mono tracking-widest">{number || <span className="text-muted-foreground text-lg">Digite o número</span>}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {keys.flat().map(key => (
          <Button
            key={key}
            variant="outline"
            className="h-14 text-xl font-semibold rounded-full"
            onClick={() => handleKey(key)}
          >
            {key}
          </Button>
        ))}
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <Button
          className="flex-1 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white"
          onClick={() => handleCall('voice')}
          disabled={!number.trim()}
        >
          <Phone className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          className="h-14 w-14 rounded-full"
          onClick={handleDelete}
        >
          <Delete className="h-5 w-5" />
        </Button>
        <Button
          className="flex-1 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleCall('video')}
          disabled={!number.trim()}
        >
          <Video className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
