import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers so rejections are forwarded to Express error middleware.
 *
 * Without this, an unhandled promise rejection in a route handler crashes
 * the process instead of returning a 500 to the client.
 *
 * Usage:
 *   router.get('/users/:id', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler =
  <T extends RequestHandler>(fn: T): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
