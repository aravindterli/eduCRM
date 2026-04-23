
import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test users...');
  
  const password = await bcrypt.hash('password123', 10);
  
  const userPresets = [
    { name: 'Admin User', email: 'admin@test.com', role: RoleType.ADMIN },
    { name: 'Marketing User', email: 'marketing@test.com', role: RoleType.MARKETING_TEAM },
    { name: 'Telecaller User', email: 'telecaller@test.com', role: RoleType.TELECALLER },
    { name: 'assignedTo User', email: 'assignedTo@test.com', role: RoleType.COUNSELOR },
    { name: 'Finance User', email: 'finance@test.com', role: RoleType.FINANCE },
  ];

  for (const preset of userPresets) {
    const role = await prisma.role.findUnique({ where: { type: preset.role } });
    if (!role) {
      console.error(`Role ${preset.role} not found, skip user ${preset.email}`);
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: preset.email },
      update: {
        password: password,
        roleId: role.id
      },
      create: {
        name: preset.name,
        email: preset.email,
        password: password,
        roleId: role.id
      }
    });
    console.log(`User ${preset.role} created/updated: ${user.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
