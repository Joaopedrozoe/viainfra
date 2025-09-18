import db from './database-simple';

// Mock Prisma client that delegates to our simple database adapter
const mockPrisma = {
  user: db.user,
  company: db.company,
  
  // Placeholder methods for other models to prevent errors
  conversation: {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => { throw new Error('Conversation operations not implemented'); },
    update: async () => { throw new Error('Conversation operations not implemented'); },
    delete: async () => { throw new Error('Conversation operations not implemented'); },
    count: async () => 0,
  },
  
  contact: {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => { throw new Error('Contact operations not implemented'); },
    update: async () => { throw new Error('Contact operations not implemented'); },
    delete: async () => { throw new Error('Contact operations not implemented'); },
  },
  
  channel: {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => { throw new Error('Channel operations not implemented'); },
    update: async () => { throw new Error('Channel operations not implemented'); },
    delete: async () => { throw new Error('Channel operations not implemented'); },
  },
  
  message: {
    findMany: async () => [],
    create: async () => { throw new Error('Message operations not implemented'); },
    count: async () => 0,
  },
  
  ticket: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => { throw new Error('Ticket operations not implemented'); },
    update: async () => { throw new Error('Ticket operations not implemented'); },
    count: async () => 0,
  },
  
  bot: {
    findMany: async () => [],
    findUnique: async () => null,
  },
  
  webhookEvent: {
    create: async () => { throw new Error('Webhook operations not implemented'); },
  }
};

export { mockPrisma as prisma };
export default mockPrisma;