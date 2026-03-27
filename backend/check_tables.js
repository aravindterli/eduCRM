const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = await prisma.$queryRawUnsafe("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables:', JSON.stringify(tables, null, 2));
  } catch (e) {
    console.error('Error fetching tables:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
