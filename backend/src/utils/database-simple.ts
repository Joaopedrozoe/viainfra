import { Pool } from 'pg';
import logger from './logger';

// Create a connection pool with explicit configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'whitelabel_mvp',
  user: 'postgres',
  password: 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Simple database interface that mimics Prisma's user operations
export const db = {
  user: {
    findUnique: async (options: { where: { email?: string; id?: string; is_active?: boolean }, include?: any }) => {
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
        
        // Transform to match Prisma's structure
        const user = {
          id: row.id,
          email: row.email,
          password_hash: row.password_hash,
          name: row.name,
          role: row.role,
          company_id: row.company_id,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          company: options.include?.company ? {
            id: row.company_id,
            name: row.company_name,
            slug: row.company_slug,
            settings: row.company_settings || {},
            created_at: row.company_created_at,
            updated_at: row.company_updated_at
          } : undefined
        };
        
        return user;
      } catch (error) {
        logger.error('Database query error:', error);
        throw error;
      }
    },
    
    create: async (options: { data: any, include?: any }) => {
      try {
        const { name, email, password_hash, role = 'user', company_id } = options.data;
        const result = await pool.query(
          'INSERT INTO users (name, email, password_hash, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [name, email, password_hash, role, company_id]
        );
        
        const row = result.rows[0];
        
        // If include company is requested, fetch it
        let companyData: any = null;
        if (options.include?.company && row.company_id) {
          const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [row.company_id]);
          companyData = companyResult.rows[0] || null;
        }
        
        return {
          id: row.id,
          email: row.email,
          password_hash: row.password_hash,
          name: row.name,
          role: row.role,
          company_id: row.company_id,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          company: companyData ? {
            id: companyData.id,
            name: companyData.name,
            slug: companyData.slug,
            settings: companyData.settings || {},
            created_at: companyData.created_at,
            updated_at: companyData.updated_at
          } : undefined
        };
      } catch (error) {
        logger.error('Database create user error:', error);
        throw error;
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
      try {
        const { name, slug, settings = {} } = options.data;
        const result = await pool.query(
          'INSERT INTO companies (name, slug, settings) VALUES ($1, $2, $3) RETURNING *',
          [name, slug, JSON.stringify(settings)]
        );
        return result.rows[0];
      } catch (error) {
        logger.error('Database create company error:', error);
        throw error;
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