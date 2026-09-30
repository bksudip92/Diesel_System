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
  return (err, req, res, _next) => {
    if (err instanceof AppError) {
      // 4xx used to be invisible: the request logger only records the status
      // code, and this handler logged nothing below 500, so a "Vehicle not
      // found" could not be traced back to the request that caused it.
      // Log the code and route so a failed scan is diagnosable from the
      // server log alone. The vehicle number itself stays in the request URL
      // logged by `requestLogger`.
      logger.warn(
        { code: err.code, statusCode: err.statusCode, method: req.method, url: req.originalUrl },
        err.message,
      );
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      } satisfies ErrorResponse);
      return;
    }

    if (err instanceof ZodError) {
      const first = err.issues[0];
      const message = first
        ? `${first.path.join('.') || 'body'}: ${first.message}`
        : 'Validation failed';
      logger.warn(
        { code: 'VALIDATION_ERROR', method: req.method, url: req.originalUrl, issue: first?.path },
        message,
      );
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message,
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
