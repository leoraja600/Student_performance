import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './prisma.js';
import bcrypt from 'bcryptjs';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Import students from a CSV file
 * Expected CSV format (with header):
 * rollNumber,name,email,leetcodeUsername,hackerrankUsername,password
 * 
 * Usage: node src/utils/import_csv.js <path_to_csv>
 */
async function importStudents(csvPath) {
  try {
    if (!fs.existsSync(csvPath)) {
      logger.error(`File not found: ${csvPath}`);
      return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    // Detect columns from header
    const header = lines[0].split(',').map(h => h.trim().toUpperCase());
    const rollIdx = header.findIndex(h => h.includes('ROLL') || h.includes('REGISTER'));
    const nameIdx = header.findIndex(h => h.includes('NAME'));
    const mailIdx = header.findIndex(h => h.includes('MAIL') || h.includes('EMAIL'));
    const lcIdx = header.findIndex(h => h.includes('LEET CODE') || h.includes('LEETCODE'));
    const hrIdx = header.findIndex(h => h.includes('HACKER RANK') || h.includes('HACKERRANK'));

    logger.info(`Detected mapping: Roll=${rollIdx}, Name=${nameIdx}, Mail=${mailIdx}, LC=${lcIdx}, HR=${hrIdx}`);

    const studentsData = lines.slice(1);
    logger.info(`Found ${studentsData.length} students to import...`);

    let successCount = 0;
    let errorCount = 0;

    for (const line of studentsData) {
      const values = line.split(',').map(v => v.trim());
      if (values.length < 2) continue;

      const rollNumber = rollIdx !== -1 ? values[rollIdx] : '';
      const name = nameIdx !== -1 ? values[nameIdx] : rollNumber;
      const email = mailIdx !== -1 ? values[mailIdx] : `${rollNumber.toLowerCase()}@kce.ac.in`;
      const lcLink = lcIdx !== -1 ? values[lcIdx] : '';
      const hrLink = hrIdx !== -1 ? values[hrIdx] : '';

      if (!rollNumber || rollNumber.toUpperCase() === 'ROLL NO') continue;

      // Extract LeetCode username
      let leetcodeUsername = null;
      const lcMatch = lcLink.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/);
      const blacklist = ['problemset', 'profile', 'explore', 'onboarding', 'accounts', 'confirm-email', 'u', 'account'];
      if (lcMatch && !blacklist.includes(lcMatch[1].toLowerCase())) {
        leetcodeUsername = lcMatch[1];
      } else {
        leetcodeUsername = `lc_${rollNumber.toLowerCase()}`;
      }

      // Extract HackerRank username from link if provided
      let hackerrankUsername = null;
      const hrMatch = hrLink.match(/hackerrank\.com\/(?:profile\/|u\/|profiles\/)?([^/?#\s]+)/i);
      if (hrMatch) {
         hackerrankUsername = hrMatch[1];
      } else {
         hackerrankUsername = `hr_${rollNumber.toLowerCase()}`;
      }

      try {
        const existingStudent = await prisma.student.findUnique({
          where: { rollNumber: rollNumber.toString() }
        });

        if (existingStudent) {
          successCount++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(rollNumber.toString().toLowerCase(), 12);

        await prisma.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              rollNumber: rollNumber.toString().toLowerCase().trim(),
              name: name || rollNumber,
              email: email.toLowerCase(),
              leetcodeUsername,
              hackerrankUsername,
              hackathonCount: 0,
            },
          });

          await tx.user.create({
            data: {
              email: email.toLowerCase(),
              password: hashedPassword,
              role: 'STUDENT',
              studentId: student.id,
            },
          });
        });

        successCount++;
        if (successCount % 50 === 0) logger.info(`Imported ${successCount} students...`);
      } catch (err) {
        logger.error(`Failed to import ${rollNumber}: ${err.message}`);
        errorCount++;
      }
    }

    logger.info(`Import complete! Successful: ${successCount}, Failed: ${errorCount}`);
    await prisma.$disconnect();
  } catch (error) {
    logger.error('Import process failed:', error);
    await prisma.$disconnect();
  }
}

const csvFile = process.argv[2];
if (!csvFile) {
  logger.info('Please provide the path to the CSV file as an argument.');
} else {
  importStudents(path.resolve(process.cwd(), csvFile));
}
