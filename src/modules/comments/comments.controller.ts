import type { Request, Response } from 'express';
import { commentsService } from './comments.service';

export const commentsController = {
  async list(req: Request, res: Response): Promise<void> {
    const data = await commentsService.list(req.params.id!);
    res.json({ data });
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = await commentsService.create(req.user!.id, req.params.id!, req.body);
    res.status(201).json({ data });
  },

  async delete(req: Request, res: Response): Promise<void> {
    await commentsService.delete(req.user!.id, req.params.id!, req.params.commentId!);
    res.status(204).send();
  },
};
