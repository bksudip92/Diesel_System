import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'node:crypto';
import type { Env } from '../../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  place: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ALG = 'HS256';

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  env: Env,
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, place: payload.place })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.JWT_ACCESS_TTL_SECONDS}s`)
    .sign(secretKey(env.JWT_SECRET));
}

export async function verifyAccessToken(
  env: Env,
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(env.JWT_SECRET), {
      algorithms: [ALG],
    });
    if (!payload.sub || typeof payload.email !== 'string' || typeof payload.place !== 'string') {
      return null;
    }
    return { sub: payload.sub, email: payload.email, place: payload.place };
  } catch {
    return null;
  }
}

/**
 * Generates a cryptographically random refresh token and its SHA-256 hash.
 * Only the hash is persisted; the raw token is shown to the client exactly once.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString('base64url');
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
