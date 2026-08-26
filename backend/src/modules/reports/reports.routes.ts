import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ReportsService } from './reports.service.js';
import {
  monthNameParamSchema,
  refreshMonthlyReportSchema,
} from './reports.schema.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

export function reportsRouter(env: Env, prisma: PrismaClient): Router {
  const router = Router();
  const service = new ReportsService(prisma);

  router.use(authenticate(env));

  router.get(
    '/monthly',
    asyncHandler(async (_req, res) => {
      res.json(await service.monthlyReports());
    }),
  );

  router.get(
    '/monthly/:monthName',
    validateParams(monthNameParamSchema),
    asyncHandler(async (req, res) => {
      const params = req.validatedParams as { monthName: string };
      res.json(await service.monthlyReportByName(params.monthName));
    }),
  );

  router.post(
    '/monthly/refresh',
    validateBody(refreshMonthlyReportSchema),
    asyncHandler(async (req, res) => {
      const report = await service.refreshMonthlyReport(req.body);
      res.status(200).json(report);
    }),
  );

  router.get(
    '/yearly',
    asyncHandler(async (_req, res) => {
      res.json(await service.yearlyReports());
    }),
  );

  return router;
}
