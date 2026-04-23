import prisma from '../config/prisma';

export const autoAssignLead = async (leadId: string) => {
  // Simple logic: Assign to the assignedTo with the fewest active leads
  const assignedTos = await prisma.user.findMany({
    where: { role: { type: 'COUNSELOR' } },
    include: { _count: { select: { leads: true } } }
  });

  if (assignedTos.length === 0) return null;

  // Sort by lead count ascending
  const optimalCOUNSELOR = assignedTos.sort((a, b) => a._count.leads - b._count.leads)[0];

  return await prisma.lead.update({
    where: { id: leadId },
    data: { assignedId: optimalCOUNSELOR.id }
  });
};
