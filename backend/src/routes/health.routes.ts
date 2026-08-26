import { Router } from 'express';

export interface HealthDeps {
  checkDb: () => Promise<unknown>;
}

export function healthRouter({ checkDb }: HealthDeps): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    let db = 'ok';
    try {
      await checkDb();
    } catch {
      db = 'unavailable';
    }
    const healthy = db === 'ok';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      db,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
