
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const appId = '44c54126-5ab9-49dd-bd5e-38db200703ea';
  try {
    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: { admission: true }
    });
    console.log('APPLICATION_CHECK:', JSON.stringify(app, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
