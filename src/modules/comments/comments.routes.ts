import { Router } from 'express';
import { commentsController } from './comments.controller';
import { createCommentSchema, commentIdParamSchema } from './comments.schema';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { issueIdParamSchema } from '../issues/issues.schema';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', asyncHandler(commentsController.list));

router.post(
  '/',
  validate(issueIdParamSchema, 'params'),
  validate(createCommentSchema),
  asyncHandler(commentsController.create),
);

router.delete(
  '/:commentId',
  validate(commentIdParamSchema, 'params'),
  asyncHandler(commentsController.delete),
);

export default router;
