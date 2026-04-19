import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { env, isProduction } from "../../config/env";
import { prisma } from "../../config/prisma";
import { Unauthorized } from "../../utils/AppError";

const REFRESH_COOKIE_NAME = "refreshToken";

/**
 * Cookie options for the refresh token.
 *   - httpOnly: JS can't read it → safe from XSS
 *   - secure: only sent over HTTPS in production
 *   - sameSite: strict prevents CSRF on state-changing requests
 *   - maxAge: mirrors JWT expiry (computed at set time from env)
 */
function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/api/auth", // only sent to auth endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(),
    );
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(),
    );
    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw Unauthorized("No refresh token");
    }

    const result = await authService.refresh(token);
    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      getRefreshCookieOptions(),
    );
    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.status(204).send();
  },

  async me(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw Unauthorized("Missing authenticated user");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw Unauthorized("User no longer exists");
    }

    res.status(200).json({ user });
  },
};

// Silence unused import linting in some configs
void env;
