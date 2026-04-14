import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const snapshots = await prisma.performanceSnapshot.findMany({
      include: {
        student: { select: { name: true, rollNumber: true } }
      },
      orderBy: { combinedScore: 'desc' },
      take: 20
    });

    console.log('--- Top 20 Students ---');
    console.table(snapshots.map(s => ({
      name: s.student.name,
      roll: s.student.rollNumber,
      easy: s.leetcodeEasySolved,
      med: s.leetcodeMediumSolved,
      hard: s.leetcodeHardSolved,
      hr: s.hackerrankTotalSolved,
      points: (s.leetcodeEasySolved * 20) + (s.leetcodeMediumSolved * 30) + (s.leetcodeHardSolved * 50),
      score: s.combinedScore
    })));

  } catch (error) {
    console.error('Task failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
