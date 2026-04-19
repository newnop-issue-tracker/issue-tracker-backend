/**
 * Augment Express's Request type to include the authenticated user.
 * Set by authMiddleware after verifying the JWT.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export {};
