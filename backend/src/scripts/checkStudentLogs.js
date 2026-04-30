import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkStudentLogs() {
  const student = await prisma.student.findFirst({
    where: { name: { contains: 'Obli Sanjay' } },
    include: { fetchLogs: { orderBy: { createdAt: 'desc' }, take: 10 } }
  });

  if (!student) {
    console.log('Student not found');
    return;
  }

  console.log(`Logs for ${student.name} (${student.rollNumber}):`);
  student.fetchLogs.forEach(l => {
    console.log(`- [${l.createdAt.toISOString()}] ${l.platform}: ${l.status} | ${l.message}`);
  });
}

checkStudentLogs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
