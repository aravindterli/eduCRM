import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import twilio from 'twilio';
import axios from 'axios';

export class CommunicationService {
  private transporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio | null;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.office365.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // Must be false for 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC') && process.env.TWILIO_AUTH_TOKEN && !process.env.TWILIO_AUTH_TOKEN.includes('auth_token_here')) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      this.twilioClient = null;
    }
  }
  async sendEmail(to: string, templateKey: string, data: any, leadId?: string) {
    console.log(`[Email] Dispatching ${templateKey} to ${to}...`);
    
    try {
      if (!to) return { success: false, error: 'No email provided' };

      // 1. Fetch template from DB if it exists, otherwise use fallback
      const dbTemplate = await prisma.messageTemplate.findFirst({
        where: { 
          OR: [
            { name: templateKey },
            { id: templateKey }
          ],
          channel: 'EMAIL'
        }
      });

      let subject = `EduCRM: ${templateKey.replace(/_/g, ' ').toUpperCase()}`;
      let content = `Hello ${data.name},\n\nThis is a notification for: ${templateKey}\n\nThank you, EduCRM Team.`;

      if (dbTemplate) {
        subject = dbTemplate.subject || subject;
        content = dbTemplate.content;
      }

      // 2. Format content with variable substitution
      const formattedSubject = this.formatTemplate(subject, data);
      const formattedContent = this.formatTemplate(content, data);
      
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EduCRM Admissions" <no-reply@educrm.com>',
        to,
        subject: formattedSubject,
        text: formattedContent.replace(/<[^>]*>?/gm, ''), // Strip HTML for plain text fallback
        html: formattedContent.includes('<') ? formattedContent : `<div>${formattedContent.replace(/\n/g, '<br>')}</div>`
      });
      
      console.log(`[Email] Dispatched successfully: ${info.messageId}`);
      
      if (leadId) {
        await prisma.communicationLog.create({
          data: {
            leadId,
            type: 'EMAIL',
            direction: 'OUTBOUND',
            message: `Subject: ${formattedSubject}\nContent Preview: ${formattedContent.substring(0, 100)}...`,
            status: 'SENT'
          }
        });
      }
      return { success: true, provider: 'SMTP', messageId: info.messageId };
    } catch (error: any) {
      console.error(`[Email] Failed to send to ${to}:`, error.message);
      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, type: 'EMAIL', direction: 'OUTBOUND', message: `Delivery Failed: ${error.message}`, status: 'FAILED' }
        });
      }
      return { success: false, error: error.message };
    }
  }

  private formatTemplate(template: string, data: any): string {
    return template.replace(/\${(\w+)}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  async sendSMS(phone: string, message: string, leadId?: string) {
    console.log(`[SMS] Dispatching to ${phone}...`);
    try {
      if (this.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
      } else {
        console.log(`[SMS][Simulation] Twilio not configured. Simulated SMS sent to ${phone}: ${message}`);
      }

      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, type: 'SMS', direction: 'OUTBOUND', message, status: 'SENT' }
        });
      }
      return { success: true, provider: 'Twilio' };
    } catch (error: any) {
      console.error(`[SMS] Failed to send to ${phone}:`, error.message);
      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, type: 'SMS', direction: 'OUTBOUND', message: `FAILED: ${message}`, status: 'FAILED' }
        });
      }
      return { success: false, error: error.message };
    }
  }

  async sendWhatsApp(phone: string, message: string, leadId?: string) {
    console.log(`[WhatsApp] Dispatching to ${phone}...`);
    try {
      if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID) {
        await axios.post(
          `https://graph.facebook.com/v17.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        console.log(`[WhatsApp][Simulation] Meta API not configured. Simulated msg sent to ${phone}: ${message}`);
      }

      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, type: 'WHATSAPP', direction: 'OUTBOUND', message, status: 'SENT' }
        });
      }
      return { success: true, provider: 'Meta' };
    } catch (error: any) {
      console.error(`[WhatsApp] Failed to send to ${phone}:`, error.message);
      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, type: 'WHATSAPP', direction: 'OUTBOUND', message: `FAILED: ${message}`, status: 'FAILED' }
        });
      }
      return { success: false, error: error.message };
    }
  }

  async sendAutoResponse(lead: any) {
    const message = `Hi ${lead.name}, thanks for inquiring about ${lead.interestedProgram?.name || 'our programs'}. A counselor will contact you soon.`;
    await this.sendWhatsApp(lead.phone, message, lead.id);
    if (lead.email) {
      await this.sendEmail(lead.email, 'welcome_lead', { name: lead.name }, lead.id);
    }
  }
}

export default new CommunicationService();
