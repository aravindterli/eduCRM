import { PrismaClient, RoleType, Sector, ApplicationStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive multi-tenant multi-sector database seeding with tenant-specific roles...');

  // 1. Define the active tenants to seed
  const tenantsConfig = [
    { name: 'My Infras', slug: 'myinfra-realestate', sector: Sector.REAL_ESTATE },
    { name: 'MyInfra', slug: 'myinfra', sector: Sector.REAL_ESTATE },
    { name: 'Apllo', slug: 'apollo-health', sector: Sector.HEALTHCARE },
    { name: 'Centra University', slug: 'demo-edu', sector: Sector.EDUCATION },
    { name: 'CentraCRM System', slug: 'system', sector: Sector.GENERIC },
  ];

  const passwordHash = await bcrypt.hash('counselor123', 10);

  // Iterate over each tenant configuration
  for (const tConfig of tenantsConfig) {
    console.log(`\n======================================================`);
    console.log(`🚀 Seeding Tenant: "${tConfig.name}" (Slug: "${tConfig.slug}", Sector: ${tConfig.sector})`);
    console.log(`======================================================`);

    const tenant = await prisma.tenant.upsert({
      where: { slug: tConfig.slug },
      update: {
        name: tConfig.name,
        sector: tConfig.sector,
      },
      create: {
        name: tConfig.name,
        slug: tConfig.slug,
        sector: tConfig.sector,
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'PREMIUM',
      },
    });

    // Cleanup existing mock records for this tenant to ensure fresh recalculations
    console.log(`[${tenant.slug}] Cleaning up existing data...`);
    await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.fee.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.admission.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.application.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.counselingLog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.lead.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.webinar.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.program.deleteMany({ where: { tenantId: tenant.id } });
    
    // Clean up existing roles for this tenant
    await prisma.role.deleteMany({ where: { tenantId: tenant.id } });
    console.log(`[${tenant.slug}] ✅ Cleanup complete.`);

    // 2. Seed tenant-specific roles (unique per [tenantId, type])
    console.log(`[${tenant.slug}] Seeding 5 tenant-specific roles...`);
    const tenantRolesMap: { [key: string]: string } = {};
    const roleTypes = Object.values(RoleType);
    for (const type of roleTypes) {
      const roleName = type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
      const role = await prisma.role.create({
        data: {
          name: roleName,
          type,
          permissions: {
            description: `Custom permissions for ${type} role in ${tenant.name}`,
          },
          tenantId: tenant.id,
        },
      });
      tenantRolesMap[type] = role.id;
    }
    console.log(`[${tenant.slug}] ✅ Tenant roles successfully created.`);

    // 3. Define 5 custom users for the tenant based on sector
    console.log(`[${tenant.slug}] Seeding 5 sector-specific users mapping to tenant roles...`);
    let usersData: { name: string; email: string; roleType: RoleType }[] = [];

    if (tConfig.sector === Sector.REAL_ESTATE) {
      usersData = [
        { name: 'zara khan (sales executive)', email: `zarakhan@${tenant.slug}.com`, roleType: RoleType.ADMIN },
        { name: 'mia davis (marketing lead)', email: `miadavis@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'oliver kim (pre-sales caller)', email: `oliverkim@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'amelia wilson (property consultant)', email: `ameliawilson@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'john smith (leasing finance)', email: `johnsmith@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
      ];
    } else if (tConfig.sector === Sector.HEALTHCARE) {
      usersData = [
        { name: 'zara khan (clinical operations)', email: `zarakhan@${tenant.slug}.com`, roleType: RoleType.ADMIN },
        { name: 'mia davis (patient outreach)', email: `miadavis@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'oliver kim (reception specialist)', email: `oliverkim@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'amelia wilson (care coordinator)', email: `ameliawilson@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'john smith (insurance billing)', email: `johnsmith@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
      ];
    } else if (tConfig.sector === Sector.EDUCATION) {
      usersData = [
        { name: 'zara khan (admissions registrar)', email: `zarakhan@${tenant.slug}.com`, roleType: RoleType.ADMIN },
        { name: 'mia davis (outreach director)', email: `miadavis@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'oliver kim (campus caller)', email: `oliverkim@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'amelia wilson (academic advisor)', email: `ameliawilson@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'john smith (tuition bursar)', email: `johnsmith@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
      ];
    } else { // GENERIC
      usersData = [
        { name: 'zara khan (operations head)', email: `zarakhan@${tenant.slug}.com`, roleType: RoleType.ADMIN },
        { name: 'mia davis (campaign strategist)', email: `miadavis@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'oliver kim (support team)', email: `oliverkim@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'amelia wilson (client relations)', email: `ameliawilson@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
        { name: 'john smith (accounting officer)', email: `johnsmith@${tenant.slug}.com`, roleType: RoleType.STANDARDUSER },
      ];
    }

    const seededUsers: any[] = [];
    for (const u of usersData) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          roleId: tenantRolesMap[u.roleType],
        },
        create: {
          name: u.name,
          email: u.email,
          password: passwordHash,
          roleId: tenantRolesMap[u.roleType],
          tenantId: tenant.id,
          theme: 'ocean',
          accent: 'blue',
        },
      });
      seededUsers.push(user);
    }
    console.log(`[${tenant.slug}] ✅ 5 sector-specific users mapping to tenant roles upserted.`);

    // 4. Ensure Programs (Property projects, medical packages, courses, services) exist
    console.log(`[${tenant.slug}] Seeding sector-specific product programs...`);
    let programsData: { name: string; baseFee: number }[] = [];

    if (tConfig.sector === Sector.REAL_ESTATE) {
      programsData = [
        { name: 'MyInfra Heights (2BHK/3BHK Flats)', baseFee: 7500000 },
        { name: 'MyInfra Greens (Premium Villas)', baseFee: 15000000 },
        { name: 'MyInfra Enclave (Residential Plots)', baseFee: 4500000 },
        { name: 'MyInfra Tech Park (Commercial Spaces)', baseFee: 25000000 },
      ];
    } else if (tConfig.sector === Sector.HEALTHCARE) {
      programsData = [
        { name: 'Executive Health Checkup Package', baseFee: 15000 },
        { name: 'Cardiology Screening Consultation', baseFee: 25000 },
        { name: 'Orthopedic Joint Care Treatment', baseFee: 120000 },
        { name: 'Advanced Pediatric Care Wellness', baseFee: 35000 },
      ];
    } else if (tConfig.sector === Sector.EDUCATION) {
      programsData = [
        { name: 'Computer Science & Engineering', baseFee: 150000 },
        { name: 'Data Science & Analytics', baseFee: 175000 },
        { name: 'Business Administration (MBA)', baseFee: 120000 },
        { name: 'Mechanical Engineering', baseFee: 110000 },
      ];
    } else { // GENERIC
      programsData = [
        { name: 'Enterprise CRM Suite Plan', baseFee: 95000 },
        { name: 'Corporate Infrastructure Support', baseFee: 180000 },
        { name: 'Cloud Hosting Migration Service', baseFee: 120000 },
        { name: 'Strategic Business Consulting', baseFee: 150000 },
      ];
    }

    const seededPrograms: any[] = [];
    for (const prog of programsData) {
      const program = await prisma.program.create({
        data: {
          tenantId: tenant.id,
          name: prog.name,
          description: `Premium sector package under ${prog.name} for ${tenant.name}`,
          baseFee: prog.baseFee,
        },
      });
      seededPrograms.push(program);
    }
    console.log(`[${tenant.slug}] ✅ ${seededPrograms.length} property/service products created.`);

    // 5. Seed pipeline workflows (15 mock leads, 3 closed-won/in-progress flows, and upcoming webinars)
    console.log(`[${tenant.slug}] Seeding conversion pipelines and leads...`);
    const leadSources = ['broker network', 'social media', 'google ads', 'hoardings', 'direct walk-in'];
    const leadStages = ['NEW', 'CONTACTED', 'MEETING SCHEDULED', 'NEGOTIATION', 'CONVERTED'];

    const mockNames = [
      'rajesh kumar', 'sanjay gupta', 'sunita rao', 'amit patel', 'priya sharma',
      'karan singh', 'neha verma', 'rohan joshi', 'deepa nair', 'vijay reddy',
      'anil chauhan', 'meera sen', 'rajiv mishra', 'shalini pillai', 'suresh bose'
    ];

    // Seed 15 miscellaneous leads
    for (let i = 0; i < 15; i++) {
      const user = seededUsers[i % seededUsers.length];
      const prog = seededPrograms[i % seededPrograms.length];
      const source = leadSources[i % leadSources.length];
      const stage = leadStages[i % leadStages.length];

      await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          name: mockNames[i],
          phone: `+9198765432${i}`,
          email: `${mockNames[i].replace(/\s+/g, '')}@${tenant.slug}.com`,
          leadSource: source,
          stage: stage,
          assignedId: user.id,
          interestedProgramId: prog.id,
          priority: i % 3,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        },
      });
    }

    // FLOW 1: Full closed-won admission flow with booking payment success
    const counselorUser = seededUsers.find(u => u.roleId === tenantRolesMap[RoleType.STANDARDUSER]) || seededUsers[3];
    const programProduct1 = seededPrograms[0];
    
    const lead1 = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        name: 'arjun sharma',
        phone: '+919999888877',
        email: `arjun.sharma@${tenant.slug}.com`,
        leadSource: 'direct walk-in',
        stage: 'CONVERTED',
        assignedId: counselorUser.id,
        interestedProgramId: programProduct1.id,
        priority: 2,
      },
    });

    await prisma.counselingLog.create({
      data: {
        tenantId: tenant.id,
        leadId: lead1.id,
        assignedId: counselorUser.id,
        notes: `held details discussions on ${programProduct1.name}. client validated terms.`,
        recommendation: 'proceeding with booking payment and registration.',
      },
    });

    const app1 = await prisma.application.create({
      data: {
        tenantId: tenant.id,
        leadId: lead1.id,
        programId: programProduct1.id,
        status: ApplicationStatus.VERIFIED,
        submittedAt: new Date(),
      },
    });

    const adm1 = await prisma.admission.create({
      data: {
        tenantId: tenant.id,
        applicationId: app1.id,
        enrollmentId: `REG-${tenant.slug.toUpperCase()}-001`,
        programId: programProduct1.id,
      },
    });

    const bookingAmount1 = Math.round(programProduct1.baseFee * 0.1) || 10000;
    const fee1 = await prisma.fee.create({
      data: {
        tenantId: tenant.id,
        admissionId: adm1.id,
        amount: bookingAmount1,
        status: 'PAID',
      },
    });

    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        feeId: fee1.id,
        amount: bookingAmount1,
        method: 'ONLINE',
        transactionId: `TXN-${tenant.slug.toUpperCase()}-001`,
        status: PaymentStatus.SUCCESS,
        createdAt: new Date(),
      },
    });

    // FLOW 2: Second closed-won admission flow with booking payment success
    const programProduct2 = seededPrograms[1];
    const lead2 = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        name: 'priya patel',
        phone: '+919999777766',
        email: `priya.patel@${tenant.slug}.com`,
        leadSource: 'google ads',
        stage: 'CONVERTED',
        assignedId: counselorUser.id,
        interestedProgramId: programProduct2.id,
        priority: 1,
      },
    });

    await prisma.counselingLog.create({
      data: {
        tenantId: tenant.id,
        leadId: lead2.id,
        assignedId: counselorUser.id,
        notes: `reviewed requirements for ${programProduct2.name}. client highly positive.`,
        recommendation: 'allotment process initiated.',
      },
    });

    const app2 = await prisma.application.create({
      data: {
        tenantId: tenant.id,
        leadId: lead2.id,
        programId: programProduct2.id,
        status: ApplicationStatus.VERIFIED,
        submittedAt: new Date(),
      },
    });

    const adm2 = await prisma.admission.create({
      data: {
        tenantId: tenant.id,
        applicationId: app2.id,
        enrollmentId: `REG-${tenant.slug.toUpperCase()}-002`,
        programId: programProduct2.id,
      },
    });

    const bookingAmount2 = Math.round(programProduct2.baseFee * 0.1) || 10000;
    const fee2 = await prisma.fee.create({
      data: {
        tenantId: tenant.id,
        admissionId: adm2.id,
        amount: bookingAmount2,
        status: 'PAID',
      },
    });

    await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        feeId: fee2.id,
        amount: bookingAmount2,
        method: 'ONLINE',
        transactionId: `TXN-${tenant.slug.toUpperCase()}-002`,
        status: PaymentStatus.SUCCESS,
        createdAt: new Date(),
      },
    });

    // FLOW 3: Form booking application in-progress
    const programProduct3 = seededPrograms[2];
    const lead3 = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        name: 'rohit verma',
        phone: '+919999666655',
        email: `rohit.verma@${tenant.slug}.com`,
        leadSource: 'social media',
        stage: 'NEGOTIATION',
        assignedId: counselorUser.id,
        interestedProgramId: programProduct3.id,
        priority: 2,
      },
    });

    await prisma.counselingLog.create({
      data: {
        tenantId: tenant.id,
        leadId: lead3.id,
        assignedId: counselorUser.id,
        notes: `customer submitted booking form for ${programProduct3.name}. documents verified.`,
      },
    });

    await prisma.application.create({
      data: {
        tenantId: tenant.id,
        leadId: lead3.id,
        programId: programProduct3.id,
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    // FLOW 4: Upcoming webinar/event
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await prisma.webinar.create({
      data: {
        tenantId: tenant.id,
        title: `Exclusive ${tenant.name} Sector Briefing & Showcase`,
        description: `Learn how ${tenant.name} facilitates best-in-class solutions in our active sector.`,
        date: futureDate,
      },
    });

    console.log(`[${tenant.slug}] ✅ Pipeline flows and event successfully seeded.`);
  }

  console.log('\n✨ Database seeding completed successfully across all tenants with tenant-specific roles! ✨');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
