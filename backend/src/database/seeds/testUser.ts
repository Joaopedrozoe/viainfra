import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

export async function seedTestUser() {
  try {
    // Check if test company exists
    let company = await prisma.company.findUnique({
      where: { slug: 'test-company' }
    });

    if (!company) {
      // Create test company
      company = await prisma.company.create({
        data: {
          name: 'Test Company',
          slug: 'test-company',
          settings: {}
        }
      });
      logger.info('Created test company');
    }

    // Check if test user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'novo.usuario@exemplo.com' }
    });

    if (!existingUser) {
      // Create test user with the exact credentials from the test
      const passwordHash = await bcrypt.hash('SenhaSegura@123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'novo.usuario@exemplo.com',
          password_hash: passwordHash,
          name: 'Novo Usuario',
          role: 'user',
          company_id: company.id,
          is_active: true
        }
      });

      logger.info(`Created test user: ${user.email}`);
      return user;
    } else {
      logger.info('Test user already exists');
      return existingUser;
    }
  } catch (error) {
    logger.error('Error seeding test user:', error);
    throw error;
  }
}