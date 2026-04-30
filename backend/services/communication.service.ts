import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import twilio from 'twilio';
import axios from 'axios';

export class CommunicationService {
  public transporter: nodemailer.Transporter;
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
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
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

      const dbTemplate = await prisma.messageTemplate.findFirst({
        where: {
          OR: [{ name: templateKey }, { id: templateKey }],
          channel: 'EMAIL'
        }
      });

      let subject = `CentraCRM: ${templateKey.replace(/_/g, ' ').toUpperCase()}`;
      let bodyText = `Hello ${data.name},\nThis is a notification for: ${templateKey}\nThank you, CentraCRM Team.`;

      if (dbTemplate) {
        subject = dbTemplate.subject || subject;
        bodyText = dbTemplate.content;
      }

      const formattedSubject = this.formatTemplate(subject, data);
      const formattedContent = this.formatTemplate(bodyText, data);

      const html = this.getBaseTemplate(formattedSubject, formattedContent);

      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"The Foundrys" <no-reply@centracrm.com>',
        to,
        subject: formattedSubject,
        text: formattedContent.replace(/<[^>]*>?/gm, ''),
        html
      });

      console.log(`[Email] Dispatched successfully: ${info.messageId}`);

      if (leadId) {
        await prisma.communicationLog.create({
          data: {
            leadId,
            type: 'EMAIL',
            direction: 'OUTBOUND',
            message: `Subject: ${formattedSubject}`,
            status: 'SENT'
          }
        });
      }
      return { success: true, provider: 'SMTP', messageId: info.messageId };
    } catch (error: any) {
      console.error(`[Email] Failed to send to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
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
      return { success: true };
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

  async sendWhatsApp(phone: string, message: string, leadId?: string, imageUrl?: string, templateName?: string) {
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone.replace('+', '');
    console.log(`[WhatsApp] Dispatching to ${formattedPhone}... ${templateName ? `(Template: ${templateName})` : ''}`);
    try {
      if (process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID) {
        let payload: any = {};
        if (templateName) {
          payload = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
              ...(imageUrl && {
                components: [{ type: 'header', parameters: [{ type: 'image', image: { link: imageUrl } }] }]
              })
            }
          };
        } else {
          payload = imageUrl
            ? { messaging_product: 'whatsapp', to: formattedPhone, type: 'image', image: { link: imageUrl, caption: message } }
            : { messaging_product: 'whatsapp', to: formattedPhone, type: 'text', text: { body: message } };
        }

        await axios.post(
          `https://graph.facebook.com/v17.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
          payload,
          { headers: { 'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
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
      const metaErrorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error(`[WhatsApp] Failed to send to ${phone}:`, metaErrorDetails);
      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, type: 'WHATSAPP', direction: 'OUTBOUND', message: `FAILED: ${metaErrorDetails}`, status: 'FAILED' }
        });
      }
      return { success: false, error: metaErrorDetails };
    }
  }

  async sendRCS(phone: string, message: string, leadId?: string) {
    console.log(`[RCS] Attempting RCS to ${phone}...`);
    try {
      if (this.twilioClient && process.env.TWILIO_RCS_MESSAGING_SID) {
        await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_RCS_MESSAGING_SID,
          to: phone
        });
        console.log(`[RCS] Sent successfully to ${phone}`);
      } else {
        console.log(`[RCS][Fallback] RCS not configured or failed, falling back to SMS.`);
        return this.sendSMS(phone, message, leadId);
      }
      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, type: 'SMS', direction: 'OUTBOUND', message: `[RCS] ${message}`, status: 'SENT' }
        });
      }
      return { success: true };
    } catch (error: any) {
      console.error(`[RCS] Failed, falling back to SMS:`, error.message);
      return this.sendSMS(phone, message, leadId);
    }
  }

  public getBaseTemplate(title: string, content: string, cta?: { label: string, url: string }) {
    const ctaHtml = cta ? `
      <table cellpadding="0" cellspacing="0" style="margin-top: 32px;">
        <tr><td style="background-color: #ffffff; border-radius: 4px;">
          <a href="${cta.url}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 1px; text-transform: uppercase;">${cta.label}</a>
        </td></tr>
      </table>` : '';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border:1px solid #333333;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color: #000000; padding: 40px; border-bottom: 1px solid #222222;">
          <p style="margin:0;color:#888888;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">CentraCRM Admissions</p>
          <h1 style="margin:16px 0 0;color:#ffffff;font-size:24px;font-weight:300;line-height:1.2;letter-spacing:-0.5px;">${title}</h1>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:48px 40px;line-height:1.8;font-size:15px;color:#cccccc;">
          <div style="white-space: pre-wrap;">${content}</div>
          ${ctaHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:32px 40px;background-color:#000000;border-top:1px solid #222222;">
          <p style="margin:0;color:#555555;font-size:11px;line-height:1.6;letter-spacing:0.5px;">This is a system-generated notification from CentraCRM. If you have any inquiries regarding your application, please reach out to our admissions office directly.</p>
          <div style="margin:24px 0 0; border-top: 1px solid #111111; padding-top: 24px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color:#ffffff; font-weight: 900; font-size: 14px; letter-spacing: 2px;">THE FOUNDRYS</span>
            <span style="color:#444444; font-size: 10px; text-transform: uppercase;">&copy; 2026 centracrm</span>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }


  private formatTemplate(template: string, data: any): string {
    return template.replace(/\${(\w+)}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
}

export default new CommunicationService();
