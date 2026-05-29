const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying first lead...');
    const lead = await prisma.lead.findFirst();
    console.log('Lead stage in DB:', lead ? lead.stage : 'No leads found');
    
    console.log('Attempting to create a temporary lead with a custom stage "MEETING SCHEDULED"...');
    // We try to create a dummy lead with a custom stage to see if the DB allows it
    const tempLead = await prisma.lead.create({
      data: {
        name: 'Test Stage Lead',
        phone: '1234567890',
        leadSource: 'TEST',
        stage: 'MEETING SCHEDULED',
        tenant: {
          connect: { id: (lead ? lead.tenantId : (await prisma.tenant.findFirst()).id) }
        }
      }
    });
    console.log('✅ Success! Custom stage is supported in DB. Created lead ID:', tempLead.id);
    
    // Clean up
    await prisma.lead.delete({ where: { id: tempLead.id } });
    console.log('Cleaned up test lead.');
  } catch (err) {
    console.error('❌ Failed! Database rejected the custom stage or threw an error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
