import prisma from '../config/prisma';

export class AssignmentService {
  async getNextCounselor() {
    // Basic Round-Robin logic: 
    // Find counselors, then find the one with the fewest leads 
    // OR track a 'lastAssignedCounselorId' globally.
    // For simplicity, let's find the counselor who was assigned a lead longest ago.
    
    const counselors = await prisma.user.findMany({
      where: { role: { type: 'COUNSELOR' } },
      select: { id: true, name: true }
    });

    if (counselors.length === 0) return null;

    // Find the counselor whose latest lead was created longest ago
    // This isn't perfect but works for a basic round-robin without extra state.
    const counselorsWithLastLead = await Promise.all(
      counselors.map(async (c) => {
        const lastLead = await prisma.lead.findFirst({
          where: { counselorId: c.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        });
        return {
          id: c.id,
          lastLeadAt: lastLead?.createdAt || new Date(0)
        };
      })
    );

    counselorsWithLastLead.sort((a, b) => a.lastLeadAt.getTime() - b.lastLeadAt.getTime());

    return counselorsWithLastLead[0].id;
  }

  async assignLead(leadId: string) {
    const counselorId = await this.getNextCounselor();
    if (!counselorId) return null;

    return await prisma.lead.update({
      where: { id: leadId },
      data: { counselorId }
    });
  }
}

export default new AssignmentService();
