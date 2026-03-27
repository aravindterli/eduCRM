
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSQL() {
  try {
    console.log('Testing Lead Query...');
    const result = await prisma.$queryRaw`
      SELECT CAST("createdAt" AS DATE) as date, COUNT(id) as count
      FROM "Lead"
      GROUP BY CAST("createdAt" AS DATE)
      ORDER BY date DESC
      LIMIT 30
    `;
    console.log('Lead Result:', result);

    console.log('Testing Finance Query...');
    const fin = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as revenue
      FROM "Payment"
      WHERE status = 'SUCCESS'
      GROUP BY month
      ORDER BY month ASC
    `;
     console.log('Finance Result:', fin);

  } catch (e) {
    console.error('SQL_ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSQL();
