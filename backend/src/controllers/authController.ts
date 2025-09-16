import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { hashPassword, comparePassword, generateToken } from '@/utils/auth';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import prisma from '@/utils/database';
import logger from '@/utils/logger';
import { AuthenticatedRequest } from '@/middleware/auth';

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
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    });

    // Prepare response
    const { password_hash, ...userWithoutPassword } = user;
    const response: AuthResponse = {
      user: userWithoutPassword,
      token,
      company: user.company,
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
    const { name, email, password, company_name, company_slug }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create company if provided
    let company;
    if (company_name && company_slug) {
      // Check if company slug already exists
      const existingCompany = await prisma.company.findUnique({
        where: { slug: company_slug },
      });

      if (existingCompany) {
        res.status(409).json({ message: 'Company slug already exists' });
        return;
      }

      company = await prisma.company.create({
        data: {
          name: company_name,
          slug: company_slug,
          settings: {},
        },
      });
    } else {
      // Use default company (assumes there's one)
      company = await prisma.company.findFirst();
      if (!company) {
        res.status(500).json({ message: 'No default company found' });
        return;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: 'user',
        company_id: company.id,
      },
      include: {
        company: true,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    });

    // Prepare response
    const { password_hash: _, ...userWithoutPassword } = user;
    const response: AuthResponse = {
      user: userWithoutPassword,
      token,
      company: user.company,
    };

    logger.info(`User ${user.email} registered successfully`);
    res.status(201).json(response);
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        company: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};