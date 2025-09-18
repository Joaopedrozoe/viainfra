import db from './database-simple';

// Mock Prisma client that delegates to our simple database adapter
const mockPrisma = {
  user: db.user,
  company: db.company,
  
  // Placeholder methods for other models to prevent errors
  conversation: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null, // Always return null for compatibility
    create: async (options?: any) => { 
      return {
        id: 'mock-conversation-id',
        sender_id: 'mock-sender-id',
        external_id: 'mock-external-id',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date()
      };
    },
    update: async (options?: any) => { 
      return {
        id: 'mock-conversation-id',
        sender_id: 'mock-sender-id',
        external_id: 'mock-external-id',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date()
      };
    },
    delete: async (options?: any) => { 
      return {
        id: 'mock-conversation-id',
        sender_id: 'mock-sender-id',
        external_id: 'mock-external-id',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date()
      };
    },
    count: async (options?: any) => 0,
  },
  
  contact: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null, // Always return null for compatibility
    create: async (options?: any) => { 
      return {
        id: 'mock-contact-id',
        name: 'Mock Contact',
        email: 'mock@contact.com',
        avatar_url: null,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date()
      };
    },
    update: async (options?: any) => { 
      return {
        id: 'mock-contact-id',
        name: 'Mock Contact',
        email: 'mock@contact.com',
        avatar_url: null,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date()
      };
    },
    delete: async (options?: any) => { 
      return {
        id: 'mock-contact-id',
        name: 'Mock Contact',
        email: 'mock@contact.com',
        avatar_url: null,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date()
      };
    },
    count: async (options?: any) => 0,
  },
  
  channel: {
    findMany: async (options?: any) => [],
    findUnique: async (options?: any) => null,
    findFirst: async (options?: any) => null,
    create: async (options?: any) => { 
      return {
        id: 'mock-channel-id',
        name: 'Mock Channel',
        updated_at: new Date(),
        created_at: new Date()
      };
    },
    update: async (options?: any) => { 
      return {
        id: 'mock-channel-id',
        name: 'Mock Channel',
        updated_at: new Date(),
        created_at: new Date()
      };
    },
    delete: async (options?: any) => { 
      return {
        id: 'mock-channel-id',
        name: 'Mock Channel',
        updated_at: new Date(),
        created_at: new Date()
      };
    },
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