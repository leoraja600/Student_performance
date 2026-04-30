import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixCorruptedStudents() {
  const corrupted = await prisma.student.findMany({
    where: {
      OR: [
        { rollNumber: { contains: 'e+' } },
        { rollNumber: { contains: 'E+' } }
      ]
    }
  });

  console.log(`Fixing ${corrupted.length} corrupted students...`);
  
  let fixedCount = 0;
  for (const student of corrupted) {
    const emailPrefix = student.email.split('@')[0];
    if (emailPrefix && emailPrefix.length > 5 && !emailPrefix.includes('e+')) {
      const realRollNumber = emailPrefix;
      const leetcodeUsername = student.leetcodeUsername.includes('e+') ? `lc_${realRollNumber}` : student.leetcodeUsername;
      const hackerrankUsername = `hr_${realRollNumber}`;

      await prisma.student.update({
        where: { id: student.id },
        data: {
          rollNumber: realRollNumber,
          leetcodeUsername: leetcodeUsername,
          hackerrankUsername: hackerrankUsername
        }
      });
      fixedCount++;
    }
  }

  console.log(`Successfully fixed ${fixedCount} students.`);
}

fixCorruptedStudents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
