import { Router } from 'express';
import { login, register, me } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';
import { validateBody } from '@/middleware/validation';
import { loginSchema, registerSchema } from '@/utils/validation';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

/**
 * @route POST /auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', validateBody(loginSchema), asyncHandler(login));

/**
 * @route POST /auth/register
 * @desc User registration
 * @access Public
 */
router.post('/register', validateBody(registerSchema), asyncHandler(register));

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateToken, asyncHandler(me));

export default router;