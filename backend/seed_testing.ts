
import { PrismaClient, RoleType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');
  
  // 1. Create Counselor Role
  const counselorRole = await prisma.role.upsert({
    where: { type: RoleType.COUNSELOR },
    update: {},
    create: {
      type: RoleType.COUNSELOR,
      permissions: { can_counsel: true }
    }
  });
  console.log('Counselor Role created/found');

  // 2. Create Test Counselor User
  const testUser = await prisma.user.upsert({
    where: { email: 'counselor@test.com' },
    update: {},
    create: {
      name: 'Test Counselor',
      email: 'counselor@test.com',
      password: 'hashed_password', // Mock password
      roleId: counselorRole.id
    }
  });
  console.log('Test Counselor User created/found:', testUser.id);
  
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
