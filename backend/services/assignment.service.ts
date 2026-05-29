import prisma from '../config/prisma';

class AssignmentService {
  async getNextUserByRole(tenantId: string, roleType: 'TELECALLER' | 'COUNSELOR') {
    // Round-robin logic within tenant using standard custom roles
    let users = await prisma.user.findMany({
      where: { 
        tenantId,
        role: { 
          type: 'STANDARDUSER',
          name: { contains: roleType === 'COUNSELOR' ? 'consultant' : 'caller', mode: 'insensitive' }
        } 
      },
      select: { id: true, name: true }
    });

    if (users.length === 0) {
      users = await prisma.user.findMany({
        where: { 
          tenantId,
          role: { 
            type: 'STANDARDUSER',
            name: { contains: roleType, mode: 'insensitive' }
          } 
        },
        select: { id: true, name: true }
      });
    }

    if (users.length === 0) {
      users = await prisma.user.findMany({
        where: { 
          tenantId,
          role: { type: 'STANDARDUSER' } 
        },
        select: { id: true, name: true }
      });
    }

    if (users.length === 0) return null;

    const usersWithLastLead = await Promise.all(
      users.map(async (u) => {
        const lastLead = await prisma.lead.findFirst({
          where: { tenantId, assignedId: u.id },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true }
        });
        return {
          id: u.id,
          lastActivityAt: lastLead?.updatedAt || new Date(0)
        };
      })
    );

    usersWithLastLead.sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime());

    return usersWithLastLead[0].id;
  }

  async autoAssignLead(tenantId: string, leadId: string) {
    const telecallerId = await this.getNextUserByRole(tenantId, 'TELECALLER');
    const finalUserId = telecallerId || await this.getNextUserByRole(tenantId, 'COUNSELOR');

    if (!finalUserId) return null;

    return await prisma.lead.update({
      where: { id: leadId, tenantId },
      data: { assignedId: finalUserId },
      include: { assignedTo: true }
    });
  }

  async assignToassignedTo(tenantId: string, leadId: string) {
    const assignedId = await this.getNextUserByRole(tenantId, 'COUNSELOR');
    if (!assignedId) return null;

    return await prisma.lead.update({
      where: { id: leadId, tenantId },
      data: { assignedId },
      include: { assignedTo: true }
    });
  }
}

export default new AssignmentService();
