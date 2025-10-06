import type { SQL } from 'drizzle-orm';
import type { PgColumn, PgSelect } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Pagination input schema for validation
export const PaginationInputSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  page_size: z.coerce.number().min(1).max(5000).optional().default(250),
});

export type PaginationInput = z.infer<typeof PaginationInputSchema>;

export const PaginationSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  total_pages: z.number(),
});

export type PaginationMetadata = z.infer<typeof PaginationSchema>;

// Generic paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export const SearchPaginationSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  has_more: z.boolean(),
});

export type SearchPaginationMetadata = z.infer<typeof SearchPaginationSchema>;

export interface SearchPaginatedResponse<T> {
  data: T[];
  pagination: SearchPaginationMetadata;
}

// Type helper for creating paginated API responses
export type WithPagination<T> = {
  [K in keyof T]: T[K];
} & {
  pagination: PaginationMetadata;
};

/**
 * Adds pagination to a Drizzle query using the dynamic query builder pattern
 *
 * @example
 * ```typescript
 * const query = db.select().from(users).$dynamic();
 * const paginatedQuery = withPagination(query, users.id, 2, 10);
 * const results = await paginatedQuery;
 * ```
 */
export function withPagination<T extends PgSelect>(
  qb: T,
  orderByColumn?: PgColumn | SQL | SQL.Aliased | null,
  page = 1,
  pageSize = 250
) {
  let query = qb;

  // Only apply orderBy if orderByColumn is provided
  if (orderByColumn) {
    query = query.orderBy(orderByColumn);
  }

  return query.limit(pageSize).offset((page - 1) * pageSize);
}

/**
 * Creates pagination metadata from count and pagination parameters
 * Useful when you already have the total count
 *
 * @example
 * ```typescript
 * const metadata = createPaginationMetadata({
 *   total: 100,
 *   page: 2,
 *   page_size: 10
 * });
 * ```
 */
function createPaginationMetadata({
  total,
  page,
  page_size,
}: {
  total: number;
  page: number;
  page_size: number;
}): PaginationMetadata {
  return {
    page,
    page_size,
    total,
    total_pages: Math.ceil(total / page_size),
  };
}

/**
 * Helper function to create a paginated response from existing data and count.
 *
 * Use this when:
 * - You already have both the data and total count from separate queries
 * - You need to transform the data before creating the response
 * - You're working with data that's not directly from a database query
 *
 * For most cases, prefer `withPaginationMeta` which handles the count query automatically.
 *
 * @example
 * ```typescript
 * // Only use when you already have the count or need custom transformation
 * const users = await customUserQuery();
 * const total = await customCountQuery();
 *
 * return createPaginatedResponse({
 *   data: users.map(u => ({ ...u, displayName: u.name })),
 *   page: 1,
 *   page_size: 10,
 *   total
 * });
 * ```
 */
export function createPaginatedResponse<T>({
  data,
  page,
  page_size,
  total,
}: {
  data: T[];
  page: number;
  page_size: number;
  total: number;
}): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMetadata({ total, page, page_size }),
  };
}
