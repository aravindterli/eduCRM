import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export class CounselingService {
  async scheduleFollowUp(data: any) {
    return await prisma.followUp.create({
      data: {
        leadId: data.leadId,
        assignedId: data.assignedId,
        notes: data.notes,
        scheduledAt: new Date(data.scheduledAt),
      },
    });
  }

  async logCounseling(data: any) {
    const log = await prisma.counselingLog.create({
      data: {
        notes: data.notes,
        recommendation: data.recommendation,
        assignedTo: { connect: { id: data.assignedId } },
        lead: { connect: { id: data.leadId } },
        tenant: { connect: { id: data.tenantId } }
      },
    });

    // Update lead stage to INTERSTED or COUNSELING_SCHEDULED
    await prisma.lead.update({
      where: { id: data.leadId },
      data: { stage: 'RESPONDED' }, // Logic can be more nuanced
    });

    return log;
  }

  async getassignedToSchedule(assignedId: string) {
    return await prisma.followUp.findMany({
      where: {
        assignedId,
        completedAt: null,
      },
      include: { lead: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getStudentsForCounseling(user?: any) {
    const where: Prisma.LeadWhereInput = {
      stage: {
        in: [
          'QUALIFIED',
          'MEETING SCHEDULED',
          'MEETING_SCHEDULED',
          'PROPOSAL SENT',
          'PROPOSAL_SENT',
          'NEGOTIATION'
        ]
      }
    };

    if (user && user.role) {
      const roleName = typeof user.role === 'string' ? user.role : (user.role.name || user.role.type);
      const roleUpper = roleName.toUpperCase();
      if (roleUpper !== 'SUPERADMIN' && roleUpper !== 'ADMIN') {
        where.assignedId = user.id;
      }
    }

    return await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }
}

export default new CounselingService();
