import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { isProduction } from '../config/env';

/**
 * Centralized error handler — last middleware in the chain.
 *
 * Converts any thrown error into a consistent JSON response:
 *   { error: string, code: string, details?: unknown }
 *
 * - AppError → uses its statusCode/code/details
 * - Prisma known errors → mapped to friendly 4xx responses
 * - Anything else → generic 500 (stack logged server-side only)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 1. Our own AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // 2. Prisma unique constraint violation, etc.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      res.status(409).json({
        error: `A record with that ${target} already exists`,
        code: 'DUPLICATE',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  // 3. Anything else — unexpected. Log and return generic error.
  const error = err as Error;
  console.error('[UNHANDLED ERROR]', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { debug: error.message }),
  });
}

/**
 * 404 handler — mounted after all routes to catch unknown paths.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND',
  });
}
