import { Router } from 'express';
import { verifyWhatsAppWebhook, handleWhatsAppWebhook } from '../controllers/whatsapp.controller';

const router = Router();

// Public routes for Meta Webhook
router.get('/webhook', verifyWhatsAppWebhook);
router.post('/webhook', handleWhatsAppWebhook);

export default router;
