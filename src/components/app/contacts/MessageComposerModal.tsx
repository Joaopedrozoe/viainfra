import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Calendar, Users } from "lucide-react";
import { Contact } from "@/types/contact";
import { toast } from "sonner";

interface MessageComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContactIds: string[];
  contacts: Contact[];
}

export const MessageComposerModal = ({ 
  open, 
  onOpenChange, 
  selectedContactIds, 
  contacts 
}: MessageComposerModalProps) => {
  const [formData, setFormData] = useState({
    channel: "",
    subject: "",
    message: "",
    scheduleEnabled: false,
    scheduledFor: "",
    useTemplate: false
  });

  const selectedContacts = contacts.filter(c => selectedContactIds.includes(c.id));
  
  const availableChannels = Array.from(
    new Set(selectedContacts.map(c => c.channel).filter(Boolean))
  );

  const messageTemplates = {
    welcome: "Olá {nome}! Bem-vindo(a) à nossa plataforma. Estamos aqui para ajudar!",
    followup: "Olá {nome}, como vai? Gostaria de saber se precisa de alguma ajuda com nossos serviços.",
    promotion: "Olá {nome}! Temos uma oferta especial para {empresa}. Vamos conversar?",
    reminder: "Olá {nome}, lembrando que temos uma tarefa pendente. Podemos dar continuidade?"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.channel) {
      toast.error("Selecione um canal");
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    // Here you would normally send the messages
    // For demo, we'll just show a success message
    const action = formData.scheduleEnabled ? "agendada" : "enviada";
    toast.success(`Mensagem ${action} para ${selectedContacts.length} contato${selectedContacts.length !== 1 ? 's' : ''}!`);
    
    // Reset form and close modal
    setFormData({
      channel: "",
      subject: "",
      message: "",
      scheduleEnabled: false,
      scheduledFor: "",
      useTemplate: false
    });
    onOpenChange(false);
  };

  const insertTemplate = (template: string) => {
    setFormData(prev => ({ ...prev, message: template }));
  };

  const previewMessage = (message: string, contact: Contact) => {
    return message
      .replace(/\{nome\}/g, contact.name)
      .replace(/\{empresa\}/g, contact.company || '')
      .replace(/\{email\}/g, contact.email || '');
  };

  const estimatedCost = selectedContacts.length * 0.10; // Example cost per message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem para {selectedContacts.length} Contato{selectedContacts.length !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recipients Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinatários ({selectedContacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedContacts.slice(0, 10).map((contact) => (
                  <Badge key={contact.id} variant="outline">
                    {contact.name}
                  </Badge>
                ))}
                {selectedContacts.length > 10 && (
                  <Badge variant="secondary">
                    +{selectedContacts.length - 10} mais
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Channel Selection */}
            <div className="space-y-2">
              <Label>Canal de Envio *</Label>
              <Select
                value={formData.channel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </SelectItem>
                  ))}
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject (for email) */}
            {formData.channel === "email" && (
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Assunto do e-mail"
                />
              </div>
            )}

            {/* Message Templates */}
            <div className="space-y-2">
              <Label>Templates (opcional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(messageTemplates).map(([key, template]) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate(template)}
                    className="text-left justify-start"
                  >
                    {key === 'welcome' && 'Boas-vindas'}
                    {key === 'followup' && 'Follow-up'}
                    {key === 'promotion' && 'Promoção'}
                    {key === 'reminder' && 'Lembrete'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Digite sua mensagem aqui. Use {nome}, {empresa}, {email} para personalizar."
                rows={6}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground">
                Variáveis disponíveis: {"{nome}, {empresa}, {email}"}
              </div>
            </div>

            {/* Preview */}
            {formData.message && selectedContacts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Prévia da Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {previewMessage(formData.message, selectedContacts[0])}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Exemplo para: {selectedContacts[0].name}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scheduling */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="schedule">Agendar Envio</Label>
                <Switch
                  id="schedule"
                  checked={formData.scheduleEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, scheduleEnabled: checked }))}
                />
              </div>
              
              {formData.scheduleEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledFor">Data e Hora</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>

            {/* Cost Estimate */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Custo estimado:</span>
                  <span className="font-medium">R$ {estimatedCost.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedContacts.length} mensagens × R$ 0,10
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {formData.scheduleEnabled ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Envio
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Agora
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};