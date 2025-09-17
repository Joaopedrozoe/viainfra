import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';
import { authenticateToken } from '../middleware/auth';
import { multiTenant } from '../middleware/multiTenant';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  paginationSchema,
  idParamSchema,
} from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication and multi-tenant middleware to all routes
router.use(authenticateToken);
router.use(multiTenant);

/**
 * @route GET /departments
 * @desc Get all departments for the user's company
 * @access Private
 */
router.get('/', validateQuery(paginationSchema), asyncHandler(getDepartments));

/**
 * @route POST /departments
 * @desc Create a new department
 * @access Private (Admin only)
 */
router.post('/', validateBody(createDepartmentSchema), asyncHandler(createDepartment));

/**
 * @route GET /departments/:id
 * @desc Get a specific department by ID
 * @access Private
 */
router.get('/:id', validateParams(idParamSchema), asyncHandler(getDepartmentById));

/**
 * @route PUT /departments/:id
 * @desc Update a department
 * @access Private (Admin only)
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateDepartmentSchema),
  asyncHandler(updateDepartment)
);

/**
 * @route DELETE /departments/:id
 * @desc Delete a department
 * @access Private (Admin only)
 */
router.delete('/:id', validateParams(idParamSchema), asyncHandler(deleteDepartment));

export default router;