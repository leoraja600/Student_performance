import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.student.count();
  console.log(`Student Count: ${count}`);
  const userCount = await prisma.user.count();
  console.log(`User Count: ${userCount}`);
  const snapshotCount = await prisma.performanceSnapshot.count();
  console.log(`Performance Snapshot Count: ${snapshotCount}`);
}

check().then(() => prisma.$disconnect());
