
import { PrismaClient, RoleType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');
  
  const roles = Object.values(RoleType);
  
  for (const roleType of roles) {
    const role = await prisma.role.upsert({
      where: { type: roleType },
      update: {},
      create: {
        type: roleType,
        permissions: {} // Default empty permissions
      }
    });
    console.log(`Role ${roleType} created/found: ${role.id}`);
  }

  // Create an initial Admin user if not exists
  const adminRole = await prisma.role.findUnique({ where: { type: RoleType.ADMIN } });
  if (adminRole) {
    const adminEmail = 'admin@centracrm.com';
    // Note: In a real app, use the hash function. For seeding, we might need to import it or use a known hash.
    // I'll assume standard 'password123' hashed for this seed if I had the util, 
    // but for now I'll just check if any user exists or skip password logic if complex.
    // Actually, I'll just seed the roles for now as requested.
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
