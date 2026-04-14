import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './prisma.js';
import bcrypt from 'bcryptjs';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importOnlyLeet(csvPath) {
  try {
    if (!fs.existsSync(csvPath)) {
      logger.error(`File not found: ${csvPath}`);
      return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const studentsData = lines.slice(1);

    logger.info(`Starting clean import of ${studentsData.length} records...`);

    let successCount = 0;
    let existingCount = 0;
    let errorCount = 0;

    // Track processed roll numbers in this run to avoid internal duplicates
    const seenRolls = new Set();

    for (const [index, line] of studentsData.entries()) {
      const values = line.split(',').map(v => v.trim());
      if (values.length < 7) continue;

      const name = values[1].replace(/["']/g, '');
      let rollNumber = values[2].trim().toUpperCase();
      const mailIdCol = values[4].trim().toLowerCase();
      const leetcodeLink = values[6];

      // Excel scientfic notation fix
      if (rollNumber.includes('E+') && mailIdCol.includes('@')) {
         const extracted = mailIdCol.split('@')[0];
         if (extracted.match(/^\d+[A-Z]?\d+$/i)) {
            rollNumber = extracted.toUpperCase();
         }
      }

      if (!rollNumber || !name || rollNumber === 'ROLL NO' || rollNumber.length < 5) {
        continue;
      }

      if (seenRolls.has(rollNumber)) {
         logger.warn(`Duplicate roll number in CSV: ${rollNumber}. Skipping line ${index+2}`);
         continue;
      }
      seenRolls.add(rollNumber);

      const collegeEmail = `${rollNumber.toLowerCase()}@kce.ac.in`;
      const password = rollNumber;

      let leetcodeUsername = null;
      if (leetcodeLink && leetcodeLink.includes('leetcode.com')) {
        const lcMatch = leetcodeLink.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/);
        if (lcMatch) {
          leetcodeUsername = lcMatch[1].trim();
        }
      }
      
      if (!leetcodeUsername) leetcodeUsername = `lc_${rollNumber.toLowerCase()}`;
      
      // Ensure leetcodeUsername doesn't end with a slash
      leetcodeUsername = leetcodeUsername.replace(/\/$/, "");

      let hackerrankUsername = `hr_${rollNumber.toLowerCase()}`;

      try {
        // Unlikely to exist after cleanup but for safety:
        const existing = await prisma.student.findFirst({
           where: { OR: [{ rollNumber }, { email: collegeEmail }] }
        });

        if (existing) {
          existingCount++;
          continue;
        }

        // Logic to guarantee uniqueness for usernames
        let finalLC = leetcodeUsername;
        let lcExists = await prisma.student.findUnique({ where: { leetcodeUsername: finalLC } });
        while (lcExists) {
            finalLC = `${leetcodeUsername}_${Math.floor(Math.random() * 9999)}`;
            lcExists = await prisma.student.findUnique({ where: { leetcodeUsername: finalLC } });
        }

        let finalHR = hackerrankUsername;
        let hrExists = await prisma.student.findUnique({ where: { hackerrankUsername: finalHR } });
        while (hrExists) {
            finalHR = `${hackerrankUsername}_${Math.floor(Math.random() * 9999)}`;
            hrExists = await prisma.student.findUnique({ where: { hackerrankUsername: finalHR } });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              rollNumber,
              name,
              email: collegeEmail,
              leetcodeUsername: finalLC,
              hackerrankUsername: finalHR,
              weeklyGoal: 10
            },
          });

          await tx.user.create({
            data: {
              email: collegeEmail,
              password: hashedPassword,
              role: 'STUDENT',
              studentId: student.id,
            },
          });
        });

        successCount++;
        if (successCount % 50 === 0) process.stdout.write(`|${successCount}`);
      } catch (err) {
        logger.error(`Failed to import student at line ${index+2} (${rollNumber}): ${err.message}`);
        errorCount++;
      }
    }

    console.log('\nDone.');
    logger.info(`Summary: Imported: ${successCount}, Duplicates: ${existingCount}, Errors: ${errorCount}`);
    await prisma.$disconnect();
  } catch (error) {
    logger.error('Import script crashed:', error);
    await prisma.$disconnect();
  }
}

const csvFile = process.argv[2] || 'C:\\Users\\leora\\Downloads\\st_project - Copy\\onlyleet.csv';
importOnlyLeet(path.resolve(__dirname, csvFile));
