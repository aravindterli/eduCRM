import prisma from '../config/prisma';

class AssignmentService {
  async getNextUserByRole(roleType: 'TELECALLER' | 'COUNSELOR') {
    // Round-robin logic: Find the user in the role whose latest lead was assigned longest ago
    const users = await prisma.user.findMany({
      where: { role: { type: roleType } },
      select: { id: true, name: true }
    });

    if (users.length === 0) return null;

    // We use the lead assignment timestamp to keep the rotation fair
    const usersWithLastLead = await Promise.all(
      users.map(async (u) => {
        const lastLead = await prisma.lead.findFirst({
          where: { assignedId: u.id },
          orderBy: { updatedAt: 'desc' }, // Use updatedAt to capture the latest assignment/status change
          select: { updatedAt: true }
        });
        return {
          id: u.id,
          lastActivityAt: lastLead?.updatedAt || new Date(0)
        };
      })
    );

    // Sort by oldest activity first (to pick the most "idle" user)
    usersWithLastLead.sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime());

    return usersWithLastLead[0].id;
  }

  async autoAssignLead(leadId: string) {
    // New leads initially go to Telecallers
    const telecallerId = await this.getNextUserByRole('TELECALLER');
    
    // Fallback to assignedTo if no telecaller is found (for backward compatibility)
    const finalUserId = telecallerId || await this.getNextUserByRole('COUNSELOR');

    if (!finalUserId) return null;

    return await prisma.lead.update({
      where: { id: leadId },
      data: { assignedId: finalUserId },
      include: { assignedTo: true }
    });
  }

  async assignToassignedTo(leadId: string) {
    // Specialized handover to a assignedTo
    const assignedId = await this.getNextUserByRole('COUNSELOR');
    if (!assignedId) return null;

    return await prisma.lead.update({
      where: { id: leadId },
      data: { assignedId },
      include: { assignedTo: true }
    });
  }
}

export default new AssignmentService();
