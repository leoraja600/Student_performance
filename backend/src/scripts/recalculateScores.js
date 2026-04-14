import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// The scoring formula:
// Easy=20pts, Medium=30pts, Hard=50pts
// Max LC points = 2000, LC weight = 50% of final score
// HackerRank total solved max = 500, HR weight = 50%
const EASY_PTS = 20;
const MEDIUM_PTS = 30;
const HARD_PTS = 50;
const LC_MAX = 23510;  // Max weighted points in current dataset
const LC_WEIGHT = 50;
const HR_MAX = 500;
const HR_WEIGHT = 50;

async function recalcAll() {
  try {
    // Get the LATEST snapshot per student only
    const students = await prisma.student.findMany({
      where: { isActive: true },
      include: {
        snapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 1
        }
      }
    });

    console.log(`Recalculating scores for ${students.length} active students...`);
    let updated = 0;

    for (const student of students) {
      const snap = student.snapshots[0];
      if (!snap) continue;

      const easy = snap.leetcodeEasySolved || 0;
      const medium = snap.leetcodeMediumSolved || 0;
      const hard = snap.leetcodeHardSolved || 0;
      const hr = snap.hackerrankTotalSolved || 0;

      const lcPoints = (easy * EASY_PTS) + (medium * MEDIUM_PTS) + (hard * HARD_PTS);
      const lcScore = Math.min(lcPoints / LC_MAX, 1) * LC_WEIGHT;
      const hrScore = Math.min(hr / HR_MAX, 1) * HR_WEIGHT;
      const combinedScore = parseFloat((lcScore + hrScore).toFixed(2));

      await prisma.performanceSnapshot.update({
        where: { id: snap.id },
        data: { combinedScore }
      });
      updated++;
    }

    console.log(`Done! Updated ${updated} snapshots.`);
    
    // Show top 10 for verification
    const top10 = await prisma.performanceSnapshot.findMany({
      include: { student: { select: { name: true, rollNumber: true } } },
      orderBy: { combinedScore: 'desc' },
      take: 10
    });

    console.log('\n--- TOP 10 after recalculation ---');
    top10.forEach((s, i) => {
      const e = s.leetcodeEasySolved, m = s.leetcodeMediumSolved, h = s.leetcodeHardSolved;
      const pts = (e * 20) + (m * 30) + (h * 50);
      console.log(`#${i+1} ${s.student.name} | E:${e} M:${m} H:${h} | LC pts:${pts} | Score: ${s.combinedScore}`);
    });

  } catch (err) {
    console.error('Failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

recalcAll();
