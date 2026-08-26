import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { getPrisma } from './db/prisma.js';

const env = loadEnv();
const prisma = getPrisma(env.DATABASE_URL);
const app = createApp(env, { prisma });

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch((err) => logger.error({ err }, 'Error disconnecting Prisma'))
      .finally(() => {
        logger.info('Server closed');
        process.exit(0);
      });
  });
  const forcedExit = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
  forcedExit.unref?.();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — exiting');
  process.exit(1);
});
