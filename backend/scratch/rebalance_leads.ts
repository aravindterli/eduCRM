import prisma from '../config/prisma';
import AssignmentService from '../services/assignment.service';

/**
 * FRESH LEAD REDISTRIBUTION
 * This script wipes the current assignedTo/Telecaller assignments
 * and splits all leads equally among the CURRENT available Telecallers.
 */
async function forceRedistributeLeads() {
  console.log('--- Starting Fresh Lead Redistribution ---');

  // 1. Fetch all leads that should be in the Telecaller pipeline
  // (Usually anything that isn't already CONFIRMED or LOST)
  const leadsToAssign = await prisma.lead.findMany({
    where: {
      stage: {
        notIn: ['ADMISSION_CONFIRMED', 'LOST_LEAD']
      }
    },
    select: { id: true, name: true }
  });

  console.log(`Wiping assignments for ${leadsToAssign.length} leads...`);

  // 2. Wipe current owner to force the Round-Robin to start clean for everyone
  await prisma.lead.updateMany({
    where: { id: { in: leadsToAssign.map(l => l.id) } },
    data: { assignedId: null }
  });

  console.log(`Starting fresh distribution among staff...`);

  // 3. Redistribute using fairness logic
  let count = 0;
  for (const lead of leadsToAssign) {
    const assigned = await AssignmentService.autoAssignLead(lead.id);
    if (assigned) {
      count++;
      if (count % 20 === 0) {
        console.log(`Distributed ${count} leads...`);
      }
    }
  }

  console.log(`--- Success! Successfully split ${count} leads equally among the team. ---`);
}

forceRedistributeLeads()
  .catch(err => console.error('Redistribution failed:', err))
  .finally(() => process.exit(0));
