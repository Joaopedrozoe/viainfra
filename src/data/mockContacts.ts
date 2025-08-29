
import { Contact } from "@/types/contact";

export const mockContacts: Contact[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "+5511999999999",
    company: "Silva & Associados",
    tags: ["VIP", "Cliente"],
    channel: "whatsapp",
    lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    source: "conversation",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: [
      {
        id: "note-1",
        content: "Cliente interessado em upgrade do plano",
        tasks: [],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "task-1", 
        content: "Enviar proposta personalizada",
        tasks: [
          {
            id: "task-1-1",
            text: "Enviar proposta personalizada",
            completed: false
          }
        ],
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "2",
    name: "Maria Souza", 
    email: "maria.souza@empresa.com.br",
    phone: "+5511888888888",
    company: "TechCorp Ltda",
    tags: ["Lead", "Decisor"],
    channel: "whatsapp",
    lastInteraction: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    source: "conversation",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [
      {
        id: "note-2",
        content: "Gerente de TI, decisor técnico",
        tasks: [],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "3",
    name: "Pedro Santos",
    email: "pedro@loja.com",
    phone: "+5511777777777",
    company: "Loja do Pedro",
    tags: ["Cliente"],
    channel: "telegram",
    lastInteraction: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: "active",
    source: "conversation",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    notes: [
      {
        id: "task-2",
        content: "Agendar demonstração do produto",
        tasks: [
          {
            id: "task-2-1",
            text: "Agendar demonstração do produto",
            completed: true
          }
        ],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana.costa@consultoria.com.br",
    phone: "+5511666666666",
    company: "Costa Consultoria",
    tags: ["Prospect"],
    channel: "messenger",
    lastInteraction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    source: "conversation",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: []
  },
  {
    id: "5", 
    name: "Carlos Oliveira",
    email: "carlos.oliveira@distribuidora.com",
    phone: "+5511555555555",
    company: "Distribuidora São Paulo",
    tags: ["VIP", "Cliente"],
    channel: "instagram",
    lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    source: "conversation",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [
      {
        id: "note-3",
        content: "Cliente há 2 anos, sempre pontual nos pagamentos",
        tasks: [],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "task-3",
        content: "Verificar satisfação com o atendimento", 
        tasks: [
          {
            id: "task-3-1",
            text: "Verificar satisfação com o atendimento",
            completed: false
          }
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "6",
    name: "Luciana Ferreira",
    email: "luciana@empresa.com",
    phone: "+5511444444444",
    company: "Ferreira & Cia",
    tags: ["Lead"],
    channel: "whatsapp",
    lastInteraction: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    source: "conversation",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    notes: []
  },
  {
    id: "7",
    name: "Roberto Silva",
    email: "roberto.silva@manual.com",
    phone: "+5511333333333",
    company: "Cadastro Manual Ltda",
    tags: ["Manual", "Prospect"],
    channel: "email",
    lastInteraction: undefined,
    status: "active",
    source: "manual",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [
      {
        id: "note-7",
        content: "Contato adicionado manualmente via formulário de contato",
        tasks: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

// Function to get contacts from localStorage or return default
export const getDemoContacts = (): Contact[] => {
  const saved = localStorage.getItem('demo-contacts');
  return saved ? JSON.parse(saved) : mockContacts;
};

// Function to save contacts to localStorage
export const saveDemoContacts = (contacts: Contact[]): void => {
  localStorage.setItem('demo-contacts', JSON.stringify(contacts));
};

// Function to get contact by conversation ID (mapping)
export const getContactByConversationId = (conversationId: string): Contact | null => {
  const contacts = getDemoContacts();
  return contacts.find(contact => contact.id === conversationId) || null;
};

// Function to add note/task to contact
export const addContactNote = (contactId: string, note: any): void => {
  const contacts = getDemoContacts();
  const updatedContacts = contacts.map(contact => {
    if (contact.id === contactId) {
      return {
        ...contact,
        notes: [...contact.notes, note]
      };
    }
    return contact;
  });
  saveDemoContacts(updatedContacts);
};

// Function to update note/task
export const updateContactNote = (contactId: string, noteId: string, updates: Partial<any>): void => {
  const contacts = getDemoContacts();
  const updatedContacts = contacts.map(contact => {
    if (contact.id === contactId) {
      return {
        ...contact,
        notes: contact.notes.map(note => 
          note.id === noteId ? { ...note, ...updates } : note
        )
      };
    }
    return contact;
  });
  saveDemoContacts(updatedContacts);
};

// Function to delete note/task
export const deleteContactNote = (contactId: string, noteId: string): void => {
  const contacts = getDemoContacts();
  const updatedContacts = contacts.map(contact => {
    if (contact.id === contactId) {
      return {
        ...contact,
        notes: contact.notes.filter(note => note.id !== noteId)
      };
    }
    return contact;
  });
  saveDemoContacts(updatedContacts);
};
