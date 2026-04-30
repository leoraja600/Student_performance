import fs from 'fs';
import path from 'path';
import prisma from './prisma.js';
import bcrypt from 'bcryptjs';
import { logger } from './logger.js';

async function upsertStudent(roll, name, email, lcUser, hrUser) {
  const finalEmail = email || `${roll.toLowerCase()}@kce.ac.in`;
  const hashedPassword = await bcrypt.hash(roll.toLowerCase(), 12);

  return await prisma.$transaction(async (tx) => {
    // 1. Uniqueness check for LC
    let finalLC = lcUser;
    const existingLC = await tx.student.findFirst({
      where: { leetcodeUsername: finalLC, NOT: { rollNumber: roll.toLowerCase() } }
    });
    if (existingLC) finalLC = `${finalLC}_${Math.floor(Math.random() * 999)}`;

    // 2. Uniqueness check for HR
    let finalHR = hrUser;
    const existingHR = await tx.student.findFirst({
      where: { hackerrankUsername: finalHR, NOT: { rollNumber: roll.toLowerCase() } }
    });
    if (existingHR) finalHR = `${finalHR}_${Math.floor(Math.random() * 999)}`;

    const student = await tx.student.upsert({
      where: { rollNumber: roll.toLowerCase() },
      update: {
        name,
        email: finalEmail.toLowerCase(),
        leetcodeUsername: finalLC,
        hackerrankUsername: finalHR
      },
      create: {
        rollNumber: roll.toLowerCase(),
        name,
        email: finalEmail.toLowerCase(),
        leetcodeUsername: finalLC,
        hackerrankUsername: finalHR,
        hackathonCount: 0
      }
    });

    await tx.user.upsert({
      where: { email: finalEmail.toLowerCase() },
      update: { studentId: student.id },
      create: {
        email: finalEmail.toLowerCase(),
        password: hashedPassword,
        role: 'STUDENT',
        studentId: student.id
      }
    });
    return student;
  });
}

function extractLC(link, roll) {
  if (!link) return `lc_${roll.toLowerCase()}`;
  const match = link.match(/leetcode\.com\/(?:u\/)?([^/?#\s]+)/);
  const blacklist = ['problemset', 'profile', 'explore', 'onboarding', 'accounts', 'confirm-email', 'u', 'account'];
  if (match && !blacklist.includes(match[1].toLowerCase())) {
    return match[1].trim().replace(/\/$/, "");
  }
  return `lc_${roll.toLowerCase()}`;
}

function extractHR(link, roll) {
  if (!link) return `hr_${roll.toLowerCase()}`;
  const match = link.match(/hackerrank\.com\/(?:profile\/|u\/|profiles\/)?([^/?#\s]+)/i);
  if (match) {
    return match[1].trim().replace(/\/$/, "");
  }
  return `hr_${roll.toLowerCase()}`;
}

async function jointImport() {
  try {
    const studPath = path.resolve(process.cwd(), '../stud.csv');
    const onlyPath = path.resolve(process.cwd(), '../onlyleet.csv');

    if (!fs.existsSync(studPath) || !fs.existsSync(onlyPath)) {
      logger.error('Data files missing');
      return;
    }

    const mergedData = new Map(); // roll -> { name, email, lcLink, hrLink }

    // 1. Process onlyleet.csv (Master List + LeetCode preference)
    const onlyLines = fs.readFileSync(onlyPath, 'utf8').split(/\r?\n/).filter(l => l.trim()).slice(1);
    for (const line of onlyLines) {
      const v = line.split(',').map(s => s.trim());
      if (v.length < 7) continue;
      
      let roll = v[2].toLowerCase();
      const mail = v[4].toLowerCase();
      const name = v[1];
      const lcLink = v[6];

      if (roll.includes('e+') && mail.includes('@')) {
         const ext = mail.split('@')[0];
         if (ext.match(/^\d+[A-Z]?\d+$/i)) roll = ext.toLowerCase();
      }
      if (roll.length < 5) continue;

      mergedData.set(roll, { name, email: mail, lcLink, hrLink: null });
    }

    // 2. Process stud.csv (HackerRank preference + New students)
    const studLines = fs.readFileSync(studPath, 'utf8').split(/\r?\n/).filter(l => l.trim()).slice(1);
    for (const line of studLines) {
       const v = line.split(',').map(s => s.trim());
       if (v.length < 4) continue;
       const roll = v[0].toLowerCase();
       const name = v[1];
       const lcLink = v[2];
       const hrLink = v[3];

       if (mergedData.has(roll)) {
          const existing = mergedData.get(roll);
          // Update HR link only
          existing.hrLink = hrLink;
       } else {
          // New student from stud.csv
          if (roll.length >= 5) {
             mergedData.set(roll, { name, email: `${roll}@kce.ac.in`, lcLink, hrLink });
          }
       }
    }

    logger.info(`Starting import of ${mergedData.size} merged records...`);
    let count = 0;
    for (const [roll, data] of mergedData.entries()) {
       const lcUser = extractLC(data.lcLink, roll);
       const hrUser = extractHR(data.hrLink, roll);
       
       try {
         await upsertStudent(roll, data.name, data.email, lcUser, hrUser);
         count++;
         if (count % 100 === 0) logger.info(`Processed ${count} students...`);
       } catch (e) {
         logger.error(`Failed ${roll}: ${e.message}`);
       }
    }
    
    logger.info(`Finished! Processed ${count} students.`);
  } catch (err) {
    logger.error('Import failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

jointImport();
