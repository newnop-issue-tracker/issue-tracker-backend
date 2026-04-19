import { commentsRepository } from './comments.repository';
import { issuesRepository } from '../issues/issues.repository';
import { Forbidden, NotFound } from '../../utils/AppError';
import type { CreateCommentInput } from './comments.schema';

export const commentsService = {
  async list(issueId: string) {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) throw NotFound('Issue');
    return commentsRepository.findByIssue(issueId);
  },

  async create(userId: string, issueId: string, input: CreateCommentInput) {
    const issue = await issuesRepository.findById(issueId);
    if (!issue) throw NotFound('Issue');

    if (input.parentId) {
      const parent = await commentsRepository.findById(input.parentId);
      if (!parent || parent.issueId !== issueId) throw NotFound('Parent comment');
      if (parent.parentId) throw Forbidden('Replies can only be one level deep');
    }

    return commentsRepository.create(userId, issueId, input);
  },

  async delete(userId: string, issueId: string, commentId: string) {
    const comment = await commentsRepository.findById(commentId);
    if (!comment || comment.issueId !== issueId) throw NotFound('Comment');
    if (comment.authorId !== userId) throw Forbidden('You can only delete your own comments');
    await commentsRepository.delete(commentId);
  },
};
