import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { Conflict, Unauthorized } from '../../utils/AppError';
import type { RegisterInput, LoginInput } from './auth.schema';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Hash a refresh token before storing in the DB.
 * If the DB is compromised, attackers can't use the stored hash to authenticate.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compute when a refresh token expires, to store in DB for cleanup.
 * Must match the JWT_REFRESH_EXPIRES_IN env var.
 */
function getRefreshExpiry(): Date {
  // Simple parser for "7d" / "24h" / "60m" format
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new Error(`Invalid JWT_REFRESH_EXPIRES_IN: ${env.JWT_REFRESH_EXPIRES_IN}`);
  }
  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr!, 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + amount * multipliers[unit!]!);
}

/**
 * Issue a new access + refresh token pair, storing the refresh token hash in DB.
 */
async function issueTokens(userId: string, email: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken(userId, email);
  const refreshToken = signRefreshToken(userId, jti);

  await prisma.refreshToken.create({
    data: {
      id: jti,
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: getRefreshExpiry(),
    },
  });

  return { accessToken, refreshToken };
}

export const authService = {
  /**
   * Register a new user, hash their password, and issue tokens.
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw Conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });

    const tokens = await issueTokens(user.id, user.email);

    return { ...tokens, user };
  },

  /**
   * Verify credentials and issue tokens.
   * Uses constant-time comparison (bcrypt.compare) to prevent timing attacks.
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Always run bcrypt even if user doesn't exist, to prevent timing attacks.
    const dummyHash = '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvaliddd';
    const passwordHash = user?.passwordHash ?? dummyHash;
    const valid = await bcrypt.compare(input.password, passwordHash);

    if (!user || !valid) {
      throw Unauthorized('Invalid email or password');
    }

    const tokens = await issueTokens(user.id, user.email);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name },
    };
  },

  /**
   * Rotate refresh token — revoke the old one, issue a fresh pair.
   * This is a security-critical flow:
   *   1. Verify the JWT signature and expiry
   *   2. Look up the token in the DB by its jti
   *   3. Reject if not found, already revoked, or hash mismatch
   *   4. Revoke the old token and issue a new pair
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!stored || stored.tokenHash !== tokenHash) {
      throw Unauthorized('Invalid refresh token');
    }
    if (stored.revokedAt) {
      // Token reuse detected — revoke ALL tokens for this user as a precaution.
      // This prevents an attacker who stole a token from keeping access.
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw Unauthorized('Refresh token reuse detected — all sessions revoked');
    }
    if (stored.expiresAt < new Date()) {
      throw Unauthorized('Refresh token expired');
    }

    // Revoke the old token
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    // Issue new pair
    const tokens = await issueTokens(stored.user.id, stored.user.email);

    return { ...tokens, user: stored.user };
  },

  /**
   * Revoke a refresh token (logout).
   * Idempotent — safe to call with an already-revoked or missing token.
   */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore — logout should always succeed from the client's perspective.
    }
  },
};
