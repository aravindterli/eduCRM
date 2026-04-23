import { PrismaClient, LeadStage, LeadTag, RoleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dummy leads...');

  const assignedTo = await prisma.user.findFirst({ where: { role: { type: RoleType.COUNSELOR } } });
  
  const leads = [
    {
      name: 'Rahul Sharma',
      phone: '+919876543210',
      email: 'rahul.s@example.com',
      location: 'Mumbai',
      leadSource: 'Google Ads',
      stage: LeadStage.NEW_LEAD,
      tag: LeadTag.HOT,
    },
    {
      name: 'Priya Patel',
      phone: '+919876543211',
      email: 'priya.p@example.com',
      location: 'Delhi',
      leadSource: 'Facebook',
      stage: LeadStage.INTERESTED,
      tag: LeadTag.WARM,
      assignedId: assignedTo?.id,
    },
    {
      name: 'Amit Kumar',
      phone: '+919876543212',
      email: 'amit.k@example.com',
      location: 'Bangalore',
      leadSource: 'Organic Search',
      stage: LeadStage.APPLICATION_STARTED,
      tag: LeadTag.HOT,
      assignedId: assignedTo?.id,
    },
    {
      name: 'Sneha Gupta',
      phone: '+919876543213',
      email: 'sneha.g@example.com',
      location: 'Pune',
      leadSource: 'Referral',
      stage: LeadStage.CONTACT_ATTEMPTED,
      tag: LeadTag.COLD,
    },
    {
      name: 'Vikram Singh',
      phone: '+919876543214',
      email: 'vikram.s@example.com',
      location: 'Hyderabad',
      leadSource: 'Website Form',
      stage: LeadStage.WEBINAR_REGISTERED,
      tag: LeadTag.WARM,
      assignedId: assignedTo?.id,
    }
  ];

  for (const leadData of leads) {
    await prisma.lead.create({
      data: leadData
    });
  }

  console.log('Dummy leads created successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
