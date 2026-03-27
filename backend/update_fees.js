
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  try {
    await prisma.program.updateMany({
      data: { baseFee: 15000 }
    });
    console.log('Updated all programs with $15k base fee');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

update();
