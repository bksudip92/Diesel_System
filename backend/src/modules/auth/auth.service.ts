import bcrypt from 'bcryptjs';
import type { Env } from '../../config/env.js';
import { UnauthorizedError } from '../../utils/appError.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  type TokenPair,
} from './tokens.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  place: string;
  name: string | null;
}

export interface LoginResult extends TokenPair {
  user: AuthenticatedUser;
  refreshTokenExpiresAt: Date;
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly env: Env,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, place: true, name: true, password_hash: true },
    });

    // Constant-ish time: always run a bcrypt compare to blunt timing probes.
    const hash = user?.password_hash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    const passwordMatches = await bcrypt.compare(password, hash);

    if (!user || !user.password_hash || !passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.issueTokens(user);
  }

  /**
   * Rotates a refresh token: validates the presented token, revokes it and
   * issues a fresh pair. Reuse of an already-revoked token revokes the whole
   * family for that user (refresh-token rotation best practice).
   */
  async refresh(refreshToken: string): Promise<LoginResult> {
    const tokenHash = hashRefreshToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: {
        user: {
          select: { id: true, email: true, place: true, name: true, password_hash: true },
        },
      },
    });

    if (!stored) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (stored.revoked_at) {
      // Token reuse detected — revoke all active tokens for this user.
      await this.prisma.refreshToken.updateMany({
        where: { user_id: stored.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (stored.expires_at < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked_at: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  private async issueTokens(user: AuthenticatedUser & { password_hash?: string | null }): Promise<LoginResult> {
    const accessToken = await signAccessToken(this.env, {
      sub: user.id,
      email: user.email,
      place: user.place,
    });

    const { token: refreshToken, tokenHash } = generateRefreshToken();
    const refreshTokenExpiresAt = new Date(Date.now() + this.env.JWT_REFRESH_TTL_SECONDS * 1000);

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      user: { id: user.id, email: user.email, place: user.place, name: user.name },
    };
  }
}
