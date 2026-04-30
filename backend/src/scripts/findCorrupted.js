import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findCorruptedData() {
  const students = await prisma.student.findMany();
  
  const corrupted = students.filter(s => 
    s.rollNumber.includes('e+') || 
    s.leetcodeUsername.includes('e+') || 
    s.hackerrankUsername.includes('e+') ||
    s.rollNumber.includes('E+') || 
    s.leetcodeUsername.includes('E+') || 
    s.hackerrankUsername.includes('E+')
  );

  console.log(`Found ${corrupted.length} students with scientific notation in their data.`);
  
  if (corrupted.length > 0) {
    console.log('\nSample corrupted students:');
    corrupted.slice(0, 10).forEach(s => {
      console.log(`- ID: ${s.id} | Roll: ${s.rollNumber} | LC: ${s.leetcodeUsername} | HR: ${s.hackerrankUsername}`);
    });
  }

  const invalidLeetCode = students.filter(s => 
    s.leetcodeUsername && (s.leetcodeUsername.length < 3 || s.leetcodeUsername.includes(' '))
  );
  console.log(`\nFound ${invalidLeetCode.length} students with suspicious LeetCode usernames (short or contains space).`);
  
  const invalidHackerRank = students.filter(s => 
    s.hackerrankUsername && (s.hackerrankUsername.length < 3 || s.hackerrankUsername.includes(' '))
  );
  console.log(`Found ${invalidHackerRank.length} students with suspicious HackerRank usernames.`);
}

findCorruptedData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
