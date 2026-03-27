import prisma from "./config/prisma";


async function audit() {
  try {
    const leadsCount = await prisma.lead.count();
    const appsCount = await prisma.application.count();
    const leads = await prisma.lead.findMany({
      take: 5,
      select: { id: true, name: true, stage: true }
    });
    const programs = await prisma.program.findMany({ take: 1 });

    console.log('--- AUDIT REPORT ---');
    console.log('Leads Total:', leadsCount);
    console.log('Applications Total:', appsCount);
    console.log('Sample Leads:', leads);
    console.log('Sample Program:', programs[0]?.id || 'NONE');
    console.log('--------------------');
  } catch (e) {
    console.error('Audit failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
