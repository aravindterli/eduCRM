import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding global superadmin user...');

  const superAdminRole = await prisma.role.findFirst({
    where: { type: RoleType.SUPERADMIN, tenantId: null }
  });

  if (!superAdminRole) {
    console.error('❌ Global SUPERADMIN role not found! Please run seed_superadmin.ts first.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'puneeth@yopmail.com' },
    update: {
      password: passwordHash,
      roleId: superAdminRole.id,
      tenantId: null, // Global user
    },
    create: {
      name: 'Puneeth (Super Admin)',
      email: 'puneeth@yopmail.com',
      password: passwordHash,
      roleId: superAdminRole.id,
      tenantId: null, // Global user
    },
  });

  console.log('✅ Superadmin user created successfully:');
  console.log(`   Email: ${superAdminUser.email}`);
  console.log(`   Role ID: ${superAdminUser.roleId}`);
  console.log(`   Tenant ID: ${superAdminUser.tenantId || 'null (Global)'}`);
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed superadmin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
