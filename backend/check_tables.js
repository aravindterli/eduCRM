const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rules = await prisma.notificationRule.findMany({ take: 1 });
    console.log('✅ NotificationRule table EXISTS. rows:', rules.length);
  } catch(e) {
    console.error('❌ NotificationRule MISSING:', e.message);
  }

  try {
    const queue = await prisma.scheduledNotification.findMany({ take: 1 });
    console.log('✅ ScheduledNotification table EXISTS. rows:', queue.length);
  } catch(e) {
    console.error('❌ ScheduledNotification MISSING:', e.message);
  }

  await prisma.$disconnect();
}

main();
