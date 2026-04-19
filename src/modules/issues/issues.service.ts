import { issuesRepository } from './issues.repository';
import { Forbidden, NotFound } from '../../utils/AppError';
import type {
  CreateIssueInput,
  UpdateIssueInput,
  ListIssuesQuery,
} from './issues.schema';

/**
 * Service layer — business logic for issues.
 *
 * Authorization happens here, not in the controller, because:
 *   - It's part of "what the app allows", not "how HTTP works"
 *   - Easier to unit-test without mocking Express
 *   - Reusable if we add GraphQL or an internal caller later
 */
export const issuesService = {
  async list(query: ListIssuesQuery) {
    const { items, total } = await issuesRepository.findMany(query);
    return {
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string) {
    const issue = await issuesRepository.findById(id);
    if (!issue) throw NotFound('Issue');
    return issue;
  },

  async create(userId: string, input: CreateIssueInput) {
    return issuesRepository.create(userId, input);
  },

  /**
   * Update — only the author may update their own issue.
   * Returns the fresh record.
   */
  async update(userId: string, id: string, input: UpdateIssueInput) {
    const existing = await issuesRepository.findById(id);
    if (!existing) throw NotFound('Issue');
    if (existing.authorId !== userId) {
      throw Forbidden('You can only update your own issues');
    }
    return issuesRepository.update(id, input);
  },

  /**
   * Delete — only the author may delete.
   */
  async delete(userId: string, id: string): Promise<void> {
    const existing = await issuesRepository.findById(id);
    if (!existing) throw NotFound('Issue');
    if (existing.authorId !== userId) {
      throw Forbidden('You can only delete your own issues');
    }
    await issuesRepository.delete(id);
  },

  /**
   * Status counts for the dashboard.
   * `mineOnly` filters to the current user's issues.
   */
  async getStats(userId: string, mineOnly: boolean) {
    const counts = await issuesRepository.countByStatus(mineOnly ? userId : undefined);
    return {
      ...counts,
      total: counts.OPEN + counts.IN_PROGRESS + counts.RESOLVED + counts.CLOSED,
    };
  },
};
