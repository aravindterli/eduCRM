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

      const dbTemplate = await prisma.messageTemplate.findFirst({
        where: {
          OR: [{ name: templateKey }, { id: templateKey }],
          channel: 'EMAIL'
        }
      });

      let subject = `EduCRM: ${templateKey.replace(/_/g, ' ').toUpperCase()}`;
      let bodyText = `Hello ${data.name},\nThis is a notification for: ${templateKey}\nThank you, EduCRM Team.`;

      if (dbTemplate) {
        subject = dbTemplate.subject || subject;
        bodyText = dbTemplate.content;
      }

      const formattedSubject = this.formatTemplate(subject, data);
      const formattedContent = this.formatTemplate(bodyText, data);

      const html = this.getBaseTemplate(formattedSubject, formattedContent);

      const info = await this.transporter.sendMail({

        from: process.env.EMAIL_FROM || '"The Foundrys" <no-reply@educrm.com>',
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

  public getBaseTemplate(title: string, content: string, cta?: { label: string, url: string }) {
    const ctaHtml = cta ? `
      <table cellpadding="0" cellspacing="0" style="margin-top: 32px;">
        <tr><td style="background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 12px;">
          <a href="${cta.url}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; letter-spacing: 0.5px;">${cta.label}</a>
        </td></tr>
      </table>` : '';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter', 'Segoe UI', Tahoma, Arial, sans-serif;color:#94a3b8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:24px;border:1px solid #334155;overflow:hidden;box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        <!-- Header -->
        <tr><td style="background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 48px 40px;">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;font-weight:800;letter-spacing:4px;text-transform:uppercase;">EduCRM Admissions</p>
          <h1 style="margin:12px 0 0;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;">${title}</h1>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:48px 40px;line-height:1.6;font-size:16px;">
          <div style="color:#e2e8f0;">${content}</div>
          ${ctaHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:32px 40px;background:#0f172a;border-top:1px solid #1e293b;">
          <p style="margin:0;color:#475569;font-size:12px;line-height:1.5;">You are receiving this communication from EduCRM regarding your application or interested program. If you have any questions, please reply to this email.</p>
          <p style="margin:16px 0 0;color:#475569;font-size:12px;">&copy; 2026 EduCRM. All rights reserved.</p>
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

  async sendFollowUpInvite(to: string, data: {
    leadName: string;
    counselorName: string;
    scheduledAt: Date;
    meetingUrl: string;
    notes?: string;
    leadId?: string;
  }) {
    const dateStr = data.scheduledAt.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = data.scheduledAt.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const subject = `📅 Meeting Invite: ${dateStr} at ${timeStr}`;
    const content = `
      <p>Hi <strong>${data.leadName}</strong>,</p>
      <p><strong>${data.counselorName}</strong> has scheduled a counseling session with you. Please join us at the scheduled time below:</p>
      <div style="background:#0f172a; border-radius:16px; padding:24px; border:1px solid #3b82f6; margin:32px 0;">
        <p style="margin:0; color:#60a5fa; font-size:12px; font-weight:800; letter-spacing:2px; text-transform:uppercase;">Scheduled For</p>
        <p style="margin:8px 0 0; color:#ffffff; font-size:20px; font-weight:800;">${dateStr}</p>
        <p style="margin:4px 0 0; color:#94a3b8; font-size:16px;">${timeStr}</p>
        ${data.notes ? `<p style="margin:24px 0 0; color:#94a3b8; font-size:14px; border-top:1px solid #1e293b; padding-top:16px;"><strong>Agenda:</strong> ${data.notes}</p>` : ''}
      </div>
    `;

    const html = this.getBaseTemplate(subject, content, { label: '🎥 Join Meeting', url: data.meetingUrl });

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EduCRM Admissions" <no-reply@educrm.com>',
        to,
        subject,
        text: `Counseling session with ${data.counselorName} on ${dateStr} at ${timeStr}. Join: ${data.meetingUrl}`,
        html,
      });
      console.log(`[Email] Follow-up invite sent to ${to}: ${info.messageId}`);

      if (data.leadId) {
        await prisma.communicationLog.create({
          data: {
            leadId: data.leadId,
            type: 'EMAIL',
            direction: 'OUTBOUND',
            message: `Follow-up invite: ${dateStr} at ${timeStr} — ${data.meetingUrl}`,
            status: 'SENT',
          },
        });
      }
      return { success: true };
    } catch (error: any) {
      console.error(`[Email] Failed to send follow-up invite to ${to}:`, error.message);
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
    // WhatsApp requires country codes. If it's a 10-digit number, assume India (91).
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone.replace('+', '');

    console.log(`[WhatsApp] Dispatching to ${formattedPhone}... ${templateName ? `(Template: ${templateName})` : ''} ${imageUrl ? '(with image)' : ''}`);
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
                components: [
                  {
                    type: 'header',
                    parameters: [
                      {
                        type: 'image',
                        image: { link: imageUrl }
                      }
                    ]
                  }
                ]
              })
            }
          };
        } else {
          payload = imageUrl
            ? {
              messaging_product: 'whatsapp',
              to: formattedPhone,
              type: 'image',
              image: {
                link: imageUrl,
                caption: message
              }
            }
            : {
              messaging_product: 'whatsapp',
              to: formattedPhone,
              type: 'text',
              text: { body: message }
            };
        }

        await axios.post(
          `https://graph.facebook.com/v17.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        console.log(`[WhatsApp][Simulation] Meta API not configured. Simulated msg sent to ${phone}: ${message}${imageUrl ? ` [Image: ${imageUrl}]` : ''}`);
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

  async sendAutoResponse(lead: any) {
    const programName = lead.program?.name || 'our programs';
    const subject = '👋 Welcome to EduCRM Admissions';
    const content = `
      <p>Hi <strong>${lead.name}</strong>,</p>
      <p>Thank you for inquiring about ${programName}. We are excited about your interest in taking the next step with us.</p>
      <p>A counselor has been assigned to your profile and will be reaching out to you shortly to guide you through the process.</p>
    `;

    const html = this.getBaseTemplate(subject, content);

    // Use a Meta Template with an image header to prevent 24-hour window blocks,
    // and to include the course image right at lead creation!
    const welcomeTemplateName = process.env.WELCOME_WHATSAPP_TEMPLATE_NAME || 'testmsg';
    const welcomeImageUrl = process.env.WELCOME_COURSE_IMAGE_URL || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop';

    await this.sendWhatsApp(
      lead.phone,
      `Hi ${lead.name}, thanks for inquiring about ${programName}. A counselor will contact you soon!`,
      lead.id,
      welcomeImageUrl,
      welcomeTemplateName
    );

    if (lead.email) {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EduCRM Admissions" <no-reply@educrm.com>',
        to: lead.email,
        subject,
        html
      });
    }
  }

  async sendReEngagementMessage(lead: any) {
    const programName = lead.program?.name || 'our programs';
    const subject = '✨ New Enrollment Intake Started';
    const content = `
      <p>Hi <strong>${lead.name}</strong>,</p>
      <p>We noticed you were interested in <strong>${programName}</strong> last month.</p>
      <p>We've just opened a new enrollment intake with updated curriculum and scholarship options! We would love to have you back to discuss how we can help you reach your goals.</p>
      <p>Would you like to speak with a counselor today?</p>
    `;

    const cta = { label: 'Re-apply Now', url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/apply` };
    const html = this.getBaseTemplate(subject, content, cta);

    console.log(`[Re-engagement] Sending automated reach-out to ${lead.name}`);

    await this.sendWhatsApp(lead.phone, `Hi ${lead.name}, we have a new intake for ${programName}! Would you like to re-apply? Reply YES to know more.`, lead.id);

    if (lead.email) {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EduCRM Admissions" <no-reply@educrm.com>',
        to: lead.email,
        subject,
        html
      });
    }
  }
  async sendAdmissionConfirmation(lead: any, admission: any) {
    const programName = admission.program?.name || 'your chosen program';
    const subject = '🎉 Congratulations! Your Admission is Confirmed';
    const content = `
      <p>Hi <strong>${lead.name}</strong>,</p>
      <p>We are thrilled to inform you that your admission to <strong>${programName}</strong> has been officially confirmed!</p>
      <div style="background:#0f172a; border-radius:16px; padding:24px; border:1px solid #10b981; margin:32px 0;">
        <p style="margin:0; color:#10b981; font-size:12px; font-weight:800; letter-spacing:2px; text-transform:uppercase;">Enrollment Details</p>
        <p style="margin:8px 0 0; color:#ffffff; font-size:18px; font-weight:800;">ID: ${admission.enrollmentId}</p>
        <p style="margin:4px 0 0; color:#94a3b8; font-size:14px;">Program: ${programName}</p>
      </div>
      <p>Our finance team will be reaching out to you shortly regarding the next steps for fee payment and onboarding.</p>
    `;

    const html = this.getBaseTemplate(subject, content, { label: 'Go to Student Portal', url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal` });

    await this.sendWhatsApp(lead.phone, `Congratulations ${lead.name}! Your admission for ${programName} is confirmed. Enrollment ID: ${admission.enrollmentId}`, lead.id);

    if (lead.email) {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EduCRM Admissions" <no-reply@educrm.com>',
        to: lead.email,
        subject,
        html
      });
    }
  }

  async sendRejectionNotification(lead: any, reason: string) {
    const subject = 'Update regarding your Application at EduCRM';
    const content = `
      <p>Hi <strong>${lead.name}</strong>,</p>
      <p>Thank you for your interest in our programs and for the time you took to apply.</p>
      <p>After a careful review of your application, we regret to inform you that we are unable to proceed with your admission at this time.</p>
      ${reason ? `<p style="background:#0f172a; padding:16px; border-radius:8px; border-left:4px solid #ef4444; color:#f87171; font-size:14px;"><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>However, we keep all applications on file and will reach out if a future opportunity aligns with your profile. We wish you the very best in your academic journey.</p>
    `;

    const html = this.getBaseTemplate(subject, content);

    if (lead.email) {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EduCRM Admissions" <no-reply@educrm.com>',
        to: lead.email,
        subject,
        html
      });
    }
  }
}

export default new CommunicationService();
