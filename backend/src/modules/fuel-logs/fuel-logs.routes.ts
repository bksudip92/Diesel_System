import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
  validateBody,
  validateQuery,
} from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { FuelLogsService } from './fuel-logs.service.js';
import {
  createFuelLogSchema,
  dateRangeQuerySchema,
  lastLogQuerySchema,
  recentLogsQuerySchema,
} from './fuel-logs.schema.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export function fuelLogsRouter(env: Env, prisma: PrismaClient): Router {
  const router = Router();
  const service = new FuelLogsService(prisma);

  router.use(authenticate(env));

  router.get(
    '/recent',
    validateQuery(recentLogsQuerySchema),
    asyncHandler(async (req, res) => {
      const data = await service.recent(
        req.validatedQuery as never,
      );
      res.json(data);
    }),
  );

  router.get(
    '/last',
    validateQuery(lastLogQuerySchema),
    asyncHandler(async (req, res) => {
      const query = req.validatedQuery as { vehicleNumber: string };
      const data = await service.lastForVehicle(query.vehicleNumber);
      if (!data) {
        res.json(null);
        return;
      }
      res.json(data);
    }),
  );

  router.get(
    '/',
    validateQuery(dateRangeQuerySchema),
    asyncHandler(async (req, res) => {
      const data = await service.listByDateRange(req.validatedQuery as never);
      res.json(data);
    }),
  );

  router.post(
    '/',
    validateBody(createFuelLogSchema),
    asyncHandler(async (req, res) => {
      const created = await service.create(req.body);
      res.status(201).json(created);
    }),
  );

  return router;
}
