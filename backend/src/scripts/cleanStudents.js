import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  try {
    console.log('Cleaning non-admin users and students...');
    const userCount = await prisma.user.deleteMany({
      where: {
        NOT: {
          role: 'ADMIN'
        }
      }
    });
    console.log(`Deleted ${userCount.count} users.`);

    const studentCount = await prisma.student.deleteMany({});
    console.log(`Deleted ${studentCount.count} students.`);

    console.log('Cleanup successful.');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
