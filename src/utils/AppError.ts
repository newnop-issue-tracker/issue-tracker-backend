/**
 * Application error class.
 *
 * All expected errors in the app should be instances of AppError.
 * This lets the error middleware distinguish between:
 *   - expected errors (business rules, validation, auth) → clean 4xx response
 *   - unexpected errors (bugs, infrastructure) → generic 500 response
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code = 'APP_ERROR',
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Pre-built error factories for common cases
export const BadRequest = (message: string, details?: unknown) =>
  new AppError(400, message, 'BAD_REQUEST', details);

export const Unauthorized = (message = 'Unauthorized') =>
  new AppError(401, message, 'UNAUTHORIZED');

export const Forbidden = (message = 'Forbidden') =>
  new AppError(403, message, 'FORBIDDEN');

export const NotFound = (resource = 'Resource') =>
  new AppError(404, `${resource} not found`, 'NOT_FOUND');

export const Conflict = (message: string) =>
  new AppError(409, message, 'CONFLICT');

export const TooManyRequests = (message = 'Too many requests') =>
  new AppError(429, message, 'TOO_MANY_REQUESTS');
