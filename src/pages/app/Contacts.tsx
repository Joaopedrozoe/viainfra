import { useState, useMemo } from "react";
import { Search, Plus, Filter, Users, Mail, MessageSquare, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ContactListItem } from "@/components/app/contacts/ContactListItem";
import { ContactDetails } from "@/components/app/contacts/ContactDetails";
import { ContactFilters } from "@/components/app/contacts/ContactFilters";
import { ContactActions } from "@/components/app/contacts/ContactActions";
import { ContactStats } from "@/components/app/contacts/ContactStats";
import { CreateContactModal } from "@/components/app/contacts/CreateContactModal";
import { MessageComposerModal } from "@/components/app/contacts/MessageComposerModal";
import { DemoModeControl } from "@/components/app/DemoModeControl";
import { PlanGate } from "@/components/ui/plan-gate";
import { PLAN_FEATURES } from "@/types/plans";
import { Contact, ContactFilter } from "@/types/contact";
import { getDemoContacts } from "@/data/mockContacts";
import { useDemoMode } from "@/hooks/useDemoMode";

const Contacts = () => {
  const { isDemoMode } = useDemoMode();
  const [contacts] = useState<Contact[]>(getDemoContacts());
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ContactFilter>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Relacionamento</h1>
            {isDemoMode && <DemoModeControl />}
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <PlanGate feature={PLAN_FEATURES.BULK_MESSAGING}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMessageModal(true)}
                disabled={selectedContacts.length === 0}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Enviar Mensagem ({selectedContacts.length})
              </Button>
            </PlanGate>
            
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
            
            {filteredContacts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedContacts.length === filteredContacts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            )}
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
              {selectedContacts.length > 0 && ` • ${selectedContacts.length} selecionado${selectedContacts.length !== 1 ? 's' : ''}`}
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span>Total: {contacts.length}</span>
              <span>Com E-mail: {contacts.filter(c => c.email).length}</span>
              <span>Ativos: {contacts.filter(c => c.status === "active").length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full">
          <div className="overflow-y-auto h-full p-4">
            {filteredContacts.length > 0 ? (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleContactToggle(contact.id)}
                      className="rounded"
                    />
                    
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum contato encontrado</p>
                <p className="text-sm">Tente ajustar os filtros ou adicionar um novo contato</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedContact(null)}>
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <ContactDetails contact={selectedContact} />
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateContactModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
      
      <MessageComposerModal
        open={showMessageModal}
        onOpenChange={setShowMessageModal}
        selectedContactIds={selectedContacts}
        contacts={contacts}
      />
    </div>
  );
};

export default Contacts;