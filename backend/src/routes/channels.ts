import { Router } from 'express';
import {
  getChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
  getChannelStats,
} from '../controllers/channelController';
import { authenticateToken } from '../middleware/auth';
import { multiTenant } from '../middleware/multiTenant';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createChannelSchema,
  updateChannelSchema,
  paginationSchema,
  idParamSchema,
} from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication and multi-tenant middleware to all routes
router.use(authenticateToken);
router.use(multiTenant);

/**
 * @route GET /channels
 * @desc Get all channels for the user's company
 * @access Private
 */
router.get('/', validateQuery(paginationSchema), asyncHandler(getChannels));

/**
 * @route POST /channels
 * @desc Create a new channel
 * @access Private
 */
router.post('/', validateBody(createChannelSchema), asyncHandler(createChannel));

/**
 * @route GET /channels/:id
 * @desc Get a specific channel by ID
 * @access Private
 */
router.get('/:id', validateParams(idParamSchema), asyncHandler(getChannelById));

/**
 * @route PUT /channels/:id
 * @desc Update a channel
 * @access Private
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateChannelSchema),
  asyncHandler(updateChannel)
);

/**
 * @route DELETE /channels/:id
 * @desc Delete a channel
 * @access Private
 */
router.delete('/:id', validateParams(idParamSchema), asyncHandler(deleteChannel));

/**
 * @route GET /channels/:id/stats
 * @desc Get channel statistics
 * @access Private
 */
router.get('/:id/stats', validateParams(idParamSchema), asyncHandler(getChannelStats));

export default router;