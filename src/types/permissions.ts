export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  adminOnly?: boolean;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface UserPermissions {
  userId: string;
  email: string;
  isAdmin: boolean;
  permissions: Record<string, boolean>;
  lastUpdated: string;
}

export const DEFAULT_PERMISSIONS: PermissionCategory[] = [
  {
    id: "conversations",
    name: "Conversas",
    description: "Gerenciamento de conversas e mensagens",
    permissions: [
      {
        id: "conversations.view",
        name: "Visualizar Conversas",
        description: "Permite visualizar conversas na inbox",
        category: "conversations",
        enabled: true
      },
      {
        id: "conversations.respond",
        name: "Responder Mensagens",
        description: "Permite enviar respostas aos clientes",
        category: "conversations",
        enabled: true
      },
      {
        id: "conversations.resolve",
        name: "Encerrar Conversas",
        description: "Permite marcar conversas como resolvidas",
        category: "conversations",
        enabled: true
      },
      {
        id: "conversations.assign",
        name: "Atribuir Conversas",
        description: "Permite atribuir conversas a outros atendentes",
        category: "conversations",
        enabled: false
      }
    ]
  },
  {
    id: "contacts",
    name: "Contatos",
    description: "Gerenciamento de informações de contatos",
    permissions: [
      {
        id: "contacts.view",
        name: "Visualizar Contatos",
        description: "Permite visualizar lista de contatos",
        category: "contacts",
        enabled: true
      },
      {
        id: "contacts.create",
        name: "Criar Contatos",
        description: "Permite adicionar novos contatos",
        category: "contacts",
        enabled: true
      },
      {
        id: "contacts.edit",
        name: "Editar Contatos",
        description: "Permite editar informações de contatos",
        category: "contacts",
        enabled: true
      },
      {
        id: "contacts.delete",
        name: "Deletar Contatos",
        description: "Permite remover contatos",
        category: "contacts",
        enabled: false
      },
      {
        id: "contacts.export",
        name: "Exportar Contatos",
        description: "Permite exportar lista de contatos",
        category: "contacts",
        enabled: false
      }
    ]
  },
  {
    id: "channels",
    name: "Canais",
    description: "Configuração e gerenciamento de canais",
    permissions: [
      {
        id: "channels.view",
        name: "Visualizar Canais",
        description: "Permite visualizar canais configurados",
        category: "channels",
        enabled: true
      },
      {
        id: "channels.create",
        name: "Criar Canais",
        description: "Permite adicionar novos canais",
        category: "channels",
        enabled: false,
        adminOnly: true
      },
      {
        id: "channels.edit",
        name: "Editar Canais",
        description: "Permite modificar configurações de canais",
        category: "channels",
        enabled: false,
        adminOnly: true
      },
      {
        id: "channels.delete",
        name: "Deletar Canais",
        description: "Permite remover canais",
        category: "channels",
        enabled: false,
        adminOnly: true
      }
    ]
  },
  {
    id: "bots",
    name: "Bots e Automação",
    description: "Criação e gerenciamento de bots",
    permissions: [
      {
        id: "bots.view",
        name: "Visualizar Bots",
        description: "Permite visualizar bots configurados",
        category: "bots",
        enabled: true
      },
      {
        id: "bots.create",
        name: "Criar Bots",
        description: "Permite criar novos bots",
        category: "bots",
        enabled: false
      },
      {
        id: "bots.edit",
        name: "Editar Bots",
        description: "Permite modificar bots existentes",
        category: "bots",
        enabled: false
      },
      {
        id: "bots.publish",
        name: "Publicar Bots",
        description: "Permite ativar/desativar bots",
        category: "bots",
        enabled: false,
        adminOnly: true
      }
    ]
  },
  {
    id: "analytics",
    name: "Analytics e Relatórios",
    description: "Acesso a dados e relatórios",
    permissions: [
      {
        id: "analytics.dashboard",
        name: "Dashboard",
        description: "Permite visualizar dashboard principal",
        category: "analytics",
        enabled: true
      },
      {
        id: "analytics.reports",
        name: "Relatórios Detalhados",
        description: "Permite gerar relatórios detalhados",
        category: "analytics",
        enabled: false
      },
      {
        id: "analytics.export",
        name: "Exportar Dados",
        description: "Permite exportar dados e relatórios",
        category: "analytics",
        enabled: false,
        adminOnly: true
      }
    ]
  },
  {
    id: "integrations",
    name: "Integrações",
    description: "APIs e integrações externas",
    permissions: [
      {
        id: "integrations.view",
        name: "Visualizar Integrações",
        description: "Permite ver integrações configuradas",
        category: "integrations",
        enabled: false,
        adminOnly: true
      },
      {
        id: "integrations.configure",
        name: "Configurar Integrações",
        description: "Permite configurar APIs e webhooks",
        category: "integrations",
        enabled: false,
        adminOnly: true
      },
      {
        id: "integrations.api_keys",
        name: "Gerenciar API Keys",
        description: "Permite criar e gerenciar chaves de API",
        category: "integrations",
        enabled: false,
        adminOnly: true
      }
    ]
  },
  {
    id: "schedule",
    name: "Agenda",
    description: "Funcionalidades de agendamento",
    permissions: [
      {
        id: "schedule.view",
        name: "Visualizar Agenda",
        description: "Permite visualizar eventos agendados",
        category: "schedule",
        enabled: true
      },
      {
        id: "schedule.create",
        name: "Criar Eventos",
        description: "Permite criar novos eventos",
        category: "schedule",
        enabled: true
      },
      {
        id: "schedule.edit",
        name: "Editar Eventos",
        description: "Permite modificar eventos existentes",
        category: "schedule",
        enabled: true
      },
      {
        id: "schedule.settings",
        name: "Configurar Agenda",
        description: "Permite alterar configurações da agenda",
        category: "schedule",
        enabled: false,
        adminOnly: true
      }
    ]
  },
  {
    id: "settings",
    name: "Configurações",
    description: "Configurações do sistema",
    permissions: [
      {
        id: "settings.profile",
        name: "Editar Perfil",
        description: "Permite editar informações do próprio perfil",
        category: "settings",
        enabled: true
      },
      {
        id: "settings.company",
        name: "Configurações da Empresa",
        description: "Permite editar configurações da empresa",
        category: "settings",
        enabled: false,
        adminOnly: true
      },
      {
        id: "settings.email",
        name: "Configurações de E-mail",
        description: "Permite configurar servidor SMTP",
        category: "settings",
        enabled: false,
        adminOnly: true
      },
      {
        id: "settings.permissions",
        name: "Gerenciar Permissões",
        description: "Permite alterar permissões de usuários",
        category: "settings",
        enabled: false,
        adminOnly: true
      }
    ]
  }
];