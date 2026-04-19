import type { Request, Response } from 'express';
import { issuesService } from './issues.service';
import { Unauthorized } from '../../utils/AppError';
import type { ListIssuesQuery } from './issues.schema';

/**
 * Controller layer — translates HTTP to/from service calls.
 * Keeps all HTTP concerns (status codes, query parsing, response shape) in one place.
 */
export const issuesController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await issuesService.list(
      req.query as unknown as ListIssuesQuery,
      req.user?.id,
    );
    res.status(200).json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const issue = await issuesService.getById(req.params.id!);
    res.status(200).json({ data: issue });
  },

  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) throw Unauthorized();
    const issue = await issuesService.create(req.user.id, req.body);
    res.status(201).json({ data: issue });
  },

  async update(req: Request, res: Response): Promise<void> {
    if (!req.user) throw Unauthorized();
    const issue = await issuesService.update(req.user.id, req.params.id!, req.body);
    res.status(200).json({ data: issue });
  },

  async delete(req: Request, res: Response): Promise<void> {
    if (!req.user) throw Unauthorized();
    await issuesService.delete(req.user.id, req.params.id!);
    res.status(204).send();
  },

  async stats(req: Request, res: Response): Promise<void> {
    if (!req.user) throw Unauthorized();
    // ?mine=true → only the caller's issues, otherwise all
    const mineOnly = req.query.mine === 'true';
    const stats = await issuesService.getStats(req.user.id, mineOnly);
    res.status(200).json({ data: stats });
  },
};
