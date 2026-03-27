import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export class CounselingService {
  async scheduleFollowUp(data: any) {
    return await prisma.followUp.create({
      data: {
        leadId: data.leadId,
        counselorId: data.counselorId,
        notes: data.notes,
        scheduledAt: new Date(data.scheduledAt),
      },
    });
  }

  async logCounseling(data: any) {
    const log = await prisma.counselingLog.create({
      data: {
        leadId: data.leadId,
        counselorId: data.counselorId,
        notes: data.notes,
        recommendation: data.recommendation,
      },
    });

    // Update lead stage to INTERSTED or COUNSELING_SCHEDULED
    await prisma.lead.update({
      where: { id: data.leadId },
      data: { stage: 'RESPONDED' }, // Logic can be more nuanced
    });

    return log;
  }

  async getCounselorSchedule(counselorId: string) {
    return await prisma.followUp.findMany({
      where: {
        counselorId,
        completedAt: null,
      },
      include: { lead: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getStudentsForCounseling() {
    return await prisma.lead.findMany({
      where: {
        stage: {
          in: ['NEW_LEAD', 'RESPONDED', 'COUNSELING_SCHEDULED']
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export default new CounselingService();
