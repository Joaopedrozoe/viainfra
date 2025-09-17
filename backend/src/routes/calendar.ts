import { Router } from 'express';
import {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendarController';
import { authenticateToken } from '../middleware/auth';
import { multiTenant } from '../middleware/multiTenant';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  paginationSchema,
  idParamSchema,
} from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Apply authentication and multi-tenant middleware to all routes
router.use(authenticateToken);
router.use(multiTenant);

/**
 * @route GET /calendar/events
 * @desc Get all calendar events for the user's company
 * @access Private
 */
router.get('/events', validateQuery(paginationSchema), asyncHandler(getCalendarEvents));

/**
 * @route POST /calendar/events
 * @desc Create a new calendar event
 * @access Private
 */
router.post('/events', validateBody(createCalendarEventSchema), asyncHandler(createCalendarEvent));

/**
 * @route GET /calendar/events/:id
 * @desc Get a specific calendar event by ID
 * @access Private
 */
router.get('/events/:id', validateParams(idParamSchema), asyncHandler(getCalendarEventById));

/**
 * @route PUT /calendar/events/:id
 * @desc Update a calendar event
 * @access Private
 */
router.put(
  '/events/:id',
  validateParams(idParamSchema),
  validateBody(updateCalendarEventSchema),
  asyncHandler(updateCalendarEvent)
);

/**
 * @route DELETE /calendar/events/:id
 * @desc Delete a calendar event
 * @access Private
 */
router.delete('/events/:id', validateParams(idParamSchema), asyncHandler(deleteCalendarEvent));

export default router;