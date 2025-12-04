import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Filter, Users, Mail, MessageSquare, Download, Trash2, Camera, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContactDetails } from "@/components/app/contacts/ContactDetails";
import { ContactFilters } from "@/components/app/contacts/ContactFilters";
import { CreateContactModal } from "@/components/app/contacts/CreateContactModal";
import { Contact, ContactFilter } from "@/types/contact";
import { getDemoContacts } from "@/data/mockContacts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDemoMode } from "@/hooks/useDemoMode";

const Contacts = () => {
  const { isDemoMode } = useDemoMode();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingPhotos, setIsSyncingPhotos] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContactFilter>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const handleSyncProfilePictures = async () => {
    setIsSyncingPhotos(true);
    toast.loading("Sincronizando fotos de perfil...");
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-profile-pictures', {
        body: { forceUpdate: false }
      });
      
      if (error) {
        console.error('Error syncing profile pictures:', error);
        toast.error("Erro ao sincronizar fotos");
      } else {
        toast.success(`Fotos sincronizadas: ${data.updated} atualizadas, ${data.skipped} ignoradas`);
        fetchContacts();
      }
    } catch (error) {
      console.error('Error syncing profile pictures:', error);
      toast.error("Erro ao sincronizar fotos");
    } finally {
      setIsSyncingPhotos(false);
      toast.dismiss();
    }
  };

  // Load contacts from Supabase
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setContacts([]);
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) {
        setContacts([]);
        setIsLoading(false);
        return;
      }

      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading contacts:', error);
        setContacts([]);
      } else {
        // Mapear para o formato esperado
        const mappedContacts = (contactsData || []).map(c => {
          const metadata = typeof c.metadata === 'object' && c.metadata !== null ? c.metadata as any : {};
          const tags = Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === 'string') : [];
          
          return {
            id: c.id,
            name: c.name,
            email: c.email || undefined,
            phone: c.phone || undefined,
            company: metadata.company || undefined,
            avatar_url: c.avatar_url || undefined,
            tags,
            channel: metadata.channel || undefined,
            lastInteraction: c.updated_at,
            status: "active" as const,
            source: metadata.source === 'manual' ? "manual" as const : "conversation" as const,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            notes: [],
            metadata
          };
        });
        setContacts(mappedContacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [isDemoMode]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Filtrar "Cliente Web" e "Sem contato"
      if (contact.name === "Cliente Web" || contact.name === "Sem contato") {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          contact.name.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesQuery) return false;
      }

      // Channel filter
      if (filters.channels?.length && !filters.channels.includes(contact.channel || '')) {
        return false;
      }

      // Tags filter
      if (filters.tags?.length && !filters.tags.some(tag => contact.tags.includes(tag))) {
        return false;
      }

      // Status filter
      if (filters.status && contact.status !== filters.status) {
        return false;
      }

      // Email filter
      if (filters.hasEmail !== undefined) {
        const hasEmail = Boolean(contact.email);
        if (filters.hasEmail !== hasEmail) return false;
      }

      // Pending tasks filter
      if (filters.hasPendingTasks) {
        const hasPendingTasks = contact.notes.some(note => 
          note.tasks.some(task => !task.completed)
        );
        if (!hasPendingTasks) return false;
      }

      // Last interaction filter
      if (filters.lastInteractionDays && contact.lastInteraction) {
        const daysSinceInteraction = (Date.now() - new Date(contact.lastInteraction).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceInteraction > filters.lastInteractionDays) return false;
      }

      // Source filter
      if (filters.source && contact.source !== filters.source) {
        return false;
      }

      return true;
    });
  }, [contacts, searchQuery, filters]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleBulkMessage = () => {
    if (selectedContacts.length > 0) {
      setShowMessageModal(true);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) {
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        console.error('Error deleting contact:', error);
        alert('Erro ao excluir contato');
      } else {
        // Remover da lista local
        setContacts(prev => prev.filter(c => c.id !== contactId));
        if (selectedContact?.id === contactId) {
          setSelectedContact(null);
        }
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Erro ao excluir contato');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Relacionamento</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncProfilePictures}
              disabled={isSyncingPhotos}
            >
              {isSyncingPhotos ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Sincronizar Fotos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b bg-background">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <ContactFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={Array.from(new Set(contacts.flatMap(c => c.tags)))}
              availableChannels={Array.from(new Set(contacts.map(c => c.channel).filter(Boolean)))}
            />
          )}
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredContacts.length} contato{filteredContacts.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span>Total: {filteredContacts.length}</span>
              <span>Com E-mail: {filteredContacts.filter(c => c.email).length}</span>
              <span>Ativos: {filteredContacts.filter(c => c.status === "active").length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full">
          <div className="overflow-y-auto h-full p-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-pulse">Carregando contatos...</div>
              </div>
            ) : filteredContacts.length > 0 ? (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                          {contact.avatar_url ? (
                            <img 
                              src={contact.avatar_url} 
                              alt={contact.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-sm font-medium text-primary">${contact.name.charAt(0).toUpperCase()}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-sm font-medium text-primary">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {contact.email || contact.phone || 'Sem contato'}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {contact.channel && (
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {contact.channel}
                            </span>
                          )}
                          {contact.tags.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {contact.tags.length} tag{contact.tags.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContact(contact.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum contato encontrado</p>
                <p className="text-sm">
                  {contacts.length === 0 
                    ? "Os contatos aparecerão automaticamente quando você conectar a API do WhatsApp e receber mensagens reais" 
                    : "Tente ajustar os filtros ou adicionar um novo contato"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedContact(null)}>
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <ContactDetails 
              contact={selectedContact}
              onUpdate={() => {
                fetchContacts();
                const updated = contacts.find(c => c.id === selectedContact.id);
                if (updated) setSelectedContact(updated);
              }}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateContactModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
};

export default Contacts;