import { Router } from 'express';
import type { z } from 'zod';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { VehiclesService } from './vehicles.service.js';
import {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
  vehicleNumberParamSchema,
} from './vehicles.schema.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export function vehiclesRouter(env: Env, prisma: PrismaClient): Router {
  const router = Router();
  const service = new VehiclesService(prisma);

  router.use(authenticate(env));

  router.get(
    '/',
    validateQuery(listVehiclesQuerySchema),
    asyncHandler(async (req, res) => {
      const query = req.validatedQuery as z.infer<typeof listVehiclesQuerySchema>;
      const data = await service.list(query.place);
      res.json(data);
    }),
  );

  router.get(
    '/:number',
    validateParams(vehicleNumberParamSchema),
    asyncHandler(async (req, res) => {
      const params = req.validatedParams as z.infer<typeof vehicleNumberParamSchema>;
      const data = await service.getByNumber(params.number);
      res.json(data);
    }),
  );

  router.post(
    '/',
    validateBody(createVehicleSchema),
    asyncHandler(async (req, res) => {
      const created = await service.create(req.body);
      res.status(201).json(created);
    }),
  );

  router.patch(
    '/:number',
    validateParams(vehicleNumberParamSchema),
    validateBody(updateVehicleSchema),
    asyncHandler(async (req, res) => {
      const params = req.validatedParams as z.infer<typeof vehicleNumberParamSchema>;
      const updated = await service.updateByNumber(params.number, req.body);
      res.json(updated);
    }),
  );

  return router;
}
