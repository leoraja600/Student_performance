import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkEmails() {
  const corrupted = await prisma.student.findMany({
    where: {
      OR: [
        { rollNumber: { contains: 'e+' } },
        { rollNumber: { contains: 'E+' } }
      ]
    }
  });

  console.log(`Checking ${corrupted.length} corrupted students...\n`);
  
  corrupted.slice(0, 5).forEach(s => {
    console.log(`- Name: ${s.name} | Roll: ${s.rollNumber} | Email: ${s.email}`);
  });
}

checkEmails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
