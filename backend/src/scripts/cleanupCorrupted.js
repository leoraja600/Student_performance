import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  const corrupted = await prisma.student.findMany({
    where: {
      OR: [
        { rollNumber: { contains: 'e+' } },
        { rollNumber: { contains: 'E+' } }
      ]
    }
  });

  console.log(`Deleting ${corrupted.length} corrupted students...`);
  
  for (const s of corrupted) {
    try {
      await prisma.user.deleteMany({ where: { studentId: s.id } });
      await prisma.student.delete({ where: { id: s.id } });
    } catch (e) {
      console.error(`Failed to delete ${s.rollNumber}: ${e.message}`);
    }
  }

  console.log('Cleanup complete.');
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
