import { and, count, desc, eq, isNull, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { assetPermissions, dashboardFiles, users, usersToOrganizations } from '../../schema';
import type { DashboardListItem, PaginatedResponse } from '../../schema-types';
import { createPaginatedResponse, PaginationInputSchema } from '../../schema-types';

export const ListDashboardsRequestSchema = z
  .object({
    userId: z.string().uuid('User ID must be a valid UUID'),
    shared_with_me: z.boolean().optional(),
    only_my_dashboards: z.boolean().optional(),
  })
  .merge(PaginationInputSchema);

export type ListDashboardsRequest = z.infer<typeof ListDashboardsRequestSchema>;
export type ListDashboardsResponse = PaginatedResponse<DashboardListItem>;

/**
 * Create a subquery for dashboards the user owns
 */
function getOwnedDashboards(userId: string) {
  return db
    .select({ dashboardId: dashboardFiles.id })
    .from(dashboardFiles)
    .where(and(eq(dashboardFiles.createdBy, userId), isNull(dashboardFiles.deletedAt)));
}

/**
 * Create a subquery for dashboards directly shared with the user via asset_permissions
 */
function getDirectlySharedDashboards(userId: string) {
  return db
    .select({ dashboardId: assetPermissions.assetId })
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        eq(assetPermissions.assetType, 'dashboard_file'),
        isNull(assetPermissions.deletedAt)
      )
    );
}

/**
 * Create a subquery for workspace-shared dashboards
 */
function getWorkspaceSharedDashboards(userId: string) {
  return db
    .selectDistinct({ dashboardId: dashboardFiles.id })
    .from(dashboardFiles)
    .innerJoin(
      usersToOrganizations,
      eq(dashboardFiles.organizationId, usersToOrganizations.organizationId)
    )
    .where(
      and(
        eq(usersToOrganizations.userId, userId),
        isNull(usersToOrganizations.deletedAt),
        ne(dashboardFiles.workspaceSharing, 'none'),
        isNull(dashboardFiles.deletedAt)
      )
    );
}

/**
 * Create a combined subquery for all accessible dashboard IDs using UNION
 */
function getAccessibleDashboardIds(userId: string) {
  const ownedDashboards = getOwnedDashboards(userId);
  const directlySharedDashboards = getDirectlySharedDashboards(userId);
  const workspaceSharedDashboards = getWorkspaceSharedDashboards(userId);

  return ownedDashboards
    .union(directlySharedDashboards)
    .union(workspaceSharedDashboards)
    .as('accessible_dashboard_ids');
}

/**
 * List dashboards with pagination support
 *
 * This function efficiently retrieves a list of dashboards with their associated user information
 * and sharing details. It supports filtering by ownership and shared status.
 *
 * @param params - Request parameters including userId, pagination, and filters
 * @returns Paginated list of dashboards with user information
 */
export async function listDashboards(
  params: ListDashboardsRequest
): Promise<ListDashboardsResponse> {
  const { userId, page, page_size, shared_with_me, only_my_dashboards } =
    ListDashboardsRequestSchema.parse(params);

  // Calculate offset based on page number
  const offset = (page - 1) * page_size;

  // Create the accessible dashboard IDs subquery
  const accessibleDashboardIds = getAccessibleDashboardIds(userId);

  // Build filter conditions based on request parameters
  const filterConditions = and(
    isNull(dashboardFiles.deletedAt),
    // Filter by ownership if requested
    only_my_dashboards ? eq(dashboardFiles.createdBy, userId) : undefined,
    // Filter by shared status if requested
    shared_with_me ? ne(dashboardFiles.createdBy, userId) : undefined
  );

  // Main query: join dashboards with accessible IDs and apply filtering
  const results = await db
    .select({
      id: dashboardFiles.id,
      name: dashboardFiles.name,
      createdAt: dashboardFiles.createdAt,
      updatedAt: dashboardFiles.updatedAt,
      createdBy: dashboardFiles.createdBy,
      organizationId: dashboardFiles.organizationId,
      workspaceSharing: dashboardFiles.workspaceSharing,
      publiclyAccessible: dashboardFiles.publiclyAccessible,
      userName: users.name,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
    })
    .from(dashboardFiles)
    .innerJoin(accessibleDashboardIds, eq(dashboardFiles.id, accessibleDashboardIds.dashboardId))
    .innerJoin(users, eq(dashboardFiles.createdBy, users.id))
    .where(filterConditions)
    .orderBy(desc(dashboardFiles.updatedAt))
    .limit(page_size)
    .offset(offset);

  // Get total count for pagination using the same conditions
  const [countResult] = await db
    .select({ count: count() })
    .from(dashboardFiles)
    .innerJoin(accessibleDashboardIds, eq(dashboardFiles.id, accessibleDashboardIds.dashboardId))
    .where(filterConditions);

  // Transform results to DashboardListItem format
  const dashboardItems: DashboardListItem[] = results.map(
    (dashboard) =>
      ({
        id: dashboard.id,
        name: dashboard.name,
        created_at: dashboard.createdAt,
        last_edited: dashboard.updatedAt,
        owner: {
          id: dashboard.createdBy,
          name: dashboard.userName || dashboard.userEmail,
          avatar_url: dashboard.userAvatarUrl,
        },
        status: 'notRequested', // Default status - can be enhanced later
        is_shared: dashboard.createdBy !== userId,
      }) satisfies DashboardListItem
  );

  // Return paginated response
  return createPaginatedResponse({
    data: dashboardItems,
    page,
    page_size,
    total: countResult?.count ?? 0,
  });
}
