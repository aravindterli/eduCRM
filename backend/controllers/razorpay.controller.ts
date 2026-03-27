import { Request, Response } from 'express';
import crypto from 'crypto';
import FeeService from '../services/fee.service';

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    return res.status(400).json({ message: 'Missing signature' });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[Razorpay][Webhook] Signature verification failed');
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const { event, payload } = req.body;
  console.log(`[Razorpay][Webhook] Received event: ${event}`);

  try {
    if (event === 'payment_link.paid') {
      const paymentLink = payload.payment_link.entity;
      const referenceId = paymentLink.reference_id; // Format: F_{feeId}
      
      if (referenceId?.startsWith('F_')) {
        const parts = referenceId.split('_');
        const feeId = parts[1];
        
        await FeeService.recordPayment({
          feeId,
          amount: paymentLink.amount_paid / 100, // Convert from paise
          method: 'Razorpay (Online)',
          transactionId: paymentLink.payment_id,
        });
        
        console.log(`[Razorpay][Webhook] Successfully processed payment for Fee ID: ${feeId}`);
      }
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error(`[Razorpay][Webhook] Processing failed: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
