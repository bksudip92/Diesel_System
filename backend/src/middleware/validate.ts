import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

declare module 'express-serve-static-core' {
  interface Request {
    validatedQuery?: unknown;
    validatedParams?: unknown;
  }
}

function parseOrNext(value: unknown, schema: ZodType, next: NextFunction): unknown {
  const result = schema.safeParse(value);
  if (!result.success) {
    next(result.error);
    return;
  }
  return result.data;
}

export function validateBody(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = parseOrNext(req.body, schema, next);
    if (parsed !== undefined) {
      // Express 5 makes body writable; replacing it gives handlers clean,
      // stripped/coerced values.
      (req as { body: unknown }).body = parsed;
      next();
    }
  };
}

export function validateQuery(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.validatedQuery = parseOrNext(req.query, schema, next);
    if (req.validatedQuery !== undefined) next();
  };
}

export function validateParams(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.validatedParams = parseOrNext(req.params, schema, next);
    if (req.validatedParams !== undefined) next();
  };
}
