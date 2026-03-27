import CommunicationService from '../services/communication.service';
import dotenv from 'dotenv';
import prisma from '../config/prisma';

dotenv.config();

async function testEmail() {
  console.log('--- SMTP DIAGNOSTIC TEST ---');
  
  const testData = {
    name: 'Test Recipient',
    template: 'welcome_lead'
  };

  const recipient = process.env.TEST_EMAIL || 'aravindterli@gmail.com';
  
  console.log(`Sending test email to: ${recipient}`);

  try {
    // We'll create a dummy lead if none exists to satisfy communication log lookup
    let lead = await prisma.lead.findFirst();
    if (!lead) {
       console.log('No leads found, creating temporary audit lead...');
       lead = await prisma.lead.create({
         data: {
           name: 'Audit Lead',
           phone: '0000000000',
           email: recipient,
           leadSource: 'Audit'
         }
       });
    }

    const result = await CommunicationService.sendEmail(
      recipient,
      'welcome_lead',
      testData,
      lead.id
    );

    if (result.success) {
      console.log('✅ SMTP Dispatch successful!');
      console.log('Message ID:', result.messageId);
    } else {
      console.error('❌ SMTP Dispatch failed:', result.error);
    }
  } catch (err: any) {
    console.error('Critical test failure:', err.message);
  } finally {
    process.exit(0);
  }
}

testEmail();
