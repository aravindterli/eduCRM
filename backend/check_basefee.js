
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const program = await prisma.program.findFirst();
    console.log('PROGRAM_SAMPLE:', JSON.stringify(program, null, 2));
    if (program && 'baseFee' in program) {
      console.log('SUCCESS: baseFee field exists in the client.');
    } else {
      console.log('FAILURE: baseFee field does NOT exist in the client.');
    }
  } catch (e) {
    console.error('ERROR during check:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
