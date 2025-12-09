import { Contact } from "@/types/contact";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  MessageSquare, 
  Edit, 
  Star,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChannelIcon } from "@/components/app/conversation/ChannelIcon";
import { NotesList } from "@/components/app/contact/NotesList";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContactDetailsProps {
  contact: Contact;
  onUpdate?: () => void;
}

export const ContactDetails = ({ contact, onUpdate }: ContactDetailsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: contact.name,
    phone: contact.phone || "",
    email: contact.email || "",
    company: contact.company || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastInteraction = contact.lastInteraction 
    ? formatDistanceToNow(new Date(contact.lastInteraction), { 
        addSuffix: true, 
        locale: ptBR 
      })
    : 'Nenhuma interação registrada';

  const createdAt = formatDistanceToNow(new Date(contact.createdAt), { 
    addSuffix: true, 
    locale: ptBR 
  });

  const pendingTasks = contact.notes.reduce((count, note) => 
    count + note.tasks.filter(task => !task.completed).length, 0
  );

  const handleEditSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Normalizar telefone (remover caracteres não numéricos)
      const normalizedPhone = editForm.phone ? editForm.phone.replace(/\D/g, '') : null;
      
      const { error } = await supabase
        .from("contacts")
        .update({
          name: editForm.name,
          phone: normalizedPhone || null,
          email: editForm.email || null,
          metadata: {
            ...contact.metadata,
            company: editForm.company || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", contact.id);

      if (error) {
        // Verificar se é erro de duplicidade de telefone
        if (error.code === '23505' && error.message?.includes('phone')) {
          toast.error("Este telefone já está cadastrado para outro contato");
          return;
        }
        throw error;
      }

      toast.success("Contato atualizado com sucesso!");
      setIsEditDialogOpen(false);
      onUpdate?.();
    } catch (error: any) {
      console.error("Erro ao atualizar contato:", error);
      toast.error(error.message || "Erro ao atualizar contato");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {contact.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{contact.name}</h1>
              {contact.status === "active" && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Ativo
                </Badge>
              )}
              <Badge variant="outline">
                {contact.source === "conversation" ? "Da Conversa" : "Manual"}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Criado {createdAt}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {lastInteraction}
              </div>
              {pendingTasks > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingTasks} tarefa{pendingTasks !== 1 ? 's' : ''} pendente{pendingTasks !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEditForm({
                name: contact.name,
                phone: contact.phone || "",
                email: contact.email || "",
                company: contact.company || "",
              });
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="info" className="h-full">
          <TabsList className="mb-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="notes">Notas e Tarefas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">E-mail</div>
                        <div className="text-sm text-muted-foreground">{contact.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Telefone</div>
                        <div className="text-sm text-muted-foreground">{contact.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {contact.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Empresa</div>
                        <div className="text-sm text-muted-foreground">{contact.company}</div>
                      </div>
                    </div>
                  )}
                  
                  {contact.channel && (
                    <div className="flex items-center gap-3">
                      <ChannelIcon channel={contact.channel as any} />
                      <div>
                        <div className="text-sm font-medium">Canal Principal</div>
                        <div className="text-sm text-muted-foreground capitalize">{contact.channel}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total de Notas</span>
                    <span className="font-medium">{contact.notes.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tarefas Pendentes</span>
                    <span className="font-medium">{pendingTasks}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tags</span>
                    <span className="font-medium">{contact.tags.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                      {contact.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="h-full">
            <NotesList contactId={contact.id} />
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Interações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Histórico de interações será implementado em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome do contato"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+55 11 98888-8888"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Empresa</Label>
              <Input
                id="edit-company"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};