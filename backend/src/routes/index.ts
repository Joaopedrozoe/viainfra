import { Router } from 'express';
import authRoutes from './auth';
import conversationRoutes from './conversations';
import contactRoutes from './contacts';
import channelRoutes from './channels';
import userRoutes from './users';
import agentRoutes from './agents';
import departmentRoutes from './departments';
import calendarRoutes from './calendar';
import webhookRoutes from './webhooks';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/conversations', conversationRoutes);
router.use('/contacts', contactRoutes);
router.use('/channels', channelRoutes);
router.use('/users', userRoutes);
router.use('/agents', agentRoutes);
router.use('/departments', departmentRoutes);
router.use('/calendar', calendarRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/whatsapp', webhookRoutes); // Alternative path for WhatsApp endpoints

export default router;