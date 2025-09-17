import { Router } from 'express';
import {
  handleWhatsAppWebhook,
  getWhatsAppQRCode,
} from '../controllers/whatsappController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route POST /webhooks/whatsapp
 * @desc Handle WhatsApp webhook from Evolution API
 * @access Public (webhook)
 */
router.post('/whatsapp', asyncHandler(handleWhatsAppWebhook));

/**
 * @route GET /whatsapp/qr/:instanceId
 * @desc Get QR Code for WhatsApp connection
 * @access Public (for now, should be protected in production)
 */
router.get('/qr/:instanceId', asyncHandler(getWhatsAppQRCode));

export default router;