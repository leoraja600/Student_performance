import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSyncStatus() {
  const students = await prisma.student.findMany({
    where: { isActive: true },
    include: {
      snapshots: {
        orderBy: { fetchedAt: 'desc' },
        take: 1
      }
    }
  });

  const total = students.length;
  const synced = students.filter(s => s.snapshots.length > 0).length;
  const notSynced = total - synced;

  console.log(`Total Active Students: ${total}`);
  console.log(`Students with at least one snapshot: ${synced}`);
  console.log(`Students with NO snapshot: ${notSynced}`);

  if (notSynced > 0) {
    console.log('\nSample of students not synced:');
    students.filter(s => s.snapshots.length === 0)
      .slice(0, 30) // Show all 27 if possible
      .forEach(s => {
        const isCorrupted = s.rollNumber.toLowerCase().includes('e+') || s.leetcodeUsername.toLowerCase().includes('e+');
        console.log(`- ${s.name.padEnd(20)} | ${s.rollNumber.padEnd(15)} | LC: ${s.leetcodeUsername.padEnd(20)} | HR: ${s.hackerrankUsername.padEnd(20)} | ${isCorrupted ? '[CORRUPTED]' : '[CLEAN]'}`);
      });
  }

  const recentLogs = await prisma.fetchLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const failures = recentLogs.filter(l => l.status === 'FAILED');
  console.log(`\nRecent Fetch Logs (last 100):`);
  console.log(`- Successes: ${100 - failures.length}`);
  console.log(`- Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\nRecent failure reasons:');
    const reasons = [...new Set(failures.map(f => f.message))];
    reasons.forEach(r => console.log(`- ${r}`));
  }
}

checkSyncStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
