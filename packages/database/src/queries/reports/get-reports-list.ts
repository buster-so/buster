import { type InferSelectModel, and, count, desc, eq, gte, isNull, like, lte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { reportFiles, users } from '../../schema';
import { getUserOrganizationId } from '../organizations';
import { type PaginatedResponse, createPaginatedResponse } from '../shared-types';
import { withPagination } from '../shared-types/with-pagination';

export const GetReportsListInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  page: z.number().optional().default(1),
  page_size: z.number().optional().default(250),
  name: z.string().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
  updated_after: z.string().optional(),
  updated_before: z.string().optional(),
  deleted_after: z.string().optional(),
  deleted_before: z.string().optional(),
  publicly_accessible: z.boolean().optional(),
});

export type GetReportsListInput = z.infer<typeof GetReportsListInputSchema>;

export type ReportListItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  publicly_accessible: boolean;
  created_by_id: string;
  created_by_name: string | null;
  created_by_avatar: string | null;
};

/**
 * Get paginated list of reports for the user's organization
 * with optional filtering by name, dates, and public accessibility.
 *
 * Security note: When deleted date filters (deleted_after/deleted_before) are provided,
 * this function returns only deleted reports within that date range.
 * Otherwise, it returns only non-deleted reports.
 */
export async function getReportsList(
  input: GetReportsListInput
): Promise<PaginatedResponse<ReportListItem>> {
  // Validate and destructure input
  const {
    userId,
    page,
    page_size,
    name,
    created_after,
    created_before,
    updated_after,
    updated_before,
    deleted_after,
    deleted_before,
    publicly_accessible,
  } = GetReportsListInputSchema.parse(input);

  // Get the user's organization ID
  const userOrg = await getUserOrganizationId(userId);
  if (!userOrg?.organizationId) {
    throw new Error('User not found in any organization');
  }

  const { organizationId } = userOrg;

  // Build dynamic where conditions
  // Check if deleted date filters are provided
  const hasDeletedFilters = deleted_after !== undefined || deleted_before !== undefined;

  const whereConditions = and(
    eq(reportFiles.organizationId, organizationId),
    // Security fix: Always apply proper deletion filtering
    // If deleted date filters are provided, show only deleted reports in that range
    // Otherwise, show only non-deleted reports
    hasDeletedFilters
      ? and(
          // Show only deleted reports within the specified date range
          deleted_after ? gte(reportFiles.deletedAt, deleted_after) : undefined,
          deleted_before ? lte(reportFiles.deletedAt, deleted_before) : undefined
        )
      : // Show only non-deleted reports
        isNull(reportFiles.deletedAt),
    name ? like(reportFiles.name, `%${name}%`) : undefined,
    created_after ? gte(reportFiles.createdAt, created_after) : undefined,
    created_before ? lte(reportFiles.createdAt, created_before) : undefined,
    updated_after ? gte(reportFiles.updatedAt, updated_after) : undefined,
    updated_before ? lte(reportFiles.updatedAt, updated_before) : undefined,
    publicly_accessible !== undefined
      ? eq(reportFiles.publiclyAccessible, publicly_accessible)
      : undefined
  );

  // Create the base query - exclude content field and include user info
  const getData = withPagination(
    db
      .select({
        id: reportFiles.id,
        name: reportFiles.name,
        publicly_accessible: reportFiles.publiclyAccessible,
        created_at: reportFiles.createdAt,
        updated_at: reportFiles.updatedAt,
        // User metadata
        created_by_id: users.id,
        created_by_name: users.name,
        created_by_avatar: users.avatarUrl,
      })
      .from(reportFiles)
      .innerJoin(users, eq(reportFiles.createdBy, users.id))
      .where(whereConditions)
      .$dynamic(),
    desc(reportFiles.createdAt), // Most recent reports first
    page,
    page_size
  );

  // Create count query
  const getTotal = db.select({ count: count() }).from(reportFiles).where(whereConditions);

  try {
    // Execute data and count queries in parallel
    const [data, totalResult] = await Promise.all([getData, getTotal]);

    const total = totalResult[0]?.count ?? 0;

    return createPaginatedResponse({
      data,
      page,
      page_size,
      total,
    });
  } catch (error) {
    console.error('Error fetching reports list:', error);
    throw new Error('Failed to fetch reports list');
  }
}
