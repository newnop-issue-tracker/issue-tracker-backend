import { z } from 'zod';

// Match the Prisma enums
export const StatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const SeverityEnum = z.enum(['TRIVIAL', 'MINOR', 'MAJOR', 'CRITICAL']);

/**
 * Create issue — title and description required, other fields default on the server.
 */
export const createIssueSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(10_000)
    .trim(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  severity: SeverityEnum.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

/**
 * Update issue — all fields optional (partial update).
 */
export const updateIssueSchema = z
  .object({
    title: z.string().min(3).max(200).trim().optional(),
    description: z.string().min(10).max(10_000).trim().optional(),
    status: StatusEnum.optional(),
    priority: PriorityEnum.optional(),
    severity: SeverityEnum.optional(),
    assigneeId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * List query params — pagination, search, filters, sorting.
 * Note: z.coerce.* is important for query strings (all values come in as strings).
 */
export const listIssuesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  severity: SeverityEnum.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  assignedToMe: z.coerce.boolean().optional(),
});

/**
 * URL param — :id must be a UUID.
 */
export const issueIdParamSchema = z.object({
  id: z.string().uuid('Invalid issue ID'),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type ListIssuesQuery = z.infer<typeof listIssuesQuerySchema>;
