import { PrismaClient } from '@prisma/client';
import { verifyHackerrankUsername } from '../services/hackerrankScraper.js';

const prisma = new PrismaClient();

async function checkPlainRolls() {
  const unsynced = await prisma.student.findMany({
    where: { snapshots: { none: {} } },
    take: 10
  });

  console.log(`Checking ${unsynced.length} unsynced students with plain roll numbers...`);

  for (const student of unsynced) {
    const plainRoll = student.rollNumber;
    const isValid = await verifyHackerrankUsername(plainRoll);
    console.log(`- ${student.name} | Roll: ${plainRoll} | Valid on HR? ${isValid}`);
  }
}

checkPlainRolls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
