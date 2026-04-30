import fs from 'fs';
import path from 'path';
import prisma from './prisma.js';
import { logger } from './logger.js';

async function patchHackerRank(csvPath) {
  try {
    if (!fs.existsSync(csvPath)) {
      logger.error(`File not found: ${csvPath}`);
      return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const studentsData = lines.slice(1);

    logger.info(`Patching HackerRank usernames for ${studentsData.length} students...`);

    let updatedCount = 0;
    let missingCount = 0;

    for (const line of studentsData) {
      const values = line.split(',').map(v => v.trim());
      if (values.length < 8) continue; // Expecting at least up to HR link column

      const rollNumber = values[2].toLowerCase();
      const hrLink = values[7] || ''; // Row index 7

      if (!hrLink.includes('hackerrank.com')) continue;

      const hrMatch = hrLink.match(/hackerrank\.com\/(?:profile\/)?([^/?#]+)/);
      if (hrMatch) {
        const username = hrMatch[1].trim().replace(/\/$/, "");
        
        const existing = await prisma.student.findUnique({
          where: { rollNumber }
        });

        if (existing) {
          await prisma.student.update({
            where: { id: existing.id },
            data: { hackerrankUsername: username }
          });
          updatedCount++;
        } else {
          missingCount++;
        }
      }
    }

    logger.info(`Patch complete! Updated: ${updatedCount}, Not found in DB: ${missingCount}`);
  } catch (error) {
    logger.error('Patch process failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const csvFile = process.argv[2];
if (!csvFile) {
  console.log('Usage: node src/utils/patch_hackerrank.js <path_to_csv>');
} else {
  patchHackerRank(path.resolve(process.cwd(), csvFile));
}
