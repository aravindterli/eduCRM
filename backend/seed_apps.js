
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    const lead = await prisma.lead.findFirst({
        where: { stage: 'NEW_LEAD' }
    });
    const program = await prisma.program.findFirst();

    if (lead && program) {
      const app = await prisma.application.upsert({
        where: { leadId: lead.id },
        update: {},
        create: {
          leadId: lead.id,
          programId: program.id,
          status: 'STARTED',
        }
      });
      console.log('Application Seeded:', app.id);
      
      await prisma.lead.update({
        where: { id: lead.id },
        data: { stage: 'APPLICATION_STARTED' }
      });
      console.log('Lead Stage Updated to APPLICATION_STARTED');
    } else {
      console.log('No lead or program found to seed application');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
