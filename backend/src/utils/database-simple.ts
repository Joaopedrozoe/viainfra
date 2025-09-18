import { Pool } from 'pg';
import logger from './logger';

// Create a connection pool with explicit configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/whitelabel_mvp',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Simple database interface that mimics Prisma's user operations
export const db = {
  user: {
    findUnique: async (options: { where: { email?: string; id?: string; is_active?: boolean }, include?: any, select?: any }) => {
      try {
        let query = '';
        let values: any[] = [];
        
        if (options.where.email) {
          query = `
            SELECT u.*, c.id as company_id, c.name as company_name, c.slug as company_slug, 
                   c.settings as company_settings, c.created_at as company_created_at, 
                   c.updated_at as company_updated_at
            FROM users u 
            LEFT JOIN companies c ON u.company_id = c.id 
            WHERE u.email = $1
          `;
          values = [options.where.email];
        } else if (options.where.id) {
          query = `
            SELECT u.*, c.id as company_id, c.name as company_name, c.slug as company_slug, 
                   c.settings as company_settings, c.created_at as company_created_at, 
                   c.updated_at as company_updated_at
            FROM users u 
            LEFT JOIN companies c ON u.company_id = c.id 
            WHERE u.id = $1
          `;
          values = [options.where.id];
          
          if (options.where.is_active !== undefined) {
            query += ' AND u.is_active = $2';
            values.push(options.where.is_active);
          }
        }
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const row = result.rows[0];
        
        // Ensure company data exists when included
        const hasCompanyData = row.company_id && row.company_name;
        
        // Transform to match Prisma's structure
        const user = {
          id: row.id,
          email: row.email,
          password_hash: row.password_hash,
          name: row.name,
          role: row.role,
          company_id: row.company_id,
          is_active: row.is_active,
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at),
          company: (options.include?.company && hasCompanyData) ? {
            id: row.company_id,
            name: row.company_name,
            slug: row.company_slug,
            settings: row.company_settings || {},
            created_at: new Date(row.company_created_at),
            updated_at: new Date(row.company_updated_at)
          } : undefined
        };
        
        return user;
      } catch (error) {
        logger.error('Database query error:', error);
        throw error;
      }
    },
    
    findMany: async (options?: any) => {
      // Return empty array for compatibility
      return [];
    },
    
    create: async (options: { data: any, include?: any, select?: any }) => {
      // Simplified create method - return a mock user for type compatibility
      // This is just for compilation, actual registration is not implemented
      return {
        id: 'mock-id',
        email: options.data.email || 'mock@example.com',
        password_hash: options.data.password_hash || 'mock-hash',
        name: options.data.name || 'Mock User',
        role: options.data.role || 'user',
        company_id: options.data.company_id || 'mock-company-id',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        company: options.include?.company ? {
          id: 'mock-company-id',
          name: 'Mock Company',
          slug: 'mock-company',
          settings: {},
          created_at: new Date(),
          updated_at: new Date()
        } : undefined
      };
    },
    
    update: async (options: { where: any, data: any, include?: any, select?: any }) => {
      // Mock update method for type compatibility
      return {
        id: 'mock-updated-id',
        email: options.data.email || 'updated@example.com',
        password_hash: options.data.password_hash || 'updated-hash',
        name: options.data.name || 'Updated User',
        role: options.data.role || 'user',
        company_id: options.data.company_id || 'mock-company-id',
        is_active: options.data.is_active !== undefined ? options.data.is_active : true,
        created_at: new Date(),
        updated_at: new Date(),
        company: options.include?.company ? {
          id: 'mock-company-id',
          name: 'Mock Company',
          slug: 'mock-company',
          settings: {},
          created_at: new Date(),
          updated_at: new Date()
        } : undefined
      };
    },
    
    findFirst: async (options?: any) => {
      // Return first user for compatibility
      try {
        const result = await pool.query('SELECT * FROM users LIMIT 1');
        return result.rows[0] || null;
      } catch (error) {
        logger.error('Database query error:', error);
        return null;
      }
    },
    
    count: async (options?: any) => {
      // Return count of users
      try {
        const result = await pool.query('SELECT COUNT(*) as count FROM users');
        return parseInt(result.rows[0].count);
      } catch (error) {
        logger.error('Database query error:', error);
        return 0;
      }
    }
  },
  
  company: {
    findFirst: async () => {
      try {
        const result = await pool.query('SELECT * FROM companies LIMIT 1');
        return result.rows[0] || null;
      } catch (error) {
        logger.error('Database query error:', error);
        throw error;
      }
    },
    
    findUnique: async (options: { where: { slug: string } }) => {
      try {
        const result = await pool.query('SELECT * FROM companies WHERE slug = $1', [options.where.slug]);
        return result.rows[0] || null;
      } catch (error) {
        logger.error('Database query error:', error);
        throw error;
      }
    },
    
    create: async (options: { data: any }) => {
      // Mock create method for type compatibility
      return {
        id: 'mock-company-id',
        name: options.data.name || 'Mock Company',
        slug: options.data.slug || 'mock-company',
        settings: options.data.settings || {},
        created_at: new Date(),
        updated_at: new Date()
      };
    },
    
    count: async () => {
      try {
        const result = await pool.query('SELECT COUNT(*) as count FROM companies');
        return parseInt(result.rows[0].count);
      } catch (error) {
        logger.error('Database query error:', error);
        return 0;
      }
    }
  }
};

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

export default db;