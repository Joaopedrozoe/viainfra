
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BroadcastTemplate } from "@/types/broadcast";

const mockTemplates: BroadcastTemplate[] = [
  {
    id: "1",
    name: "boas_vindas",
    language: "pt_BR",
    category: "MARKETING",
    status: "APPROVED",
    components: [{ type: "BODY", text: "Olá {{1}}! Seja bem-vindo(a) à ViaInfra. Como podemos ajudar?" }],
  },
  {
    id: "2",
    name: "promocao_mensal",
    language: "pt_BR",
    category: "MARKETING",
    status: "APPROVED",
    components: [{ type: "BODY", text: "🔥 {{1}}, temos uma oferta especial para você! Confira nossas condições exclusivas." }],
  },
  {
    id: "3",
    name: "lembrete_agendamento",
    language: "pt_BR",
    category: "UTILITY",
    status: "APPROVED",
    components: [{ type: "BODY", text: "Olá {{1}}, lembramos que seu agendamento está marcado para {{2}}. Confirme sua presença!" }],
  },
];

interface BroadcastComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listName: string;
  contactCount: number;
  onSend: (templateId: string, preview: string) => void;
}

export const BroadcastComposer = ({ open, onOpenChange, listName, contactCount, onSend }: BroadcastComposerProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [preview, setPreview] = useState("");

  const template = mockTemplates.find(t => t.id === selectedTemplate);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplate(id);
    const t = mockTemplates.find(x => x.id === id);
    if (t) {
      const body = t.components.find(c => c.type === "BODY");
      setPreview(body?.text || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar para: {listName}</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A WhatsApp Cloud API exige o uso de <strong>Message Templates</strong> pré-aprovados para iniciar conversas.
            A mensagem será enviada individualmente para {contactCount} contato(s).
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          <div>
            <Label>Template aprovado</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {mockTemplates.filter(t => t.status === "APPROVED").map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {preview && (
            <div>
              <Label>Pré-visualização</Label>
              <Textarea value={preview} readOnly rows={3} className="bg-muted" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSend(selectedTemplate, preview)} disabled={!selectedTemplate}>
            <Send className="h-4 w-4 mr-2" /> Enviar ({contactCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
