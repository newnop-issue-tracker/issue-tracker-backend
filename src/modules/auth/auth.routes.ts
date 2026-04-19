import { Router } from 'express';
import { authController } from './auth.controller';
import { registerSchema, loginSchema } from './auth.schema';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

/**
 * POST /api/auth/register — create account, issue tokens
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);

/**
 * POST /api/auth/login — verify credentials, issue tokens
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);

/**
 * POST /api/auth/refresh — rotate refresh token, issue new access token
 * Reads refresh token from httpOnly cookie.
 */
router.post('/refresh', asyncHandler(authController.refresh));

/**
 * POST /api/auth/logout — revoke current refresh token, clear cookie
 */
router.post('/logout', asyncHandler(authController.logout));

/**
 * GET /api/auth/me — get current user info (requires valid access token)
 */
router.get('/me', authMiddleware, asyncHandler(authController.me));

export default router;
