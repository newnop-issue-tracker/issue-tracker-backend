import { prisma } from '../../config/prisma';
import type { CreateCommentInput } from './comments.schema';

const authorSelect = { id: true, name: true, email: true };

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  parentId: true,
  author: { select: authorSelect },
};

export const commentsRepository = {
  async findByIssue(issueId: string) {
    return prisma.comment.findMany({
      where: { issueId, parentId: null },
      select: {
        ...commentSelect,
        replies: {
          select: commentSelect,
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findById(commentId: string) {
    return prisma.comment.findUnique({ where: { id: commentId } });
  },

  async create(authorId: string, issueId: string, data: CreateCommentInput) {
    return prisma.comment.create({
      data: { body: data.body, parentId: data.parentId ?? null, authorId, issueId },
      select: {
        ...commentSelect,
        replies: { select: commentSelect },
      },
    });
  },

  async delete(commentId: string) {
    await prisma.comment.delete({ where: { id: commentId } });
  },
};

export type CommentWithAuthor = Awaited<ReturnType<typeof commentsRepository.create>>;
