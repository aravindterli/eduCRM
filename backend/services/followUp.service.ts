import prisma from '../config/prisma';

export class FollowUpService {
  async createFollowUp(leadId: string, data: any, userId: string) {
    return await prisma.followUp.create({
      data: {
        leadId,
        counselorId: userId,
        notes: data.notes,
        scheduledAt: new Date(data.scheduledAt),
      },
    });
  }

  async getFollowUpsByLead(leadId: string) {
    return await prisma.followUp.findMany({
      where: { leadId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async completeFollowUp(id: string) {
    return await prisma.followUp.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }
}

export default new FollowUpService();
