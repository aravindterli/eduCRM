const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating existing leads to COLD tag...');
  
  const result = await prisma.lead.updateMany({
    where: {
      tag: null,
      NOT: {
        stage: 'LOST_LEAD'
      }
    },
    data: {
      tag: 'COLD'
    }
  });

  console.log(`Successfully updated ${result.count} leads to COLD.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
