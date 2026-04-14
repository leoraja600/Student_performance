import prisma from './prisma.js';

async function main() {
  const settings = [
    { key: 'LEETCODE_MAX_SCORE', value: '23510', description: 'Points (weighted) to reach max LeetCode score' },
    { key: 'LEETCODE_WEIGHT', value: '40', description: 'Total weight of LeetCode in combined score (0-100)' },
    { key: 'HACKERRANK_MAX_SCORE', value: '500', description: 'HackerRank solved count to reach max score' },
    { key: 'HACKERRANK_WEIGHT', value: '40', description: 'Total weight of HackerRank in combined score (0-100)' },
    { key: 'HACKATHON_MAX_SCORE', value: '10', description: 'Hackathon events to reach max score contribution' },
    { key: 'HACKATHON_WEIGHT', value: '20', description: 'Total weight of Hackathons in combined score (0-100)' }
  ];

  console.log('Seeding updated scoring settings (LC=40, HR=40, HK=20)...');

  for (const s of settings) {
    await prisma.appSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    });
  }
  console.log('Seed successful.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
