import type { NextFunction, Request, Response } from 'express';
import type { Env } from '../config/env.js';
import { UnauthorizedError } from '../utils/appError.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

export function authenticate(env: Env) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing bearer token');
      }

      const payload = await verifyAccessToken(env, header.slice('Bearer '.length).trim());
      if (!payload) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      req.user = payload;
      next();
    } catch (err) {
      next(err);
    }
  };
}
