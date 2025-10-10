import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

interface CreateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateContactModal = ({ open, onOpenChange }: CreateContactModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    channel: "",
    notes: "",
    tags: [] as string[]
  });
  
  const [newTag, setNewTag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.phone && !formData.email) {
      toast.error("Telefone ou e-mail é obrigatório");
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { useAuth } = await import("@/contexts/auth");
      
      // Buscar company_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Empresa não encontrada");
        return;
      }

      // Criar contato no Supabase
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          company_id: profile.company_id,
          tags: formData.tags,
          metadata: {
            company: formData.company || null,
            channel: formData.channel || null,
            notes: formData.notes || null,
            source: 'manual'
          }
        });

      if (insertError) {
        console.error('Erro ao criar contato:', insertError);
        toast.error("Erro ao criar contato");
        return;
      }

      toast.success("Contato criado com sucesso!");
      
      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        channel: "",
        notes: "",
        tags: []
      });
      setNewTag("");
      onOpenChange(false);
      
      // Recarregar página para atualizar lista
      window.location.reload();
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast.error("Erro ao criar contato");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Nome da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel">Canal Preferido</Label>
            <Select
              value={formData.channel}
              onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Adicionar tag"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Adicionar
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Iniciais</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Adicione informações relevantes sobre o contato"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar Contato
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};