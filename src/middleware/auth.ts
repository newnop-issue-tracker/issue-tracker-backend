import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { Unauthorized } from '../utils/AppError';

/**
 * Extracts JWT from the Authorization header and attaches user info to req.user.
 * Throws 401 if no token, expired token, or malformed token.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Unauthorized('Missing or malformed Authorization header');
  }

  const token = authHeader.substring(7); // strip "Bearer "
  const payload = verifyAccessToken(token); // throws AppError on invalid

  req.user = {
    id: payload.sub,
    email: payload.email,
  };

  next();
}
