import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findMax() {
  const snaps = await prisma.performanceSnapshot.findMany({
    where: { student: { isActive: true } },
    select: {
      leetcodeEasySolved: true,
      leetcodeMediumSolved: true,
      leetcodeHardSolved: true,
      hackerrankTotalSolved: true
    }
  });

  let maxPts = 0;
  let maxHR = 0;
  snaps.forEach(s => {
    const pts = (s.leetcodeEasySolved * 20) + (s.leetcodeMediumSolved * 30) + (s.leetcodeHardSolved * 50);
    if (pts > maxPts) maxPts = pts;
    if (s.hackerrankTotalSolved > maxHR) maxHR = s.hackerrankTotalSolved;
  });

  process.stdout.write(`MAX_LC_PTS=${maxPts}\nMAX_HR=${maxHR}\n`);
  await prisma.$disconnect();
}

findMax().catch(e => { console.error(e); process.exit(1); });
