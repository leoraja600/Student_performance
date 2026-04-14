import cron from 'node-cron';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { syncAllStudents } from '../services/dataSync.js';

let cronJob = null;
let isRunning = false;

export function startCronJob() {
  if (!config.cron.enabled) {
    logger.info('[Cron] Scheduled sync is DISABLED via CRON_ENABLED env var');
    return;
  }

  if (!cron.validate(config.cron.schedule)) {
    logger.error(`[Cron] Invalid cron schedule: "${config.cron.schedule}"`);
    return;
  }

  cronJob = cron.schedule(config.cron.schedule, async () => {
    if (isRunning) {
      logger.warn('[Cron] Previous sync still running. Skipping this cycle.');
      return;
    }

    isRunning = true;
    logger.info('[Cron] Starting scheduled data sync...');

    try {
      const results = await syncAllStudents();
      logger.info(`[Cron] Scheduled sync complete: ${JSON.stringify(results)}`);
    } catch (error) {
      logger.error(`[Cron] Scheduled sync failed: ${error.message}`);
    } finally {
      isRunning = false;
    }
  });

  logger.info(`[Cron] Scheduled sync started. Schedule: "${config.cron.schedule}"`);
}

export function stopCronJob() {
  if (cronJob) {
    cronJob.stop();
    logger.info('[Cron] Scheduled sync stopped.');
  }
}

export function getCronStatus() {
  return {
    enabled: config.cron.enabled,
    schedule: config.cron.schedule,
    running: isRunning,
    active: cronJob !== null,
  };
}
