import prisma from '../config/prisma';
import { autoAssignLead } from '../utils/assignment';
import CommunicationService from './communication.service';
import LeadService from './lead.service';
import NotificationDispatcher from './notificationDispatcher.service';

export class WebinarService {
  async createWebinar(data: any) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
    const meetingUrl = `https://meet.jit.si/centracrm-${slug}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true`;

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

    // Send confirmation + enqueue multi-timing reminders
    try {
      const [lead, webinar] = await Promise.all([
        prisma.lead.findUnique({ where: { id: leadId } }),
        prisma.webinar.findUnique({ where: { id: webinarId } })
      ]);
      if (lead && webinar) {
        const webinarTime = new Date(webinar.date);
        const payload = {
          name: lead.name,
          webinarTitle: webinar.title,
          webinarDate: webinarTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
          webinarTime: webinarTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          meetingUrl: webinar.meetingUrl || '',
        };

        // L5: Immediate confirmation
        NotificationDispatcher.enqueueFromTrigger({
          trigger: 'WEBINAR_REGISTERED',
          eventTime: new Date(),
          leadId: lead.id,
          contactInfo: lead.email || lead.phone,
          payload,
        }).catch(() => {});

        // L6: Reminders at 1 day, 1 hr, 15 min before
        NotificationDispatcher.enqueueFromTrigger({
          trigger: 'WEBINAR_STARTING',
          eventTime: webinarTime,
          leadId: lead.id,
          contactInfo: lead.email || lead.phone,
          payload,
        }).catch(() => {});


      }
    } catch (err) {
      console.error('[WebinarService] Failed to send registration email:', err);
    }

    return registration;
  }

  async trackAttendance(registrationId: string, attended: boolean) {
    const registration = await prisma.webinarRegistration.update({
      where: { id: registrationId },
      data: { attended },
    });

    if (attended) {
      const lead = await prisma.lead.update({
        where: { id: registration.leadId },
        data: { stage: 'WEBINAR_ATTENDED' },
      });

      // Notify lead (Post-Webinar thank you)
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'WEBINAR_ATTENDED',
        eventTime: new Date(),
        leadId: lead.id,
        contactInfo: lead.email || lead.phone,
        payload: { name: lead.name, webinarTitle: (registration as any).webinar?.title || 'the webinar' },
      }).catch(() => {});
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

  async getUpcomingWebinars() {
    return await prisma.webinar.findMany({
      where: {
        date: { gte: new Date() }
      },
      include: {
        _count: { select: { registrations: true } }
      },
      orderBy: { date: 'asc' },
      take: 5
    });
  }

  async registerLeadPublic(webinarId: string, data: { name: string, email: string, phone: string, eduBackground?: string }) {
    // 1. find or create lead by email/phone
    let lead = await prisma.lead.findFirst({
      where: {
        OR: [
          data.email ? { email: data.email } : {},
          data.phone ? { phone: data.phone } : {},
        ].filter(cond => Object.keys(cond).length > 0)
      }
    });

    let isNewLead = false;
    if (!lead) {
      isNewLead = true;
      lead = await prisma.lead.create({
        data: {
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          eduBackground: data.eduBackground,
          leadSource: 'WEBINAR',
          stage: 'WEBINAR_REGISTERED',
        }
      });
    } else {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: { stage: 'WEBINAR_REGISTERED' }
      });
    }

    if (isNewLead) {
      await autoAssignLead(lead.id);
      // Trigger lead creation notification
      NotificationDispatcher.enqueueFromTrigger({
        trigger: 'LEAD_CREATED',
        eventTime: new Date(),
        leadId: lead.id,
        contactInfo: lead.email || lead.phone,
        payload: { name: lead.name, leadSource: lead.leadSource },
      }).catch(() => { });
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

    // Note: WEBINAR_REGISTERED notification is handled via the registerLead path 
    // or we can add it here if needed. Since we are using enqueueFromTrigger 
    // for reminders, immediate confirmation should be an offset: 0 rule.


    return { message: 'Registration successful', lead, registration };
  }
}

export default new WebinarService();
