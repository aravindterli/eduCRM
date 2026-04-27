import prisma from '../config/prisma';
import { hashPassword } from '../utils/auth';

/**
 * CREATE TEAM ACCOUNTS
 * This script creates the missing Telecaller and assignedTo accounts.
 */
async function createTeam() {
  console.log('--- Creating Team Accounts ---');

  const password = await hashPassword('centracrm123'); // Default password for new staff

  const roles = await prisma.role.findMany();
  const telecallerRole = roles.find(r => r.type === 'TELECALLER');
  const assignedToRole = roles.find(r => r.type === 'COUNSELOR');

  if (!telecallerRole || !assignedToRole) {
    console.error('Required roles not found in DB.');
    return;
  }

  const teamMembers = [
    { name: 'Telecaller B', email: 'telecaller.b@centracrm.com', roleId: telecallerRole.id },
    { name: 'Telecaller C', email: 'telecaller.c@centracrm.com', roleId: telecallerRole.id },
    { name: 'assignedTo B', email: 'assignedTo.b@centracrm.com', roleId: assignedToRole.id },
  ];

  for (const member of teamMembers) {
    try {
      const user = await prisma.user.upsert({
        where: { email: member.email },
        update: { roleId: member.roleId },
        create: {
          name: member.name,
          email: member.email,
          password,
          roleId: member.roleId
        }
      });
      console.log(`Created/Updated: ${user.name} (${member.email})`);
    } catch (err) {
      console.error(`Failed to create ${member.name}:`, err);
    }
  }

  console.log('--- Team Creation Complete ---');
}

createTeam()
  .catch(err => console.error(err))
  .finally(() => process.exit(0));
