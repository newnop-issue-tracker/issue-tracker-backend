import { Router } from 'express';
import { issuesController } from './issues.controller';
import {
  createIssueSchema,
  updateIssueSchema,
  listIssuesQuerySchema,
  issueIdParamSchema,
} from './issues.schema';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// All issue routes require authentication.
router.use(authMiddleware);

/**
 * GET /api/issues/stats — status counts (?mine=true for just my issues)
 * Declared BEFORE /:id so it's not matched as a UUID.
 */
router.get('/stats', asyncHandler(issuesController.stats));

/**
 * GET /api/issues — paginated list with search/filter/sort
 */
router.get(
  '/',
  validate(listIssuesQuerySchema, 'query'),
  asyncHandler(issuesController.list),
);

/**
 * POST /api/issues — create a new issue
 */
router.post(
  '/',
  validate(createIssueSchema),
  asyncHandler(issuesController.create),
);

/**
 * GET /api/issues/:id — detail view
 */
router.get(
  '/:id',
  validate(issueIdParamSchema, 'params'),
  asyncHandler(issuesController.getById),
);

/**
 * PATCH /api/issues/:id — partial update
 */
router.patch(
  '/:id',
  validate(issueIdParamSchema, 'params'),
  validate(updateIssueSchema),
  asyncHandler(issuesController.update),
);

/**
 * DELETE /api/issues/:id
 */
router.delete(
  '/:id',
  validate(issueIdParamSchema, 'params'),
  asyncHandler(issuesController.delete),
);

export default router;
