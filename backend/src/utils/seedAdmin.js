import dotenv from 'dotenv';
dotenv.config();

import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

async function seedAdmin() {
  try {
    logger.info('Starting admin seed...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: config.admin.email },
    });

    if (existingAdmin) {
      logger.info(`Admin user already exists: ${config.admin.email}`);
      await prisma.$disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(config.admin.password, 12);

    const admin = await prisma.user.create({
      data: {
        email: config.admin.email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    logger.info(`Admin user created successfully!`);
    logger.info(`Email: ${admin.email}`);
    logger.info(`Role: ${admin.role}`);
    logger.info('Use the configured ADMIN_PASSWORD to log in.');

    await prisma.$disconnect();
  } catch (error) {
    logger.error('Failed to seed admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedAdmin();
