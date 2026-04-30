import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSyncTimes() {
  const latestSnapshots = await prisma.performanceSnapshot.findMany({
    distinct: ['studentId'],
    orderBy: { fetchedAt: 'desc' },
    select: { fetchedAt: true }
  });

  if (latestSnapshots.length === 0) {
    console.log('No snapshots found.');
    return;
  }

  const now = new Date();
  const ages = latestSnapshots.map(s => (now - new Date(s.fetchedAt)) / 1000 / 60);
  
  const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
  const maxAge = Math.max(...ages);
  const minAge = Math.min(...ages);

  console.log(`Total students with snapshots: ${latestSnapshots.length}`);
  console.log(`Average age of latest snapshot: ${avgAge.toFixed(1)} minutes`);
  console.log(`Min age: ${minAge.toFixed(1)} minutes`);
  console.log(`Max age: ${maxAge.toFixed(1)} minutes`);
  
  const stale = ages.filter(a => a > 10).length;
  console.log(`Snapshots older than 10 mins: ${stale}`);
}

checkSyncTimes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
