export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'attendant';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions: Record<string, boolean>;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'attendant';
  permissions?: Record<string, boolean>;
}

export const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Elisabete Silva",
    email: "elisabete.silva@viainfra.com.br",
    role: "admin",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: new Date().toISOString(),
    permissions: {} // Admin has all permissions
  },
  {
    id: "2", 
    name: "Joicy Souza",
    email: "atendimento@viainfra.com.br",
    role: "attendant",
    isActive: true,
    createdAt: "2024-01-15T00:00:00Z",
    lastLogin: "2024-01-20T09:30:00Z",
    permissions: {
      "conversations.view": true,
      "conversations.respond": true,
      "conversations.resolve": true,
      "contacts.view": true,
      "contacts.create": true,
      "schedule.view": true,
      "schedule.create": true,
      "settings.profile": true
    }
  },
  {
    id: "3",
    name: "Suelem Souza", 
    email: "manutencao@viainfra.com.br",
    role: "attendant",
    isActive: true,
    createdAt: "2024-02-01T00:00:00Z",
    lastLogin: "2024-02-05T14:15:00Z",
    permissions: {
      "conversations.view": true,
      "conversations.respond": true,
      "contacts.view": true,
      "analytics.dashboard": true,
      "schedule.view": true,
      "settings.profile": true
    }
  },
  {
    id: "4",
    name: "Giovanna Ferreira",
    email: "gestaofinanceira@vianfra.com.br", 
    role: "attendant",
    isActive: true,
    createdAt: "2024-01-10T00:00:00Z",
    lastLogin: "2024-01-18T16:45:00Z",
    permissions: {
      "conversations.view": true,
      "conversations.respond": true,
      "contacts.view": true,
      "settings.profile": true
    }
  },
  {
    id: "5",
    name: "Sandra Romano",
    email: "sandra.romano@vialogistic.com.br", 
    role: "attendant",
    isActive: true,
    createdAt: "2024-03-01T00:00:00Z",
    lastLogin: "2024-03-10T11:20:00Z",
    permissions: {
      "conversations.view": true,
      "conversations.respond": true,
      "contacts.view": true,
      "schedule.view": true,
      "settings.profile": true
    }
  }
];