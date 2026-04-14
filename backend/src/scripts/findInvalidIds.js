import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function findInvalid() {
  try {
    console.log('Searching for invalid/failed student profiles...');

    // Find students with no successful snapshots but failed fetch logs
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        snapshots: { none: {} },
        fetchLogs: { some: { status: 'FAILED' } }
      },
      include: {
        fetchLogs: {
          where: { status: 'FAILED' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (students.length === 0) {
      console.log('No invalid students found with failed logs and no snapshots.');
      return;
    }

    console.log(`Found ${students.length} potentially invalid students.`);

    let mdContent = '# Invalid Student Profiles\n\n';
    mdContent += '| Name | Roll No | LeetCode ID | Error Message |\n';
    mdContent += '| :--- | :--- | :--- | :--- |\n';

    for (const student of students) {
      const lastError = student.fetchLogs[0]?.message || 'Unknown error';
      mdContent += `| ${student.name} | ${student.rollNumber} | ${student.leetcodeUsername} | ${lastError} |\n`;
      
      // Deactivate the student to exclude from leaderboard/sync
      await prisma.student.update({
        where: { id: student.id },
        data: { isActive: false }
      });
    }

    const outputPath = path.resolve(__dirname, '../../../invalid.md');
    fs.writeFileSync(outputPath, mdContent);
    
    console.log(`Successfully wrote ${students.length} invalid students to ${outputPath} and deactivated them.`);

  } catch (error) {
    console.error('Task failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findInvalid();
