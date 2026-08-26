import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';
import type { Logger } from '../config/logger.js';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      } satisfies ErrorResponse);
      return;
    }

    if (err instanceof ZodError) {
      const first = err.issues[0];
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: first
            ? `${first.path.join('.') || 'body'}: ${first.message}`
            : 'Validation failed',
        },
      } satisfies ErrorResponse);
      return;
    }

    logger.error({ err }, 'Unhandled error');
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    } satisfies ErrorResponse);
  };
}
