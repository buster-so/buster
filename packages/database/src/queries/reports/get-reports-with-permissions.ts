import { type SQL, and, count, desc, eq, exists, isNull, ne, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissions, reportFiles, teamsToUsers, users } from '../../schema';
import { getUserOrganizationId } from '../organizations';
import { type PaginatedResponse, createPaginatedResponse } from '../shared-types';
import { withPagination } from '../shared-types/with-pagination';

export const GetReportsWithPermissionsInputSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  page: z.number().optional().default(1),
  page_size: z.number().optional().default(250),
  sharedWithMe: z.boolean().optional(),
  onlyMyReports: z.boolean().optional(),
});

export type GetReportsWithPermissionsInput = z.infer<typeof GetReportsWithPermissionsInputSchema>;

export type ReportWithPermissionItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  publicly_accessible: boolean;
  created_by_id: string;
  created_by_name: string | null;
  created_by_avatar: string | null;
  workspace_sharing: string;
  is_shared: boolean;
  permission: string | null;
};

/**
 * Get paginated list of reports that the user has access to.
 * This includes:
 * 1. Reports the user created
 * 2. Reports the user has direct permissions for
 * 3. Reports the user has team permissions for
 * 4. Reports shared with the workspace (if workspace sharing is enabled)
 */
export async function getReportsWithPermissions(
  input: GetReportsWithPermissionsInput
): Promise<PaginatedResponse<ReportWithPermissionItem>> {
  const { userId, page, page_size, sharedWithMe, onlyMyReports } =
    GetReportsWithPermissionsInputSchema.parse(input);

  // Get the user's organization ID
  const userOrg = await getUserOrganizationId(userId);
  if (!userOrg?.organizationId) {
    // Return empty result if user has no organization
    return createPaginatedResponse({
      data: [],
      page,
      page_size,
      total: 0,
    });
  }

  const { organizationId } = userOrg;

  // Build the where conditions based on filters
  let whereConditions: SQL<unknown> | undefined;

  if (onlyMyReports) {
    // Only show reports created by the user
    whereConditions = and(
      eq(reportFiles.createdBy, userId),
      isNull(reportFiles.deletedAt),
      eq(reportFiles.organizationId, organizationId)
    );
  } else if (sharedWithMe) {
    // Only show reports shared with the user (not created by them)
    whereConditions = and(
      isNull(reportFiles.deletedAt),
      eq(reportFiles.organizationId, organizationId),
      // Not created by the user
      ne(reportFiles.createdBy, userId),
      // But user has access through permissions or workspace sharing
      or(
        // Direct user permission
        exists(
          db
            .select({ one: assetPermissions.assetId })
            .from(assetPermissions)
            .where(
              and(
                eq(assetPermissions.assetId, reportFiles.id),
                eq(assetPermissions.assetType, 'report_file'),
                eq(assetPermissions.identityType, 'user'),
                eq(assetPermissions.identityId, userId),
                isNull(assetPermissions.deletedAt)
              )
            )
        ),
        // Team permission
        exists(
          db
            .select({ one: assetPermissions.assetId })
            .from(assetPermissions)
            .innerJoin(
              teamsToUsers,
              and(
                eq(teamsToUsers.teamId, assetPermissions.identityId),
                eq(teamsToUsers.userId, userId),
                isNull(teamsToUsers.deletedAt)
              )
            )
            .where(
              and(
                eq(assetPermissions.assetId, reportFiles.id),
                eq(assetPermissions.assetType, 'report_file'),
                eq(assetPermissions.identityType, 'team'),
                isNull(assetPermissions.deletedAt)
              )
            )
        ),
        // Workspace sharing (not 'none')
        ne(reportFiles.workspaceSharing, 'none')
      )
    );
  } else {
    // Show all reports the user has access to
    whereConditions = and(
      isNull(reportFiles.deletedAt),
      eq(reportFiles.organizationId, organizationId),
      or(
        // Created by the user
        eq(reportFiles.createdBy, userId),
        // Direct user permission
        exists(
          db
            .select({ one: assetPermissions.assetId })
            .from(assetPermissions)
            .where(
              and(
                eq(assetPermissions.assetId, reportFiles.id),
                eq(assetPermissions.assetType, 'report_file'),
                eq(assetPermissions.identityType, 'user'),
                eq(assetPermissions.identityId, userId),
                isNull(assetPermissions.deletedAt)
              )
            )
        ),
        // Team permission
        exists(
          db
            .select({ one: assetPermissions.assetId })
            .from(assetPermissions)
            .innerJoin(
              teamsToUsers,
              and(
                eq(teamsToUsers.teamId, assetPermissions.identityId),
                eq(teamsToUsers.userId, userId),
                isNull(teamsToUsers.deletedAt)
              )
            )
            .where(
              and(
                eq(assetPermissions.assetId, reportFiles.id),
                eq(assetPermissions.assetType, 'report_file'),
                eq(assetPermissions.identityType, 'team'),
                isNull(assetPermissions.deletedAt)
              )
            )
        ),
        // Workspace sharing (not 'none')
        ne(reportFiles.workspaceSharing, 'none')
      )
    );
  }

  // Create the query with left join to get user permissions
  const getData = withPagination(
    db
      .select({
        id: reportFiles.id,
        name: reportFiles.name,
        publicly_accessible: reportFiles.publiclyAccessible,
        created_at: reportFiles.createdAt,
        updated_at: reportFiles.updatedAt,
        workspace_sharing: reportFiles.workspaceSharing,
        created_by_id: reportFiles.createdBy,
        created_by_name: users.name,
        created_by_avatar: users.avatarUrl,
        // Get the user's permission for this report
        permission: assetPermissions.role,
      })
      .from(reportFiles)
      .innerJoin(users, eq(reportFiles.createdBy, users.id))
      .leftJoin(
        assetPermissions,
        and(
          eq(assetPermissions.assetId, reportFiles.id),
          eq(assetPermissions.assetType, 'report_file'),
          eq(assetPermissions.identityType, 'user'),
          eq(assetPermissions.identityId, userId),
          isNull(assetPermissions.deletedAt)
        )
      )
      .where(whereConditions)
      .$dynamic(),
    desc(reportFiles.updatedAt), // Most recently updated reports first
    page,
    page_size
  );

  // Create count query
  const getTotal = db.select({ count: count() }).from(reportFiles).where(whereConditions);

  try {
    // Execute data and count queries in parallel
    const [data, totalResult] = await Promise.all([getData, getTotal]);

    const total = totalResult[0]?.count ?? 0;

    // Transform the data to include is_shared flag
    const transformedData = data.map((report) => ({
      ...report,
      is_shared: report.created_by_id !== userId,
      // If no explicit permission but user is creator, they're the owner
      permission: report.permission || (report.created_by_id === userId ? 'owner' : null),
    }));

    return createPaginatedResponse({
      data: transformedData,
      page,
      page_size,
      total,
    });
  } catch (error) {
    console.error('Error fetching reports with permissions:', error);
    throw new Error('Failed to fetch reports with permissions');
  }
}
