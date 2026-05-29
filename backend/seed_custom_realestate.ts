import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const tenantId = '419094db-c814-46df-ba57-c3f6c09082d4';
  
  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });
  
  if (!tenant) {
    console.error(`❌ Tenant with ID ${tenantId} not found!`);
    process.exit(1);
  }

  console.log(`🌱 Seeding custom real estate roles for Tenant: ${tenant.name} (${tenant.id})...`);
  const passwordHash = await bcrypt.hash('admin123', 10);

  const rolesToSeed = [
    {
      name: 'Property Consultant',
      email: 'consultant.infra@yopmail.com',
      userName: 'Puneeth Consultant',
      permissions: {
        leads: { read: true, write: true, edit: true, delete: false },
        nurturing: { read: true, write: true, edit: true, delete: false },
        reports: { read: true, write: false, edit: false, delete: false },
        marketing: { read: false, write: false, edit: false, delete: false },
        finance: { read: false, write: false, edit: false, delete: false },
        settings: { read: false, write: false, edit: false, delete: false }
      }
    },
    {
      name: 'Sales Executive',
      email: 'sales.infra@yopmail.com',
      userName: 'Puneeth Sales Exec',
      permissions: {
        leads: { read: true, write: true, edit: true, delete: true },
        nurturing: { read: true, write: true, edit: true, delete: true },
        reports: { read: true, write: true, edit: false, delete: false },
        marketing: { read: false, write: false, edit: false, delete: false },
        finance: { read: true, write: false, edit: false, delete: false },
        settings: { read: false, write: false, edit: false, delete: false }
      }
    },
    {
      name: 'Marketing Specialist',
      email: 'marketing.infra@yopmail.com',
      userName: 'Puneeth Marketer',
      permissions: {
        leads: { read: true, write: true, edit: true, delete: false },
        nurturing: { read: true, write: false, edit: false, delete: false },
        reports: { read: true, write: false, edit: false, delete: false },
        marketing: { read: true, write: true, edit: true, delete: true },
        finance: { read: false, write: false, edit: false, delete: false },
        settings: { read: false, write: false, edit: false, delete: false }
      }
    },
    {
      name: 'Leasing Agent',
      email: 'leasing.infra@yopmail.com',
      userName: 'Puneeth Leasing Agent',
      permissions: {
        leads: { read: true, write: true, edit: true, delete: false },
        nurturing: { read: true, write: true, edit: false, delete: false },
        reports: { read: true, write: false, edit: false, delete: false },
        marketing: { read: false, write: false, edit: false, delete: false },
        finance: { read: true, write: true, edit: true, delete: false },
        settings: { read: false, write: false, edit: false, delete: false }
      }
    }
  ];

  for (const roleDef of rolesToSeed) {
    // Create standard role
    const role = await prisma.role.create({
      data: {
        name: roleDef.name,
        type: RoleType.STANDARDUSER,
        permissions: roleDef.permissions,
        tenantId: tenant.id,
      }
    });
    console.log(`✅ Created custom role: "${role.name}" with ID: ${role.id}`);

    // Create standard user with that role
    const user = await prisma.user.create({
      data: {
        name: roleDef.userName,
        email: roleDef.email,
        password: passwordHash,
        roleId: role.id,
        tenantId: tenant.id,
      }
    });
    console.log(`   └─ Assigned User: ${user.name} (${user.email})`);
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
