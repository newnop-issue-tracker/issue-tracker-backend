import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { env, isProduction } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import issuesRoutes from './modules/issues/issues.routes';

// Make sure the Express.Request.user augmentation is picked up
import './types/express';

/**
 * Build and configure the Express app.
 *
 * Middleware order matters:
 *   1. Security headers (helmet)
 *   2. CORS (must be before routes)
 *   3. Body parsers
 *   4. Logging
 *   5. Rate limiting
 *   6. Routes
 *   7. 404 handler
 *   8. Error handler (MUST be last)
 */
export function createApp(): Express {
  const app = express();

  // Trust the proxy so req.ip returns the real client IP behind AWS ALB / App Runner.
  // Required for rate limiting to work correctly in production.
  app.set('trust proxy', 1);

  // 1. Security headers
  app.use(helmet());

  // 2. CORS — whitelist specific origins, allow credentials (for refresh cookie)
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );

  // 3. Body parsing + cookies + compression
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(compression());

  // 4. Request logging — dev format in dev, combined in prod.
  // Skip health check noise.
  app.use(
    morgan(isProduction ? 'combined' : 'dev', {
      skip: (req) => req.path === '/health',
    }),
  );

  // 5. Global rate limiting — applied to all routes below
  app.use(globalLimiter);

  // 6. Health check — unauthenticated, used by load balancers
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 7. API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/issues', issuesRoutes);

  // 8. 404 for unknown routes
  app.use(notFoundHandler);

  // 9. Error handler — always last
  app.use(errorHandler);

  return app;
}
