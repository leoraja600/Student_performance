import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUsernames() {
  const students = await prisma.student.findMany({
    select: { hackerrankUsername: true, leetcodeUsername: true }
  });

  const hrLinks = students.filter(s => s.hackerrankUsername.includes('http') || s.hackerrankUsername.includes('hackerrank.com'));
  const lcLinks = students.filter(s => s.leetcodeUsername.includes('http') || s.leetcodeUsername.includes('leetcode.com'));

  console.log(`Students with HackerRank LINKS in username field: ${hrLinks.length}`);
  console.log(`Students with LeetCode LINKS in username field: ${lcLinks.length}`);

  if (hrLinks.length > 0) {
    console.log('Sample HR Links:');
    hrLinks.slice(0, 5).forEach(s => console.log(`- ${s.hackerrankUsername}`));
  }
}

checkUsernames()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
