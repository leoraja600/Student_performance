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
    
    // Header: S.NO,NAME,ROLL NO,ROLL NO,MAIL ID,DEP,LEET CODE LINK,BATCH
    const studentsData = lines.slice(1);

    logger.info(`Found ${studentsData.length} students to import...`);

    let successCount = 0;
    let errorCount = 0;

    for (const line of studentsData) {
      const values = line.split(',').map(v => v.trim());
      if (values.length < 5) continue;

      const name = values[1];
      const rollNumber = values[2];
      const email = values[4] || `${rollNumber.toLowerCase()}@kce.ac.in`;
      const lcLink = values[6] || '';

      if (!rollNumber) continue;

      // Extract username from link
      let leetcodeUsername = null;
      const lcMatch = lcLink.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/);
      
      const blacklist = ['problemset', 'profile', 'explore', 'onboarding', 'accounts', 'confirm-email', 'u', 'account'];
      
      if (lcMatch && !blacklist.includes(lcMatch[1].toLowerCase())) {
        leetcodeUsername = lcMatch[1];
      } else {
        leetcodeUsername = `lc_${rollNumber.toLowerCase()}`;
      }

      // Default HackerRank
      let hackerrankUsername = `hr_${rollNumber.toLowerCase()}`;

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
