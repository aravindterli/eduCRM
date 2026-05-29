import { PrismaClient, RoleType, Sector } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Roles
  console.log('Seeding Roles...');
  const roleTypes = Object.values(RoleType);
  for (const type of roleTypes) {
    await prisma.role.upsert({
      where: { type },
      update: {},
      create: {
        type,
        permissions: {}, // Default permissions
      },
    });
  }
  console.log('✅ Roles seeded.');

  // 2. Create System Tenant (for Superadmins)
  console.log('Creating System Tenant...');
  const systemTenant = await prisma.tenant.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'CentraCRM System',
      slug: 'system',
      sector: Sector.GENERIC,
    },
  });
  console.log('✅ System Tenant created.');

  // 3. Create Superadmin User
  console.log('Creating Superadmin User...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superadminRole = await prisma.role.findUnique({ where: { type: RoleType.SUPERADMIN } });
  
  if (superadminRole) {
    await prisma.user.upsert({
      where: { email: 'superadmin@centracrm.com' },
      update: {},
      create: {
        name: 'System Superadmin',
        email: 'superadmin@centracrm.com',
        password: hashedPassword,
        roleId: superadminRole.id,
        tenantId: systemTenant.id,
      },
    });
  }
  console.log('✅ Superadmin User created.');

  // 4. Create Demo Tenant (Education)
  console.log('Creating Demo Education Tenant...');
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-edu' },
    update: {},
    create: {
      name: 'Centra University',
      slug: 'demo-edu',
      sector: Sector.EDUCATION,
    },
  });
  console.log('✅ Demo Education Tenant created.');

  // 5. Create Admin for Demo Tenant
  console.log('Creating Admin for Demo Tenant...');
  const adminRole = await prisma.role.findUnique({ where: { type: RoleType.ADMIN } });
  
  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@demoedu.com' },
      update: {},
      create: {
        name: 'Demo Admin',
        email: 'admin@demoedu.com',
        password: hashedPassword,
        roleId: adminRole.id,
        tenantId: demoTenant.id,
      },
    });
  }
  console.log('✅ Demo Admin User created.');

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
