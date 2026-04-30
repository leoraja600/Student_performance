import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkHR() {
  const students = await prisma.student.findMany({ select: { rollNumber: true, hackerrankUsername: true } });
  const hasSpecificHR = students.filter(s => s.hackerrankUsername !== `hr_${s.rollNumber}`);
  console.log(`Students with custom HR usernames: ${hasSpecificHR.length} / ${students.length}`);
}

checkHR().finally(() => prisma.$disconnect());
