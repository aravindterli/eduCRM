
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const leads = await prisma.lead.findMany({ take: 5 });
    const apps = await prisma.application.count();
    const programs = await prisma.program.findMany({ take: 1 });
    console.log('DATA_REPORT');
    console.log('Leads:', leads.map(l => ({ id: l.id, name: l.name, stage: l.stage })));
    console.log('Applications Count:', apps);
    console.log('Program ID:', programs[0]?.id);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
