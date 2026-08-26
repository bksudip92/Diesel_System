import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { NotFoundError } from '../../utils/appError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export function usersRouter(env: Env, prisma: PrismaClient): Router {
  const router = Router();

  router.use(authenticate(env));

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.sub },
        select: { id: true, email: true, place: true, name: true },
      });
      if (!user) throw new NotFoundError('User');
      res.json(user);
    }),
  );

  return router;
}
