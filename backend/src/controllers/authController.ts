import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/auth';
import logger from '../utils/logger';
import prisma from '../utils/database';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthenticatedRequest 
} from '../types';

/**
 * User login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({ message: 'Account is inactive' });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Ensure user has a company
    if (!user.company) {
      res.status(500).json({ message: 'User company not found' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as 'admin' | 'user' | 'agent' | 'attendant',
      company_id: user.company_id,
    });

    // Prepare response
    const { password_hash, ...userWithoutPassword } = user;
    const response: AuthResponse = {
      user: {
        ...userWithoutPassword,
        role: user.role as 'admin' | 'user' | 'agent' | 'attendant',
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString()
      },
      token,
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        settings: user.company.settings as Record<string, any>,
        created_at: user.company.created_at.toISOString(),
        updated_at: user.company.updated_at.toISOString()
      },
    };

    logger.info(`User ${user.email} logged in successfully`);
    res.json(response);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * User registration
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(501).json({ message: 'Registration not implemented in this simplified version' });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get current user profile
 */
export const me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Fetch full user details with company
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        company: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Ensure user has a company
    if (!user.company) {
      res.status(500).json({ message: 'User company not found' });
      return;
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ 
      user: {
        ...userWithoutPassword,
        role: user.role as 'admin' | 'user' | 'agent' | 'attendant',
        company: {
          id: user.company.id,
          name: user.company.name,
          slug: user.company.slug,
          settings: user.company.settings as Record<string, any>,
          created_at: user.company.created_at.toISOString(),
          updated_at: user.company.updated_at.toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * User logout (invalidate token)
 * Note: Since we're using stateless JWT, this would typically involve
 * adding the token to a blacklist or reducing the token expiration
 */
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // In a production environment, you might want to:
    // 1. Add the token to a blacklist stored in Redis
    // 2. Clear any session data
    // 3. Log the logout event
    
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // TODO: Add token to blacklist in Redis
      // await redis.sadd('blacklisted_tokens', token);
      // await redis.expire(`blacklisted_tokens:${token}`, JWT_EXPIRES_IN);
      
      logger.info(`User ${req.user?.id} logged out successfully`);
    }

    res.json({ 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
};

/**
 * Refresh JWT token
 */
export const refreshToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify user is still active
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
        is_active: true,
      },
      include: {
        company: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found or inactive' });
      return;
    }

    // Ensure user has a company
    if (!user.company) {
      res.status(500).json({ message: 'User company not found' });
      return;
    }

    // Generate new token
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as 'admin' | 'user' | 'agent' | 'attendant',
      company_id: user.company_id,
    });

    // Return new token and user data
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user' | 'agent' | 'attendant',
      company_id: user.company_id,
      is_active: user.is_active,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };

    const response: AuthResponse = {
      user: userWithoutPassword,
      token: newToken,
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        settings: user.company.settings as Record<string, any>,
        created_at: user.company.created_at.toISOString(),
        updated_at: user.company.updated_at.toISOString(),
      },
    };

    logger.info(`Token refreshed for user: ${user.email}`);
    res.json(response);
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
};