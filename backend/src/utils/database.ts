import db from './database-simple';

// Mock Prisma client that delegates to our simple database adapter
const mockPrisma = {
  user: db.user,
  company: db.company,
  
  // Placeholder methods for other models to prevent errors
  conversation: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => { throw new Error('Not implemented'); },
    update: async () => { throw new Error('Not implemented'); },
    delete: async () => { throw new Error('Not implemented'); },
  },
  
  contact: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => { throw new Error('Not implemented'); },
    update: async () => { throw new Error('Not implemented'); },
    delete: async () => { throw new Error('Not implemented'); },
  },
  
  channel: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => { throw new Error('Not implemented'); },
    update: async () => { throw new Error('Not implemented'); },
    delete: async () => { throw new Error('Not implemented'); },
  },
  
  message: {
    findMany: async () => [],
    create: async () => { throw new Error('Not implemented'); },
  },
  
  ticket: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => { throw new Error('Not implemented'); },
    update: async () => { throw new Error('Not implemented'); },
  },
  
  bot: {
    findMany: async () => [],
    findUnique: async () => null,
  },
  
  webhookEvent: {
    create: async () => { throw new Error('Not implemented'); },
  }
};

export { mockPrisma as prisma };
export default mockPrisma;