import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { BadRequest } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

/**
 * Validates `req[source]` against a Zod schema.
 * Replaces `req[source]` with the parsed (coerced, stripped) value on success.
 * Throws a structured 400 on failure.
 */
export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Replace original with parsed (so downstream gets coerced types)
      (req as Request & Record<Source, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        throw BadRequest('Validation failed', details);
      }
      throw err;
    }
  };
