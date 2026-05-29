import { Request, Response } from 'express';
import crypto from 'crypto';
import FeeService from '../services/fee.service';
import ConnectorCredentials from '../utils/connectorCredentials';

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  // Resolve the webhook secret — prefer the tenant that owns the payment link
  // The tenantId may be embedded in the reference_id (format: F_{feeId}) from the event payload
  let secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here';

  try {
    // Best-effort: try to extract tenantId from the fee to get per-tenant webhook secret
    const referenceId = req.body?.payload?.payment_link?.entity?.reference_id as string | undefined;
    if (referenceId?.startsWith('F_')) {
      const feeId = referenceId.split('_')[1];
      const { default: prisma } = await import('../config/prisma');
      const fee = await prisma.fee.findUnique({ where: { id: feeId }, select: { tenantId: true } });
      if (fee?.tenantId) {
        const creds = await ConnectorCredentials.getRazorpay(fee.tenantId).catch(() => null);
        if (creds?.webhookSecret) secret = creds.webhookSecret;
      }
    }
  } catch (_) { /* use default secret */ }

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
