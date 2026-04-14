import dotenv from 'dotenv';
dotenv.config();

import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

async function seedUsers() {
  try {
    logger.info('Starting user seed (Admin & Faculty)...');

    // 1. Seed Admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: config.admin.email },
    });

    if (!existingAdmin) {
      const adminPass = await bcrypt.hash(config.admin.password || 'Admin@123', 12);
      await prisma.user.create({
        data: {
          email: config.admin.email,
          password: adminPass,
          role: 'ADMIN',
        },
      });
      logger.info(`Admin user created: ${config.admin.email}`);
    } else {
      logger.info(`Admin user already exists.`);
    }

    // 2. Seed Faculty
    const facultyEmail = 'faculty@college.edu';
    const existingFaculty = await prisma.user.findUnique({
      where: { email: facultyEmail },
    });

    if (!existingFaculty) {
      const facultyPass = await bcrypt.hash('Faculty@123', 12);
      await prisma.user.create({
        data: {
          email: facultyEmail,
          password: facultyPass,
          role: 'FACULTY',
        },
      });
      logger.info(`Faculty user created: ${facultyEmail} (Password: Faculty@123)`);
    } else {
      logger.info('Faculty user already exists.');
    }

    logger.info('Seed complete!');
    await prisma.$disconnect();
  } catch (error) {
    logger.error('Failed to seed users:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedUsers();
