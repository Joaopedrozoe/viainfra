
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface BroadcastListFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description: string; contactIds: string[] }) => void;
  contacts: Contact[];
}

export const BroadcastListForm = ({ open, onOpenChange, onSave, contacts }: BroadcastListFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const toggleContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!name.trim() || selectedContacts.length === 0) return;
    onSave({ name, description, contactIds: selectedContacts });
    setName("");
    setDescription("");
    setSelectedContacts([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Lista de Transmissão</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome da lista</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Clientes VIP" />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição da lista..." rows={2} />
          </div>
          <div>
            <Label>Selecionar contatos ({selectedContacts.length} selecionados)</Label>
            <div className="relative mt-1 mb-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contato..." className="pl-9" />
            </div>
            <ScrollArea className="h-48 border rounded-md p-2">
              {filtered.map(contact => (
                <label key={contact.id} className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent rounded cursor-pointer">
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => toggleContact(contact.id)}
                  />
                  <span className="text-sm font-medium">{contact.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{contact.phone}</span>
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato encontrado</p>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim() || selectedContacts.length === 0}>Criar lista</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
