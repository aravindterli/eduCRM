
import { PrismaClient, RoleType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');
  
  // 1. Create assignedTo Role
  const assignedToRole = await prisma.role.upsert({
    where: { type: RoleType.assignedTo },
    update: {},
    create: {
      type: RoleType.assignedTo,
      permissions: { can_counsel: true }
    }
  });
  console.log('assignedTo Role created/found');

  // 2. Create Test assignedTo User
  const testUser = await prisma.user.upsert({
    where: { email: 'assignedTo@test.com' },
    update: {},
    create: {
      name: 'Test assignedTo',
      email: 'assignedTo@test.com',
      password: 'hashed_password', // Mock password
      roleId: assignedToRole.id
    }
  });
  console.log('Test assignedTo User created/found:', testUser.id);
  
  // 3. Ensure some programs exist
  await prisma.program.upsert({
    where: { id: 'test-program-id' },
    update: {},
    create: {
      id: 'test-program-id',
      name: 'Computer Science',
      description: 'Test program'
    }
  });
  console.log('Test Program created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
