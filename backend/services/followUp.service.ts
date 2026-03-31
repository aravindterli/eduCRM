import prisma from '../config/prisma';
import CommunicationService from './communication.service';

const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';

/** generate a url-safe slug from a uuid */
function makeRoomSlug(id: string): string {
  return 'educrm-' + id.replace(/-/g, '').slice(0, 12);
}

export class FollowUpService {
  async createFollowUp(leadId: string, data: any, userId: string) {
    const scheduledAt = new Date(data.scheduledAt);

    // 1. create the follow-up first so we have an id for the room slug
    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        counselorId: userId,
        notes: data.notes,
        scheduledAt,
      },
      include: {
        lead: { select: { id: true, name: true, phone: true, stage: true, email: true } },
        counselor: { select: { id: true, name: true } },
      },
    });

    // 2. generate jitsi room url and persist it
    const meetingUrl = `https://${JITSI_DOMAIN}/${makeRoomSlug(followUp.id)}`;
    const updated = await prisma.followUp.update({
      where: { id: followUp.id },
      data: { meetingUrl } as any, // meetingUrl column added via db push; remove cast after next prisma generate
      include: {
        lead: { select: { id: true, name: true, phone: true, stage: true, email: true } },
      },
    });

    // 3. send email invite to lead (non-blocking)
    const leadEmail = (followUp.lead as any)?.email;
    if (leadEmail) {
      CommunicationService.sendFollowUpInvite(leadEmail, {
        leadName: followUp.lead.name,
        counselorName: (followUp as any).counselor?.name || 'Your Counselor',
        scheduledAt,
        meetingUrl,
        notes: data.notes,
        leadId,
      }).catch((err: any) =>
        console.error('[FollowUp] Email invite failed:', err.message)
      );
    }

    return updated;
  }

  async getFollowUpsByLead(leadId: string) {
    return await prisma.followUp.findMany({
      where: { leadId },
      orderBy: { scheduledAt: 'desc' },
      include: { 
        lead: { 
          include: {
            notes: { include: { counselor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            communicationLogs: { orderBy: { timestamp: 'desc' } },
            counselingLogs: { include: { counselor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            webinarRegistrations: { include: { webinar: true } },
            application: { include: { documents: true } }
          }
        } 
      },
    });
  }

  async getUpcomingFollowUps() {
    return await prisma.followUp.findMany({
      where: { completedAt: null },
      orderBy: { scheduledAt: 'asc' },
      include: { 
        lead: { 
          include: {
            notes: { include: { counselor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            communicationLogs: { orderBy: { timestamp: 'desc' } },
            counselingLogs: { include: { counselor: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            webinarRegistrations: { include: { webinar: true } },
            application: { include: { documents: true } }
          }
        } 
      },
    });
  }

  async completeFollowUp(id: string) {
    return await prisma.followUp.update({
      where: { id },
      data: { completedAt: new Date() },
      include: { lead: { select: { id: true, name: true, phone: true, stage: true } } },
    });
  }

  async updateFollowUp(id: string, data: { notes?: string; scheduledAt?: string }) {
    return await prisma.followUp.update({
      where: { id },
      data: {
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      },
      include: { lead: { select: { id: true, name: true, phone: true, stage: true } } },
    });
  }
}

export default new FollowUpService();
