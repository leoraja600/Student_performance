import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkEmail() {
  const email = '717823f211@kce.ac.in';
  const students = await prisma.student.findMany({ where: { email } });
  console.log(`Students with email ${email}:`, students.map(s => ({ roll: s.rollNumber, name: s.name })));
}

checkEmail().finally(() => prisma.$disconnect());
