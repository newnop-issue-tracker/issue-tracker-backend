import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Unauthorized } from './AppError';

export interface AccessTokenPayload {
  sub: string; // user ID
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string; // unique token ID, used for revocation
}

/**
 * Sign a short-lived access token. Sent in the response body, stored in memory on the client.
 */
export function signAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = { sub: userId, email, type: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Sign a long-lived refresh token. Set as httpOnly cookie on the client.
 * The `jti` allows us to revoke specific tokens in the database.
 */
export function signRefreshToken(userId: string, jti: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: 'refresh', jti };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw Unauthorized('Invalid token type');
    }
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw Unauthorized('Access token expired');
    }
    throw Unauthorized('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw Unauthorized('Invalid token type');
    }
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw Unauthorized('Refresh token expired');
    }
    throw Unauthorized('Invalid refresh token');
  }
}
