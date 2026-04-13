import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const verifyWhatsAppWebhook = async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ WhatsApp Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

export const handleWhatsAppWebhook = async (req: Request, res: Response) => {
  const body = req.body;

  // Log the receipt of a webhook event
  console.log('📥 Incoming WhatsApp Webhook:', JSON.stringify(body, null, 2));

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // Phone number
      const msgBody = message.text ? message.text.body : '[Media/Other]';

      console.log(`📱 Message from ${from}: ${msgBody}`);

      // Find the lead by phone number
      const lead = await prisma.lead.findFirst({
        where: {
          phone: {
            contains: from.slice(-10) // Match last 10 digits as a fallback
          }
        }
      });

      if (lead) {
        // Log the incoming message as an interaction
        await prisma.communicationLog.create({
          data: {
            leadId: lead.id,
            type: 'WHATSAPP',
            direction: 'INBOUND',
            message: msgBody,
            status: 'RECEIVED'
          }
        });
        console.log(`✅ Logged inbound message for lead: ${lead.name}`);
      } else {
        console.log(`⚠️ Received message from unknown number: ${from}`);
      }
    }
    
    // Process status updates (delivered, read, etc.)
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.statuses &&
      body.entry[0].changes[0].value.statuses[0]
    ) {
      const status = body.entry[0].changes[0].value.statuses[0];
      console.log(`📊 Message status update: ${status.status} for recipient ${status.recipient_id}`);
    }

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
};
