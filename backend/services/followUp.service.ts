import prisma from '../config/prisma';
import CommunicationService from './communication.service';
import NotificationDispatcher from './notificationDispatcher.service';

const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';

/** generate a url-safe slug from a uuid */
function makeRoomSlug(id: string): string {
  return 'centracrm-' + id.replace(/-/g, '').slice(0, 12);
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

      // Triggers handle the invite/reminders for meetings via FOLLOW_UP_CREATED
      this.fireFollowUpTriggers(updated).catch(() => {});
      return updated;
    }


    // Fire triggers for non-meeting follow-ups too
    this.fireFollowUpTriggers(followUp).catch(() => {});
    return followUp;
  }

  // Fire dispatcher after follow-up is created
  private async fireFollowUpTriggers(followUp: any) {
    const lead = followUp.lead;
    const assignedTo = (followUp as any).assignedTo;
    const scheduledAt = new Date(followUp.scheduledAt);

    // Determine the trigger key based on lead stage
    const trigger = lead?.stage === 'COUNSELING_SCHEDULED' ? 'COUNSELING_SCHEDULED' : 'FOLLOW_UP_CREATED';

    // T2/T3/C3/C4: Remind the assigned user (telecaller/counselor) before the call/session
    if (assignedTo) {
      NotificationDispatcher.enqueueFromTrigger({
        trigger,
        eventTime: scheduledAt, // offsets apply from this time (e.g. -10, -30 mins)
        leadId: lead?.id,
        recipientId: assignedTo.id,
        contactInfo: assignedTo.email,
        payload: {
          name: assignedTo.name,
          leadName: lead?.name || 'Lead',
          scheduledAt: scheduledAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          notes: followUp.notes || '',
          meetingUrl: followUp.meetingUrl || '',
        },
      }).catch(() => {});
    }

    // L3/L4: Remind the lead (external) about the call/session
    if (lead?.phone || lead?.email) {
      NotificationDispatcher.enqueueFromTrigger({
        trigger,
        eventTime: scheduledAt,
        leadId: lead.id,
        contactInfo: lead.email || lead.phone,
        payload: {
          name: lead.name,
          scheduledAt: scheduledAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          notes: followUp.notes || '',
          meetingUrl: followUp.meetingUrl || '',
        },
      }).catch(() => {});
    }
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
