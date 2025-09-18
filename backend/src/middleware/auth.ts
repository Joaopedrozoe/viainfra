import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/auth';
import { UserWithoutPassword, AuthenticatedRequest } from '../types';
import prisma from '../utils/database';
import logger from '../utils/logger';

/**
 * Middleware to authenticate users using JWT tokens
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded = verifyToken(token);

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.is_active) {
      res.status(401).json({ message: 'User not found or inactive' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user' | 'agent' | 'attendant',
      company_id: user.company_id,
      is_active: user.is_active,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString()
    };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
};

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
      return;
    }

    next();
  };
};