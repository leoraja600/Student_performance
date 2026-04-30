import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkFixedStatus() {
  const fixed = await prisma.student.findMany({
    where: {
      OR: [
        { rollNumber: { startsWith: '7178' } },
        { rollNumber: { startsWith: '7179' } }
      ]
    },
    include: { snapshots: { take: 1, orderBy: { fetchedAt: 'desc' } } }
  });

  const fixedWithSnapshot = fixed.filter(s => s.snapshots.length > 0).length;
  console.log(`Fixed students: ${fixed.length}`);
  console.log(`Fixed students with at least one snapshot: ${fixedWithSnapshot}`);
}

checkFixedStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
