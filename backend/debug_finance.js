
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('--- LEADS ---');
  const leads = await prisma.lead.findMany();
  console.log(leads.length);

  console.log('--- APPLICATIONS ---');
  const apps = await prisma.application.findMany({
    include: { admission: true }
  });
  console.log(apps.length);

  console.log('--- ADMISSIONS ---');
  const admissions = await prisma.admission.findMany();
  console.log(admissions.length);

  console.log('--- FEES ---');
  const fees = await prisma.fee.findMany({
    include: {
      admission: {
        include: {
          application: {
            include: {
              lead: true,
              program: true,
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(fees, null, 2));

  console.log('--- PROGRAMS ---');
  const programs = await prisma.program.findMany();
  console.log(programs.length);
}

checkData()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
