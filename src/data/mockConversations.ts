
import { Conversation } from "@/types/conversation";

export const mockConversations: Conversation[] = [
  {
    id: "bot-preview-1",
    name: "Bot ViaInfra - Preview",
    channel: "whatsapp",
    preview: "Bem-vindo ao autoatendimento da ViaInfra 👋",
    time: "10:30",
    unread: 0,
    avatar: null
  },
  {
    id: "bot-preview-2",
    name: "Bot ViaInfra - Chamado CH-0001",
    channel: "whatsapp", 
    preview: "Chamado criado com sucesso - PLACA: ABC-1234",
    time: "10:15",
    unread: 1,
    avatar: null
  },
  {
    id: "1",
    name: "João Silva",
    channel: "whatsapp",
    preview: "Olá, preciso de ajuda com meu pedido #12345",
    time: "09:45",
    unread: 2,
    avatar: null
  },
  {
    id: "2", 
    name: "Maria Souza",
    channel: "whatsapp",
    preview: "Qual o horário de funcionamento?",
    time: "Ontem",
    unread: 0,
    avatar: null
  },
  {
    id: "3",
    name: "Pedro Santos", 
    channel: "telegram",
    preview: "Vocês têm esse produto em estoque?",
    time: "Seg",
    unread: 1,
    avatar: null
  },
  {
    id: "4",
    name: "Ana Costa",
    channel: "messenger",
    preview: "Obrigada pelo atendimento!",
    time: "Dom",
    unread: 0,
    avatar: null
  },
  {
    id: "5",
    name: "Carlos Oliveira",
    channel: "instagram",
    preview: "Quando meu pedido será entregue?",
    time: "Sex",
    unread: 3,
    avatar: null
  },
  {
    id: "6",
    name: "Luciana Ferreira",
    channel: "whatsapp", 
    preview: "Gostaria de saber mais sobre os planos",
    time: "Qui",
    unread: 1,
    avatar: null
  },
  {
    id: "7",
    name: "Ricardo Mendes",
    channel: "whatsapp",
    preview: "Preciso cancelar minha assinatura",
    time: "Qua",
    unread: 0,
    avatar: null
  },
  {
    id: "8",
    name: "Fernanda Lima",
    channel: "telegram",
    preview: "Excelente atendimento, muito obrigada!",
    time: "Ter",
    unread: 0,
    avatar: null
  }
];

// Function to get conversations from localStorage or return default
export const getDemoConversations = (): Conversation[] => {
  const saved = localStorage.getItem('demo-conversations');
  return saved ? JSON.parse(saved) : mockConversations;
};

// Function to save conversations to localStorage
export const saveDemoConversations = (conversations: Conversation[]): void => {
  localStorage.setItem('demo-conversations', JSON.stringify(conversations));
};

// Function to update conversation unread count
export const updateConversationUnread = (conversationId: string, unreadCount: number): void => {
  const conversations = getDemoConversations();
  const updatedConversations = conversations.map(conv => 
    conv.id === conversationId ? { ...conv, unread: unreadCount } : conv
  );
  saveDemoConversations(updatedConversations);
};
