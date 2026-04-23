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
        assignedId: data.assignedId || userId,
        createdById: userId,
        notes: data.notes,
        scheduledAt,
      },
      include: {
        lead: { select: { id: true, name: true, phone: true, stage: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // 2. generate jitsi room url and persist it only if type is MEETING
    if (data.type === 'MEETING') {
      const meetingUrl = `https://${JITSI_DOMAIN}/${makeRoomSlug(followUp.id)}`;
      const updated = await prisma.followUp.update({
        where: { id: followUp.id },
        data: { meetingUrl } as any,
        include: {
          lead: { select: { id: true, name: true, phone: true, stage: true, email: true } },
        },
      });

      // 3. send email invite only for meetings
      const leadEmail = (followUp.lead as any)?.email;
      if (leadEmail) {
        CommunicationService.sendFollowUpInvite(leadEmail, {
          leadName: followUp.lead.name,
          assignedToName: (followUp as any).assignedTo?.name || 'Your assignedTo',
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

    return followUp;
  }

  async getFollowUpsByLead(leadId: string) {
    return await prisma.followUp.findMany({
      where: { leadId },
      orderBy: { scheduledAt: 'desc' },
      include: { 
        lead: { 
          include: {
            notes: { include: { assignedTo: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            communicationLogs: { orderBy: { timestamp: 'desc' } },
            counselingLogs: { include: { assignedTo: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            webinarRegistrations: { include: { webinar: true } },
            application: { include: { documents: true } }
          }
        } 
      },
    });
  }

  async getUpcomingFollowUps(userId?: string, includeCompleted: boolean = false) {
    return await prisma.followUp.findMany({
      where: { 
        ...(includeCompleted ? {} : { completedAt: null }),
        ...(userId && { assignedId: userId })
      },
      orderBy: { scheduledAt: 'asc' },
      include: { 
        lead: { 
          include: {
            notes: { include: { assignedTo: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            communicationLogs: { orderBy: { timestamp: 'desc' } },
            counselingLogs: { include: { assignedTo: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
            webinarRegistrations: { include: { webinar: true } },
            application: { include: { documents: true } }
          }
        },
        createdBy: { select: { id: true, name: true } }
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
