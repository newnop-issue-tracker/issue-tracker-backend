import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000).trim(),
  parentId: z.string().uuid().optional(),
});

export const commentIdParamSchema = z.object({
  id: z.string().uuid('Invalid issue ID'),
  commentId: z.string().uuid('Invalid comment ID'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
