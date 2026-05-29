import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import twilio from 'twilio';
import axios from 'axios';
import ConnectorCredentials from '../utils/connectorCredentials';
import { ConnectorNotConfiguredError } from '../utils/connectorError';

export class CommunicationService {

  // ─── Email ───────────────────────────────────────────────────────────────────

  async sendEmail(tenantId: string, to: string, templateKey: string, data: any, leadId?: string) {
    console.log(`[Email] Dispatching ${templateKey} to ${to} for tenant ${tenantId}...`);

    try {
      if (!to) return { success: false, error: 'No email provided' };

      // Resolve per-tenant SMTP credentials
      const smtpCreds = await ConnectorCredentials.getSmtp(tenantId);

      const transporter = nodemailer.createTransport({
        host: smtpCreds.host,
        port: smtpCreds.port,
        secure: smtpCreds.secure,
        auth: { user: smtpCreds.user, pass: smtpCreds.pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      const dbTemplate = await prisma.messageTemplate.findFirst({
        where: {
          tenantId,
          OR: [{ name: templateKey }, { id: templateKey }],
          channel: 'EMAIL',
        },
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

      const info = await transporter.sendMail({
        from: smtpCreds.from,
        to,
        subject: formattedSubject,
        text: formattedContent.replace(/<[^>]*>?/gm, ''),
        html,
      });

      console.log(`[Email] Dispatched successfully: ${info.messageId}`);

      if (leadId) {
        await prisma.communicationLog.create({
          data: {
            leadId,
            tenantId,
            type: 'EMAIL',
            direction: 'OUTBOUND',
            message: `Subject: ${formattedSubject}`,
            status: 'SENT',
          },
        });
      }
      return { success: true, provider: 'SMTP', messageId: info.messageId };
    } catch (error: any) {
      if (error instanceof ConnectorNotConfiguredError) {
        console.warn(`[Email] Connector not configured for tenant ${tenantId}: ${error.message}`);
        return { success: false, error: error.message, connectorError: true, connector: error.connector };
      }
      console.error(`[Email] Failed to send to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendOnboardingEmail(tenantId: string, lead: any, application: any, program: any, tenant: any) {
    console.log(`[Onboarding Email] Preparing message for ${lead.email} in tenant ${tenantId}...`);
    try {
      if (!lead.email) return { success: false, error: 'Lead has no email' };

      // Resolve per-tenant SMTP credentials
      const smtpCreds = await ConnectorCredentials.getSmtp(tenantId);

      const transporter = nodemailer.createTransport({
        host: smtpCreds.host,
        port: smtpCreds.port,
        secure: smtpCreds.secure,
        auth: { user: smtpCreds.user, pass: smtpCreds.pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
      const uploadLink = `${frontendUrl}/apply?applicationId=${application.id}&tenantId=${tenantId}`;

      const sector = tenant.sector || 'GENERIC';
      let bookingTypeLabel = 'Booking Details';
      let itemLabel = 'Program / Course';

      if (sector === 'REAL_ESTATE') {
        bookingTypeLabel = 'Property Booking Details';
        itemLabel = 'Property Name';
      } else if (sector === 'HEALTHCARE') {
        bookingTypeLabel = 'Case / Service Details';
        itemLabel = 'Assigned Service';
      } else if (sector === 'EDUCATION') {
        bookingTypeLabel = 'Course Enrollment Details';
        itemLabel = 'Program / Course';
      }

      const subject = `Complete Your Onboarding Paperwork - ${tenant.name}`;

      const bodyContent = `Dear ${lead.name},

Thank you for choosing ${tenant.name}! We are absolutely delighted to welcome you.

Your booking has been successfully registered. To complete the onboarding process and finalize your registration, we kindly request you to upload your required identification and qualification paperwork.

Please find your booking details and your secure document upload link below:

--------------------------------------------------
${bookingTypeLabel.toUpperCase()}
--------------------------------------------------
Customer Name: ${lead.name}
Email Address: ${lead.email || 'N/A'}
Phone Number: ${lead.phone || 'N/A'}
${itemLabel}: ${program?.name || 'N/A'}
Description: ${program?.description || 'N/A'}
Base Fee: ${program?.baseFee ? `${program.baseFee} INR` : 'N/A'}
Booking ID: ${application.id.split('-')[0].toUpperCase()}
--------------------------------------------------

Please click the secure link below to upload your Passport/ID, Academic Transcripts, or Resume:

${uploadLink}

If you have any questions or require assistance during your onboarding process, please reply to this email or contact your assigned coordinator.

Sincerely,
Admissions & Onboarding Team
${tenant.name}`;

      const html = this.getBaseTemplate(
        subject,
        bodyContent,
        { label: 'Upload Onboarding Documents', url: uploadLink }
      );

      const info = await transporter.sendMail({
        from: smtpCreds.from,
        to: lead.email,
        subject: subject,
        text: bodyContent.replace(/<[^>]*>?/gm, ''),
        html,
      });

      console.log(`[Onboarding Email] Dispatched successfully: ${info.messageId}`);

      await prisma.communicationLog.create({
        data: {
          leadId: lead.id,
          tenantId,
          type: 'EMAIL',
          direction: 'OUTBOUND',
          message: `Onboarding Link Sent. Subject: ${subject}`,
          status: 'SENT',
        },
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      if (error instanceof ConnectorNotConfiguredError) {
        console.warn(`[Onboarding Email] SMTP not configured for tenant ${tenantId}`);
        return { success: false, error: error.message, connectorError: true, connector: error.connector };
      }
      console.error(`[Onboarding Email] Failed to send to ${lead.email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ─── SMS ─────────────────────────────────────────────────────────────────────

  async sendSMS(tenantId: string, phone: string, message: string, leadId?: string) {
    console.log(`[SMS] Dispatching to ${phone} for tenant ${tenantId}...`);
    try {
      const creds = await ConnectorCredentials.getTwilio(tenantId);
      const client = twilio(creds.accountSid, creds.authToken);

      await client.messages.create({
        body: message,
        from: creds.phoneNumber,
        to: phone,
      });

      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, tenantId, type: 'SMS', direction: 'OUTBOUND', message, status: 'SENT' },
        });
      }
      return { success: true };
    } catch (error: any) {
      if (error instanceof ConnectorNotConfiguredError) {
        console.warn(`[SMS] Twilio not configured for tenant ${tenantId}`);
        if (leadId) {
          await prisma.communicationLog.create({
            data: { leadId, tenantId, type: 'SMS', direction: 'OUTBOUND', message: `NOT SENT (Twilio not configured): ${message}`, status: 'FAILED' },
          });
        }
        return { success: false, error: error.message, connectorError: true, connector: error.connector };
      }
      console.error(`[SMS] Failed to send to ${phone}:`, error.message);
      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, tenantId, type: 'SMS', direction: 'OUTBOUND', message: `FAILED: ${message}`, status: 'FAILED' },
        });
      }
      return { success: false, error: error.message };
    }
  }

  // ─── WhatsApp ─────────────────────────────────────────────────────────────────

  async sendWhatsApp(tenantId: string, phone: string, message: string, leadId?: string, imageUrl?: string, templateName?: string) {
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone.replace('+', '');
    console.log(`[WhatsApp] Dispatching to ${formattedPhone} for tenant ${tenantId}... ${templateName ? `(Template: ${templateName})` : ''}`);
    try {
      const creds = await ConnectorCredentials.getMeta(tenantId);

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
              components: [{ type: 'header', parameters: [{ type: 'image', image: { link: imageUrl } }] }],
            }),
          },
        };
      } else {
        payload = imageUrl
          ? { messaging_product: 'whatsapp', to: formattedPhone, type: 'image', image: { link: imageUrl, caption: message } }
          : { messaging_product: 'whatsapp', to: formattedPhone, type: 'text', text: { body: message } };
      }

      await axios.post(
        `https://graph.facebook.com/v17.0/${creds.phoneNumberId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${creds.whatsappToken}`, 'Content-Type': 'application/json' } }
      );

      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, tenantId, type: 'WHATSAPP', direction: 'OUTBOUND', message, status: 'SENT' },
        });
      }
      return { success: true, provider: 'Meta' };
    } catch (error: any) {
      if (error instanceof ConnectorNotConfiguredError) {
        console.warn(`[WhatsApp] Meta not configured for tenant ${tenantId}`);
        if (leadId) {
          await prisma.communicationLog.create({
            data: { leadId, tenantId, type: 'WHATSAPP', direction: 'OUTBOUND', message: `NOT SENT (Meta not configured): ${message}`, status: 'FAILED' },
          });
        }
        return { success: false, error: error.message, connectorError: true, connector: error.connector };
      }
      const metaErrorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      console.error(`[WhatsApp] Failed to send to ${phone}:`, metaErrorDetails);
      if (leadId) {
        await prisma.communicationLog.create({
          data: { leadId, tenantId, type: 'WHATSAPP', direction: 'OUTBOUND', message: `FAILED: ${metaErrorDetails}`, status: 'FAILED' },
        });
      }
      return { success: false, error: metaErrorDetails };
    }
  }

  // ─── RCS (fallback to SMS) ────────────────────────────────────────────────────

  async sendRCS(tenantId: string, phone: string, message: string, leadId?: string) {
    console.log(`[RCS] Attempting RCS to ${phone} for tenant ${tenantId}...`);
    try {
      const creds = await ConnectorCredentials.getTwilio(tenantId);
      if (creds.twimlAppSid) {
        const client = twilio(creds.accountSid, creds.authToken);
        await client.messages.create({
          body: message,
          from: creds.twimlAppSid,
          to: phone,
        });
        console.log(`[RCS] Sent successfully to ${phone}`);
        if (leadId) {
          await prisma.communicationLog.create({
            data: { leadId, tenantId, type: 'SMS', direction: 'OUTBOUND', message: `[RCS] ${message}`, status: 'SENT' },
          });
        }
        return { success: true };
      }
      console.log(`[RCS][Fallback] RCS messaging SID not found, falling back to SMS.`);
      return this.sendSMS(tenantId, phone, message, leadId);
    } catch (error: any) {
      if (error instanceof ConnectorNotConfiguredError) {
        return { success: false, error: error.message, connectorError: true, connector: error.connector };
      }
      console.error(`[RCS] Failed, falling back to SMS:`, error.message);
      return this.sendSMS(tenantId, phone, message, leadId);
    }
  }

  // ─── Email Template ───────────────────────────────────────────────────────────

  public getBaseTemplate(title: string, content: string, cta?: { label: string; url: string }) {
    const ctaHtml = cta
      ? `
      <table cellpadding="0" cellspacing="0" style="margin-top: 32px;">
        <tr><td style="background-color: #ffffff; border-radius: 4px;">
          <a href="${cta.url}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #000000; font-size: 14px; font-weight: 700; text-decoration: none; letter-spacing: 1px; text-transform: uppercase;">${cta.label}</a>
        </td></tr>
      </table>`
      : '';

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
