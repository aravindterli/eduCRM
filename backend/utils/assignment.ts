import prisma from '../config/prisma';

export const autoAssignLead = async (tenantId: string, leadId: string) => {
  // Simple logic: Assign to the counselor within the tenant with the fewest active leads
  let counselors = await prisma.user.findMany({
    where: { 
      tenantId,
      role: { 
        type: 'STANDARDUSER',
        name: { contains: 'consultant', mode: 'insensitive' }
      } 
    },
    include: { _count: { select: { leads: true } } }
  });

  if (counselors.length === 0) {
    counselors = await prisma.user.findMany({
      where: { 
        tenantId,
        role: { type: 'STANDARDUSER' } 
      },
      include: { _count: { select: { leads: true } } }
    });
  }

  if (counselors.length === 0) return null;

  // Sort by lead count ascending
  const optimalCounselor = counselors.sort((a, b) => a._count.leads - b._count.leads)[0];

  return await prisma.lead.update({
    where: { id: leadId, tenantId },
    data: { assignedId: optimalCounselor.id },
    include: { assignedTo: true }
  });
};
