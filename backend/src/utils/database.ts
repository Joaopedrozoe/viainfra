import db from './database-simple';

// Mock Prisma client that delegates to our simple database adapter
const mockPrisma = {
  user: db.user,
  company: db.company,
  
  // Placeholder methods for other models to prevent errors
  conversation: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null,
    create: async (options?: any) => { throw new Error('Not implemented'); },
    update: async (options?: any) => { throw new Error('Not implemented'); },
    delete: async (options?: any) => { throw new Error('Not implemented'); },
    count: async (options?: any) => 0,
  },
  
  contact: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null,
    create: async (options?: any) => { throw new Error('Not implemented'); },
    update: async (options?: any) => { throw new Error('Not implemented'); },
    delete: async (options?: any) => { throw new Error('Not implemented'); },
    count: async (options?: any) => 0,
  },
  
  channel: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null,
    create: async (options?: any) => { throw new Error('Not implemented'); },
    update: async (options?: any) => { throw new Error('Not implemented'); },
    delete: async (options?: any) => { throw new Error('Not implemented'); },
    count: async (options?: any) => 0,
  },
  
  message: {
    findMany: async (options?: any) => [],
    findFirst: async (options?: any) => null,
    create: async (options?: any) => { throw new Error('Not implemented'); },
    count: async (options?: any) => 0,
  },
  
  ticket: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null,
    create: async (options?: any) => { throw new Error('Not implemented'); },
    update: async (options?: any) => { throw new Error('Not implemented'); },
    count: async (options?: any) => 0,
  },
  
  bot: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null,
    count: async (options?: any) => 0,
  },
  
  webhookEvent: {
    create: async (options?: any) => { throw new Error('Not implemented'); },
    count: async (options?: any) => 0,
  }
};

export { mockPrisma as prisma };
export default mockPrisma;