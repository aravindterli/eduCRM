import prisma from '../config/prisma';
import FeeService from '../services/fee.service';

const feeId = process.argv[2];

async function testManualPayment() {
  if (!feeId) {
    console.error('❌ Please provide a Fee ID as an argument.');
    console.log('Usage: npx ts-node .\scripts\test_payment.ts <FEE_ID>');
    
    // List some pending fees to help the user
    const pendingFees = await prisma.fee.findMany({ 
        where: { status: 'PENDING' }, 
        take: 5,
        include: { admission: { include: { application: { include: { lead: true } } } } }
    });
    
    if (pendingFees.length > 0) {
        console.log('\n--- Recent Pending Fees ---');
        pendingFees.forEach(f => {
            console.log(`ID: ${f.id} | Student: ${f.admission?.application?.lead?.name} | Amount: ${f.amount}`);
        });
    }
    return;
  }

  try {
    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) {
      console.error(`❌ Fee record not found: ${feeId}`);
      return;
    }

    console.log(`\n⏳ Simulating payment for Fee ID: ${feeId}...`);
    
    await FeeService.recordPayment({
      feeId,
      amount: fee.amount,
      method: 'Manual Test (Simulation)',
      transactionId: `TEST_TXN_${Date.now()}`,
    });

    console.log('✅ Payment recorded successfully!');
    console.log(`📈 The fee status has been updated to COMPLETED.`);
  } catch (error: any) {
    console.error(`❌ Error during simulation: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

testManualPayment();
