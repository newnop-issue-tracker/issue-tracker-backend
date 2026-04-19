import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth';
import { prisma } from '../../config/prisma';
import type { Request, Response } from 'express';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  res.json({ data: users });
}));

export default router;
