import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      }
    });
    console.log('Admins:', JSON.stringify(admins.map(u => ({ email: u.email, role: u.role })), null, 2));

    const facultys = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      }
    });
    console.log('Faculty:', JSON.stringify(facultys.map(u => ({ email: u.email, role: u.role })), null, 2));
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
