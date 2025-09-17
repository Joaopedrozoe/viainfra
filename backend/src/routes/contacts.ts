import { Router } from 'express';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getContactHistory,
} from '../controllers/contactController';
import { authenticateToken } from '../middleware/auth';
import { multiTenant } from '../middleware/multiTenant';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createContactSchema,
  updateContactSchema,
  paginationSchema,
  idParamSchema,
} from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication and multi-tenant middleware to all routes
router.use(authenticateToken);
router.use(multiTenant);

/**
 * @route GET /contacts
 * @desc Get all contacts for the user's company
 * @access Private
 */
router.get('/', validateQuery(paginationSchema), asyncHandler(getContacts));

/**
 * @route POST /contacts
 * @desc Create a new contact
 * @access Private
 */
router.post('/', validateBody(createContactSchema), asyncHandler(createContact));

/**
 * @route GET /contacts/:id
 * @desc Get a specific contact by ID
 * @access Private
 */
router.get('/:id', validateParams(idParamSchema), asyncHandler(getContactById));

/**
 * @route PUT /contacts/:id
 * @desc Update a contact
 * @access Private
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateContactSchema),
  asyncHandler(updateContact)
);

/**
 * @route DELETE /contacts/:id
 * @desc Delete a contact
 * @access Private
 */
router.delete('/:id', validateParams(idParamSchema), asyncHandler(deleteContact));

/**
 * @route GET /contacts/:id/history
 * @desc Get contact conversation history
 * @access Private
 */
router.get(
  '/:id/history',
  validateParams(idParamSchema),
  validateQuery(paginationSchema),
  asyncHandler(getContactHistory)
);

export default router;