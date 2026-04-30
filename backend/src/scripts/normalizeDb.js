import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function normalize() {
  const students = await prisma.student.findMany();
  console.log(`Normalizing ${students.length} students...`);

  for (const s of students) {
    await prisma.student.update({
      where: { id: s.id },
      data: {
        rollNumber: s.rollNumber.toLowerCase(),
        email: s.email.toLowerCase(),
        leetcodeUsername: s.leetcodeUsername.toLowerCase(),
        hackerrankUsername: s.hackerrankUsername.toLowerCase()
      }
    });
  }

  const users = await prisma.user.findMany();
  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { email: u.email.toLowerCase() }
    });
  }

  console.log('Normalization complete.');
}

normalize().catch(console.error).finally(() => prisma.$disconnect());
