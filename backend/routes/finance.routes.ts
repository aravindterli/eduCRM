import { Router } from 'express';
import { recordPayment, getAllFees, getRevenueStats, generatePaymentLink, syncPaymentStatus, getExistingLink } from '../controllers/finance.controller';
import { handleRazorpayWebhook } from '../controllers/razorpay.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public webhook route (Razorpay needs it to be unauthenticated)
router.post('/webhook', handleRazorpayWebhook);

router.use(authenticate);
router.use(authorize(['ADMIN', 'FINANCE']));

router.get('/fees', getAllFees);
router.get('/stats', getRevenueStats);
router.get('/fees/:id/sync', syncPaymentStatus);
router.get('/fees/:id/link', getExistingLink);
router.post('/fees/:id/link', generatePaymentLink);
router.post('/payments', recordPayment);

export default router;
