
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recover() {
  try {
    const admissionsWithoutFees = await prisma.admission.findMany({
      where: {
        fees: { none: {} }
      },
      include: {
        program: true
      }
    });

    console.log(`Found ${admissionsWithoutFees.length} admissions without fees.`);

    for (const admission of admissionsWithoutFees) {
      await prisma.fee.create({
        data: {
          admissionId: admission.id,
          amount: admission.program?.baseFee || 15000,
          status: 'PENDING'
        }
      });
      console.log(`Created fee for Admission: ${admission.enrollmentId}`);
    }

    console.log('Recovery complete.');
  } catch (e) {
    console.error('RECOVERY_ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

recover();
