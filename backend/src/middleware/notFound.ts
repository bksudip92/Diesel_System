import type { RequestHandler } from 'express';

export function notFound(): RequestHandler {
  return (_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  };
}
