import { PrismaClient, Sector, LeadTag } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGlobalLeads() {
  console.log('🌱 Seeding Global Leads...');

  // 1. Ensure we have multiple tenants
  const tenants = [
    { name: 'Skyline Real Estate', slug: 'skyline', sector: Sector.REAL_ESTATE },
    { name: 'Global Health Clinic', slug: 'health-plus', sector: Sector.HEALTHCARE },
    { name: 'Elite Business School', slug: 'elite-edu', sector: Sector.EDUCATION },
  ];

  const createdTenants = [];
  for (const t of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    createdTenants.push(tenant);
  }

  // 2. Create leads for each tenant
  for (const tenant of createdTenants) {
    console.log(`Creating leads for ${tenant.name}...`);
    const count = 10;
    for (let i = 0; i < count; i++) {
      await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          name: `Lead ${i + 1} for ${tenant.slug}`,
          email: `lead${i + 1}@${tenant.slug}.com`,
          phone: `+9198765${tenant.slug.length}${i}${i}`,
          leadSource: 'Organic',
          stage: 'NEW',
          tag: i % 3 === 0 ? LeadTag.HOT : (i % 3 === 1 ? LeadTag.WARM : LeadTag.COLD),
        }
      });
    }
  }

  console.log('✅ Global leads seeded.');
}

seedGlobalLeads()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
