import type { RequestHandler } from 'express';
import { pinoHttp } from 'pino-http';
import type { Logger } from '../config/logger.js';

export function requestLogger(logger: Logger): RequestHandler {
  return pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
    },
  }) as unknown as RequestHandler;
}
