import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Middleware to validate request data using Zod schemas
 */
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[target];
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated data
      req[target] = validatedData;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to validate request body
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');

/**
 * Middleware to validate route parameters
 */
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');