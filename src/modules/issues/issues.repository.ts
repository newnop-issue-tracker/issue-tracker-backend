import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type {
  CreateIssueInput,
  UpdateIssueInput,
  ListIssuesQuery,
} from './issues.schema';

/**
 * Repository layer — owns all Prisma calls for issues.
 *
 * Why a separate layer?
 *   - Keeps service layer free of ORM specifics
 *   - Easy to swap ORM or mock for tests
 *   - Single place to tune queries (includes, selects, indexes)
 */

const userSelect = {
  id: true,
  name: true,
  email: true,
};

const issueWithAuthor = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  severity: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author:      { select: userSelect },
  resolvedBy:  { select: userSelect },
  updatedBy:   { select: userSelect },
} satisfies Prisma.IssueSelect;

export const issuesRepository = {
  /**
   * Build Prisma where clause from list filters.
   * Exposed so the service can reuse it for counting.
   */
  buildWhere(
    query: Pick<ListIssuesQuery, 'search' | 'status' | 'priority' | 'severity'>,
  ): Prisma.IssueWhereInput {
    const where: Prisma.IssueWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.severity) where.severity = query.severity;

    if (query.search) {
      // Case-insensitive LIKE on title or description.
      // For larger datasets, consider MySQL FULLTEXT index + MATCH AGAINST.
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    return where;
  },

  async findMany(query: ListIssuesQuery) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    // Run count + findMany in parallel for better perf.
    const [items, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        select: issueWithAuthor,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      prisma.issue.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return prisma.issue.findUnique({
      where: { id },
      select: issueWithAuthor,
    });
  },

  async create(authorId: string, data: CreateIssueInput) {
    return prisma.issue.create({
      data: { ...data, authorId },
      select: issueWithAuthor,
    });
  },

  async update(
    id: string,
    data: UpdateIssueInput,
    meta: { updatedById: string; resolvedById?: string | null },
  ) {
    return prisma.issue.update({
      where: { id },
      data: {
        ...data,
        updatedById: meta.updatedById,
        ...(meta.resolvedById !== undefined ? { resolvedById: meta.resolvedById } : {}),
      },
      select: issueWithAuthor,
    });
  },

  async delete(id: string) {
    await prisma.issue.delete({ where: { id } });
  },

  /**
   * Counts grouped by status — used for dashboard.
   * Single query via groupBy is cheaper than 4 separate counts.
   */
  async countByStatus(authorId?: string) {
    const where: Prisma.IssueWhereInput = authorId ? { authorId } : {};
    const groups = await prisma.issue.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    const result = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
    for (const g of groups) {
      result[g.status] = g._count._all;
    }
    return result;
  },
};

export type IssueWithAuthor = Prisma.IssueGetPayload<{ select: typeof issueWithAuthor }>;
