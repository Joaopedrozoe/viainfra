import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

/**
 * @route GET /test/health
 * @desc Simple health check without database
 * @access Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @route POST /test/echo
 * @desc Echo back request data for testing
 * @access Public
 */
router.post('/echo', (req: Request, res: Response) => {
  res.json({
    message: 'Echo test successful',
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
});

export default router;
