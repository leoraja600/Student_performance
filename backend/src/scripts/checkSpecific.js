import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSpecific() {
  const student = await prisma.student.findFirst({
    where: { name: { contains: 'RATHIKA' } }
  });
  console.log(`Student: ${student?.name} | Roll: ${student?.rollNumber} | HR: ${student?.hackerrankUsername}`);
}

checkSpecific()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
