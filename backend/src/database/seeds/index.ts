import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  try {
    // Create default company
    const company = await prisma.company.upsert({
      where: { slug: 'viainfra' },
      update: {},
      create: {
        name: 'ViaInfra',
        slug: 'viainfra',
        settings: {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          currency: 'BRL',
        },
      },
    });

    logger.info(`Company created/updated: ${company.name} (${company.slug})`);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@viainfra.com' },
      update: {},
      create: {
        email: 'admin@viainfra.com',
        password_hash: adminPassword,
        name: 'Administrador',
        role: 'admin',
        company_id: company.id,
        is_active: true,
      },
    });

    logger.info(`Admin user created/updated: ${adminUser.email}`);

    // Create sample users
    const sampleUsers = [
      {
        email: 'elisabete.silva@viainfra.com.br',
        name: 'Elisabete Silva',
        role: 'admin',
      },
      {
        email: 'atendimento@viainfra.com.br',
        name: 'Joicy Souza',
        role: 'attendant',
      },
      {
        email: 'manutencao@viainfra.com.br',
        name: 'Suelem Souza',
        role: 'attendant',
      },
      {
        email: 'gestaofinanceira@viainfra.com.br',
        name: 'Giovanna Ferreira',
        role: 'attendant',
      },
      {
        email: 'sandra.romano@vialogistic.com.br',
        name: 'Sandra Romano',
        role: 'attendant',
      },
    ];

    // Add the test user for login validation
    const testUserPassword = await bcrypt.hash('SenhaSegura@123', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'novo.usuario@exemplo.com' },
      update: {},
      create: {
        email: 'novo.usuario@exemplo.com',
        password_hash: testUserPassword,
        name: 'Test User',
        role: 'user',
        company_id: company.id,
        is_active: true,
      },
    });

    logger.info(`Test user created/updated: ${testUser.email}`);

    for (const userData of sampleUsers) {
      const userPassword = await bcrypt.hash('123456', 10); // Default password
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password_hash: userPassword,
          name: userData.name,
          role: userData.role,
          company_id: company.id,
          is_active: true,
        },
      });

      logger.info(`Sample user created/updated: ${user.email}`);
    }

    // Create sample channels
    const sampleChannels = [
      {
        name: 'WhatsApp Principal',
        type: 'whatsapp',
        phone_number: '+5511999999999',
        instance_id: 'main_instance',
        status: 'disconnected',
        settings: {
          autoReply: true,
          welcomeMessage: 'Olá! Como posso ajudar você?',
        },
      },
      {
        name: 'Instagram Business',
        type: 'instagram',
        status: 'disconnected',
        settings: {
          autoReply: false,
        },
      },
      {
        name: 'Site Institucional',
        type: 'website',
        status: 'connected',
        settings: {
          autoReply: true,
          welcomeMessage: 'Bem-vindo ao nosso chat!',
        },
      },
    ];

    for (const channelData of sampleChannels) {
      const channel = await prisma.channel.upsert({
        where: {
          name_company_id: {
            name: channelData.name,
            company_id: company.id,
          },
        },
        update: {},
        create: {
          name: channelData.name,
          type: channelData.type,
          phone_number: channelData.phone_number,
          instance_id: channelData.instance_id,
          status: channelData.status as any,
          settings: channelData.settings,
          company_id: company.id,
        },
      });

      logger.info(`Sample channel created/updated: ${channel.name}`);
    }

    // Create sample contacts
    const sampleContacts = [
      {
        name: 'João Silva',
        phone: '+5511888888888',
        email: 'joao.silva@email.com',
        metadata: {
          source: 'website',
          tags: ['cliente', 'vip'],
        },
      },
      {
        name: 'Maria Santos',
        phone: '+5511777777777',
        email: 'maria.santos@email.com',
        metadata: {
          source: 'whatsapp',
          tags: ['prospect'],
        },
      },
      {
        name: 'Pedro Oliveira',
        phone: '+5511666666666',
        metadata: {
          source: 'instagram',
          tags: ['seguidor'],
        },
      },
    ];

    for (const contactData of sampleContacts) {
      const contact = await prisma.contact.upsert({
        where: {
          phone_company_id: {
            phone: contactData.phone,
            company_id: company.id,
          },
        },
        update: {},
        create: {
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email,
          metadata: contactData.metadata,
          company_id: company.id,
        },
      });

      logger.info(`Sample contact created/updated: ${contact.name || contact.phone}`);
    }

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });