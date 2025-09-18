// Mock database implementation for when Prisma is not available
// This allows the server to start and provide proper error messages

interface MockUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  company_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  company: {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, any>;
    created_at: Date;
    updated_at: Date;
  };
}

// Mock data for testing
const mockUsers: MockUser[] = [
  {
    id: 'mock-user-id-1',
    email: 'novo.usuario@exemplo.com',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeO.f3GyHV3mLM.hO', // SenhaSegura@123
    name: 'Usuário Teste',
    role: 'user',
    company_id: 'mock-company-id-1',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    company: {
      id: 'mock-company-id-1',
      name: 'Empresa Teste',
      slug: 'empresa-teste',
      settings: {},
      created_at: new Date(),
      updated_at: new Date(),
    }
  }
];

export const mockPrisma = {
  user: {
    findUnique: async ({ where, include }: { where: { email: string }, include?: any }) => {
      const user = mockUsers.find(u => u.email === where.email);
      return user || null;
    },
    
    create: async ({ data, include }: { data: any, include?: any }) => {
      const newUser: MockUser = {
        id: `mock-user-id-${Date.now()}`,
        email: data.email,
        password_hash: data.password_hash,
        name: data.name,
        role: data.role || 'user',
        company_id: data.company_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        company: mockUsers[0].company // Use first company as default
      };
      
      mockUsers.push(newUser);
      return newUser;
    },
    
    findFirst: async () => {
      return mockUsers[0] || null;
    }
  },
  
  company: {
    findFirst: async () => {
      return mockUsers[0]?.company || null;
    },
    
    create: async ({ data }: { data: any }) => {
      return {
        id: `mock-company-id-${Date.now()}`,
        name: data.name,
        slug: data.slug,
        settings: data.settings || {},
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
  }
};

// Export both real and mock prisma based on availability
let prisma: any;

try {
  // Try to use real Prisma
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('✅ Using real Prisma client');
} catch (error) {
  // Fall back to mock
  prisma = mockPrisma;
  console.log('⚠️  Using mock Prisma client - database operations will be simulated');
  console.log('   Run "npx prisma generate" to use real database');
}

export { prisma };
export default prisma;