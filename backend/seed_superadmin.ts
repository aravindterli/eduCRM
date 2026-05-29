import { PrismaClient, RoleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding global SUPERADMIN role...');

  const superAdminRole = await prisma.role.upsert({
    where: {
      tenantId_type: {
        tenantId: '', // Wait, tenantId is String?. In Prisma, unique constraints with nullable fields are tricky.
        // Actually, we can just findFirst to check if it exists, since nulls aren't strictly queryable in unique compound in some Prisma versions.
        type: RoleType.SUPERADMIN,
      } as any // We will just use create if not exists
    },
    update: {},
    create: {
      name: 'Super Administrator',
      type: RoleType.SUPERADMIN,
      permissions: {
        description: 'Global Super Admin with unrestricted access across the entire platform',
        all: true
      },
      tenantId: null,
    },
  }).catch(async () => {
      // If upsert fails due to null unique constraint issues, fallback to manual check
      const existing = await prisma.role.findFirst({
          where: { type: RoleType.SUPERADMIN, tenantId: null }
      });
      if (existing) return existing;
      return await prisma.role.create({
          data: {
              name: 'Super Administrator',
              type: RoleType.SUPERADMIN,
              permissions: {
                  description: 'Global Super Admin with unrestricted access across the entire platform',
                  all: true
              },
              tenantId: null,
          }
      });
  });

  console.log('✅ Global SUPERADMIN role created successfully with ID:', superAdminRole.id);
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed global superadmin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
