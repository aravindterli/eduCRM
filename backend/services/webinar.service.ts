import prisma from '../config/prisma';
import { encrypt, decrypt } from '../utils/encryption';
import { autoAssignLead } from '../utils/assignment';
import CommunicationService from './communication.service';
import LeadService from './lead.service';

export class WebinarService {
  async createWebinar(data: any) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
    const meetingUrl = `https://meet.jit.si/educrm-${slug}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true`;

    return await prisma.webinar.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        meetingId: slug,
        meetingUrl: meetingUrl,
      },
    });
  }

  async updateWebinar(id: string, data: any) {
    return await prisma.webinar.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  async deleteWebinar(id: string) {
    return await prisma.webinar.delete({ where: { id } });
  }

  async registerLead(webinarId: string, leadId: string) {
    const registration = await prisma.webinarRegistration.create({
      data: {
        webinarId,
        leadId,
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: 'WEBINAR_REGISTERED' },
    });

    return registration;
  }

  async trackAttendance(registrationId: string, attended: boolean) {
    const registration = await prisma.webinarRegistration.update({
      where: { id: registrationId },
      data: { attended },
    });

    if (attended) {
      await prisma.lead.update({
        where: { id: registration.leadId },
        data: { stage: 'WEBINAR_ATTENDED' },
      });
    }

    return registration;
  }

  async getWebinars() {
    return await prisma.webinar.findMany({
      include: {
        _count: { select: { registrations: true } },
        registrations: {
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' },
    });
  }

  async getWebinarById(id: string) {
    return await prisma.webinar.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } },
      },
    });
  }

  async registerLeadPublic(webinarId: string, data: { name: string, email: string, phone: string, eduBackground?: string }) {
    // 1. Encrypt and Find or create lead
    const encryptedEmail = data.email ? encrypt(data.email) : undefined;
    const encryptedPhone = data.phone ? encrypt(data.phone) : undefined;

    let lead = await prisma.lead.findFirst({
      where: {
        OR: [
          encryptedEmail ? { email: encryptedEmail } : {},
          encryptedPhone ? { phone: encryptedPhone } : {}
        ].filter(cond => Object.keys(cond).length > 0)
      }
    });

    let isNewLead = false;
    if (!lead) {
      isNewLead = true;
      lead = await prisma.lead.create({
        data: {
          name: data.name,
          email: encryptedEmail || '',
          phone: encryptedPhone || '',
          eduBackground: data.eduBackground,
          leadSource: 'WEBINAR',
          stage: 'WEBINAR_REGISTERED',
        }
      });
    } else {
      // Update existing lead stage
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: { stage: 'WEBINAR_REGISTERED' }
      });
    }

    // --- START LEAD FLOW ---
    if (isNewLead) {
      // Automatic Assignment
      await autoAssignLead(lead.id);
      
      // Automated Communication (Requires Decryption)
      const decryptedLead = { ...lead };
      try {
        if (decryptedLead.phone) decryptedLead.phone = decrypt(decryptedLead.phone);
        if (decryptedLead.email) decryptedLead.email = decrypt(decryptedLead.email);
      } catch (e) {
        console.error('Failed to decrypt lead for auto-response', e);
      }
      await CommunicationService.sendAutoResponse(decryptedLead);
    }

    // Lead Scoring (for both new and existing leads as it's a new interaction)
    await LeadService.calculateLeadScore(lead.id);

    // Activity Logging
    const AuditService = (await import('./audit.service')).default;
    await AuditService.log(
      isNewLead ? `New lead created via Webinar: ${lead.name}` : `Existing lead registered for Webinar: ${lead.name}`, 
      undefined, 
      { leadId: lead.id, webinarId, source: 'WEBINAR' }
    );
    // --- END LEAD FLOW ---

    // 2. Check if already registered for THIS webinar
    const existingRegistration = await prisma.webinarRegistration.findFirst({
      where: {
        webinarId,
        leadId: lead.id
      }
    });

    if (existingRegistration) {
      return { message: 'Already registered', lead, registration: existingRegistration };
    }

    // 3. Create registration
    const registration = await prisma.webinarRegistration.create({
      data: {
        webinarId,
        leadId: lead.id
      }
    });

    return { message: 'Registration successful', lead, registration };
  }
}

export default new WebinarService();
