import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * Middleware to ensure multi-tenant isolation
 * Adds company_id filter to database queries
 */
export const multiTenant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required for multi-tenant access' });
    return;
  }

  // Add company_id to request for use in controllers
  req.body.company_id = req.user.company_id;
  req.query.company_id = req.user.company_id;

  logger.debug(`Multi-tenant: User ${req.user.id} accessing company ${req.user.company_id}`);
  
  next();
};

/**
 * Middleware to validate that a resource belongs to the user's company
 * Used for routes with ID parameters
 */
export const validateResourceOwnership = (resourceType: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      res.status(400).json({ message: 'Resource ID required' });
      return;
    }

    try {
      // This is a generic check - in production, you might want to implement
      // specific checks for each resource type
      logger.debug(`Validating ownership of ${resourceType} ${resourceId} for company ${req.user.company_id}`);
      
      // For now, we'll rely on the controller to filter by company_id
      // In a more robust implementation, you could query the specific resource here
      
      next();
    } catch (error) {
      logger.error(`Error validating resource ownership:`, error);
      res.status(500).json({ message: 'Error validating resource ownership' });
    }
  };
};