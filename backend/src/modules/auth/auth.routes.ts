import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { loginSchema, logoutSchema, refreshSchema } from './auth.schema.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export function authRouter(env: Env, prisma: PrismaClient): Router {
  const router = Router();
  const controller = new AuthController(new AuthService(prisma, env));

  // Brute-force protection on credential + token exchange endpoints.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' },
    },
  });

  router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(controller.login));
  router.post('/refresh', authLimiter, validateBody(refreshSchema), asyncHandler(controller.refresh));
  router.post(
    '/logout',
    authenticate(env),
    validateBody(logoutSchema),
    asyncHandler(controller.logout),
  );

  return router;
}
