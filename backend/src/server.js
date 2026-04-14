import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import prisma from './utils/prisma.js';
import { startCronJob } from './jobs/syncJob.js';

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
  logger.error('Uncaught Exception:', error);
});

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Start the HTTP server
    console.log('Attempting to start app.listen on port:', config.port);
    if (!app || typeof app.listen !== 'function') {
      console.log('ERROR: app is not valid express instance:', app);
      process.exit(1);
    }
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
      logger.info(`📖 API Docs: http://localhost:${config.port}/api/docs`);
    });

    // Start the cron job
    // startCronJob();

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Server closed.');
        process.exit(0);
      });
    };

    // process.on('SIGTERM', () => shutdown('SIGTERM'));
    // process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
