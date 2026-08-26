import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { Env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { vehiclesRouter } from './modules/vehicles/vehicles.routes.js';
import { fuelLogsRouter } from './modules/fuel-logs/fuel-logs.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { openApiSpec } from './docs/openapi.js';
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

  app.use(`${API_PREFIX}/auth`, authRouter(env, deps.prisma));
  app.use(`${API_PREFIX}/users`, usersRouter(env, deps.prisma));
  app.use(`${API_PREFIX}/vehicles`, vehiclesRouter(env, deps.prisma));
  app.use(`${API_PREFIX}/fuel-logs`, fuelLogsRouter(env, deps.prisma));
  app.use(`${API_PREFIX}/reports`, reportsRouter(env, deps.prisma));

  app.use(
    `${API_PREFIX}/docs`,
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  app.use(notFound());
  app.use(errorHandler(logger));

  return app;
}
