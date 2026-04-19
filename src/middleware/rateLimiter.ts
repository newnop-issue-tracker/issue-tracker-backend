import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Global rate limiter applied to all routes.
 * Defaults: 100 requests per minute per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT',
  },
});

/**
 * Stricter limiter for authentication endpoints to prevent brute force.
 * 5 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT',
  },
});
