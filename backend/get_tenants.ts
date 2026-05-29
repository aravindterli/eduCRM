import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching all tenants from database...');
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      sector: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log('\n--- Tenants List ---');
  if (tenants.length === 0) {
    console.log('No tenants found in the database.');
  } else {
    tenants.forEach((t, i) => {
      console.log(`${i + 1}. [${t.name}] | Slug: "${t.slug}" | Sector: ${t.sector} | ID: ${t.id} | Created: ${t.createdAt}`);
    });
  }
  console.log('-------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error fetching tenants:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
