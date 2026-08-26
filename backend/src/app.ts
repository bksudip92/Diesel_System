import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { healthRouter } from './routes/health.routes.js';
import type { PrismaClient } from './generated/prisma/client.js';

export const API_PREFIX = '/api/v1';

export interface AppDeps {
  prisma: PrismaClient;
}

export function createApp(env: Env, deps: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger(logger));

  app.get('/', (_req, res) => {
    res.json({ name: 'diesel-system-backend', status: 'ok' });
  });

  app.use(healthRouter({ checkDb: () => deps.prisma.$queryRaw`SELECT 1` }));

  app.use(notFound());
  app.use(errorHandler(logger));

  return app;
}
