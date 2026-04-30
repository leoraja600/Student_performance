import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findStudent() {
  const s = await prisma.student.findUnique({
     where: { rollNumber: '717823i101' }
  });
  console.log('Result:', s);
}

findStudent().finally(() => prisma.$disconnect());
