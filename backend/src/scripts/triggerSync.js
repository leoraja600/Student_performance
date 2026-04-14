import { syncAllStudents } from '../services/dataSync.js';
import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

async function trigger() {
  try {
    logger.info('Manually triggering platform synchronization for all imported students...');
    const results = await syncAllStudents();
    console.log('Sync Results:', results);
  } catch (error) {
    logger.error('Manual sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

trigger();
