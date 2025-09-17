import { Router } from 'express';
import {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  getAgentMetrics,
} from '../controllers/agentController';
import { authenticateToken } from '../middleware/auth';
import { multiTenant } from '../middleware/multiTenant';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createAgentSchema,
  updateAgentSchema,
  paginationSchema,
  idParamSchema,
} from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication and multi-tenant middleware to all routes
router.use(authenticateToken);
router.use(multiTenant);

/**
 * @route GET /agents
 * @desc Get all agents for the user's company
 * @access Private
 */
router.get('/', validateQuery(paginationSchema), asyncHandler(getAgents));

/**
 * @route POST /agents
 * @desc Create a new agent
 * @access Private
 */
router.post('/', validateBody(createAgentSchema), asyncHandler(createAgent));

/**
 * @route GET /agents/:id
 * @desc Get a specific agent by ID
 * @access Private
 */
router.get('/:id', validateParams(idParamSchema), asyncHandler(getAgentById));

/**
 * @route PUT /agents/:id
 * @desc Update an agent
 * @access Private
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateAgentSchema),
  asyncHandler(updateAgent)
);

/**
 * @route DELETE /agents/:id
 * @desc Delete an agent
 * @access Private
 */
router.delete('/:id', validateParams(idParamSchema), asyncHandler(deleteAgent));

/**
 * @route GET /agents/:id/metrics
 * @desc Get agent metrics
 * @access Private
 */
router.get('/:id/metrics', validateParams(idParamSchema), asyncHandler(getAgentMetrics));

export default router;