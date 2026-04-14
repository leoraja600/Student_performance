import { syncAllStudents } from './services/dataSync.js';
import { logger } from './utils/logger.js';
import prisma from './utils/prisma.js';

async function main() {
  logger.info('🚀 Starting manual full sync for all students...');
  try {
    const results = await syncAllStudents();
    logger.info(`✅ Sync complete: ${JSON.stringify(results)}`);
  } catch (error) {
    logger.error(`❌ Sync failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
