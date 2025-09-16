import { Router } from 'express';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  assignConversation,
  createConversation,
} from '@/controllers/conversationController';
import { authenticateToken } from '@/middleware/auth';
import { multiTenant } from '@/middleware/multiTenant';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation';
import {
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
  paginationSchema,
  idParamSchema,
} from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Apply authentication and multi-tenant middleware to all routes
router.use(authenticateToken);
router.use(multiTenant);

/**
 * @route GET /conversations
 * @desc Get all conversations for the user's company
 * @access Private
 */
router.get('/', validateQuery(paginationSchema), asyncHandler(getConversations));

/**
 * @route POST /conversations
 * @desc Create a new conversation
 * @access Private
 */
router.post('/', validateBody(createConversationSchema), asyncHandler(createConversation));

/**
 * @route GET /conversations/:id/messages
 * @desc Get messages for a specific conversation
 * @access Private
 */
router.get(
  '/:id/messages',
  validateParams(idParamSchema),
  validateQuery(paginationSchema),
  asyncHandler(getConversationMessages)
);

/**
 * @route POST /conversations/:id/messages
 * @desc Send a message in a conversation
 * @access Private
 */
router.post(
  '/:id/messages',
  validateParams(idParamSchema),
  validateBody(sendMessageSchema),
  asyncHandler(sendMessage)
);

/**
 * @route PUT /conversations/:id/assign
 * @desc Assign conversation to a user
 * @access Private
 */
router.put(
  '/:id/assign',
  validateParams(idParamSchema),
  validateBody(updateConversationSchema),
  asyncHandler(assignConversation)
);

export default router;