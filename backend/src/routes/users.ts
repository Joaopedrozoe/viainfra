import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '@/controllers/userController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';
import { multiTenant } from '@/middleware/multiTenant';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  paginationSchema,
  idParamSchema,
} from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Apply authentication and multi-tenant middleware to all routes
router.use(authenticateToken);
router.use(multiTenant);

/**
 * @route GET /users
 * @desc Get all users for the user's company
 * @access Private (Admin only)
 */
router.get('/', requireAdmin, validateQuery(paginationSchema), asyncHandler(getUsers));

/**
 * @route POST /users
 * @desc Create a new user
 * @access Private (Admin only)
 */
router.post('/', requireAdmin, validateBody(createUserSchema), asyncHandler(createUser));

/**
 * @route GET /users/:id
 * @desc Get a specific user by ID
 * @access Private
 */
router.get('/:id', validateParams(idParamSchema), asyncHandler(getUserById));

/**
 * @route PUT /users/:id
 * @desc Update a user
 * @access Private (Admin or own profile)
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateUserSchema),
  asyncHandler(updateUser)
);

/**
 * @route DELETE /users/:id
 * @desc Delete a user
 * @access Private (Admin only)
 */
router.delete('/:id', requireAdmin, validateParams(idParamSchema), asyncHandler(deleteUser));

/**
 * @route GET /users/:id/stats
 * @desc Get user statistics
 * @access Private
 */
router.get('/:id/stats', validateParams(idParamSchema), asyncHandler(getUserStats));

export default router;