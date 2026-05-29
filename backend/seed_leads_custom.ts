import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = '419094db-c814-46df-ba57-c3f6c09082d4';

  // 1. Verify tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.error(`❌ Tenant with ID ${tenantId} not found!`);
    process.exit(1);
  }

  console.log(`🌱 Seeding 30 real estate leads for Tenant: ${tenant.name} (${tenant.id})...`);

  // 2. Ensure real estate programs exist for this tenant
  const programsData = [
    { name: 'MyInfra Heights (2BHK/3BHK Flats)', baseFee: 7500000 },
    { name: 'MyInfra Greens (Premium Villas)', baseFee: 15000000 },
    { name: 'MyInfra Enclave (Residential Plots)', baseFee: 4500000 },
    { name: 'MyInfra Tech Park (Commercial Spaces)', baseFee: 25000000 },
  ];

  const seededPrograms = [];
  for (const p of programsData) {
    const prog = await prisma.program.upsert({
      where: { id: `realestate-${p.name.replace(/\s+/g, '-').toLowerCase()}-${tenantId}` },
      update: {},
      create: {
        id: `realestate-${p.name.replace(/\s+/g, '-').toLowerCase()}-${tenantId}`,
        tenantId,
        name: p.name,
        description: `Premium real estate offering: ${p.name}`,
        baseFee: p.baseFee,
      }
    });
    seededPrograms.push(prog);
  }
  console.log(`✅ Ensured ${seededPrograms.length} property programs exist.`);

  // 3. Fetch standard users for this tenant to assign leads to
  const staffUsers = await prisma.user.findMany({
    where: {
      tenantId,
      role: { type: 'STANDARDUSER' }
    }
  });

  if (staffUsers.length === 0) {
    console.error('❌ No standard staff users found for this tenant! Run seed_custom_realestate.ts first.');
    process.exit(1);
  }
  console.log(`✅ Found ${staffUsers.length} staff users to distribute leads.`);

  // 4. Generate 30 mock leads
  const mockNames = [
    'Aarav Patel', 'Aditya Sharma', 'Vivaan Sen', 'Vihaan Reddy', 'Sai Kumar',
    'Reyansh Nair', 'Krishna Gupta', 'Ishaan Joshi', 'Shaurya Bose', 'Dhiraj Mishra',
    'Ananya Rao', 'Diya Pillai', 'Pari Chauhan', 'Anika Deshmukh', 'Saisha Mehta',
    'Rahul Verma', 'Rohit Saxena', 'Kunal Kapoor', 'Sanjay Dutt', 'Vikram Seth',
    'Neha Dhupia', 'Pooja Hegde', 'Shruti Haasan', 'Kriti Sanon', 'Deepika Padukone',
    'Abhishek Bachchan', 'Siddharth Roy', 'Varun Dhawan', 'Arjun Rampal', 'Aditi Rao'
  ];

  const leadSources = ['google ads', 'social media', 'broker network', 'hoardings', 'direct walk-in'];
  const stages = ['NEW', 'CONTACTED', 'MEETING SCHEDULED', 'NEGOTIATION', 'CONVERTED'];

  for (let i = 0; i < 30; i++) {
    const staff = staffUsers[i % staffUsers.length];
    const prog = seededPrograms[i % seededPrograms.length];
    const name = mockNames[i];
    const phone = `+9198765${String(10000 + i)}`;
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@example.com`;
    const leadSource = leadSources[i % leadSources.length];
    const stage = stages[i % stages.length];

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        name,
        phone,
        email,
        leadSource,
        stage,
        assignedId: staff.id,
        interestedProgramId: prog.id,
        priority: (i % 3) * 10,
        location: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'][i % 5],
      }
    });
    console.log(`   [${i + 1}/30] Created lead: "${lead.name}" -> Assigned to: ${staff.name}`);
  }

  console.log('🎉 30 mock leads successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
