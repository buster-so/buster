import { and, eq, gt, inArray, isNull, or } from 'drizzle-orm';
import { db } from '../../connection';
import {
  assetPermissions,
  chats,
  collections,
  collectionsToAssets,
  dashboardFiles,
  messages,
  messagesToFiles,
  metricFilesToDashboardFiles,
  teamsToUsers,
  usersToOrganizations,
} from '../../schema';
import type { AssetPermissionRole, AssetType, WorkspaceSharing } from '../../schema-types';

export interface CheckAssetPermissionParams {
  userId: string;
  assetId: string;
  assetType: 'dashboard' | 'thread' | 'chat' | 'metric_file' | 'dashboard_file' | 'collection';
  organizationId?: string;
}

export interface AssetPermissionCheckResult {
  hasAccess: boolean;
  role?: AssetPermissionRole;
  accessPath?: 'direct' | 'workspace_sharing' | 'cascading' | 'admin';
}

/**
 * Check if a user has permission to access an asset
 * Checks direct permissions, workspace sharing, and admin overrides
 */
export async function checkAssetPermission(
  params: CheckAssetPermissionParams
): Promise<AssetPermissionCheckResult> {
  const { userId, assetId, assetType, organizationId } = params;

  // 1. Check if user is admin/data admin in the organization
  if (organizationId) {
    const [orgMembership] = await db
      .select()
      .from(usersToOrganizations)
      .where(
        and(
          eq(usersToOrganizations.userId, userId),
          eq(usersToOrganizations.organizationId, organizationId),
          isNull(usersToOrganizations.deletedAt),
          or(
            eq(usersToOrganizations.role, 'workspace_admin'),
            eq(usersToOrganizations.role, 'data_admin')
          )
        )
      )
      .limit(1);

    if (orgMembership) {
      return {
        hasAccess: true,
        role: 'owner' as AssetPermissionRole,
        accessPath: 'admin',
      };
    }
  }

  // 2. Check direct user permission
  const [directPermission] = await db
    .select()
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType),
        isNull(assetPermissions.deletedAt)
      )
    )
    .limit(1);

  if (directPermission) {
    return {
      hasAccess: true,
      role: directPermission.role,
      accessPath: 'direct',
    };
  }

  // 3. Check team permissions
  const userTeams = await db
    .select({ teamId: teamsToUsers.teamId })
    .from(teamsToUsers)
    .where(and(eq(teamsToUsers.userId, userId), isNull(teamsToUsers.deletedAt)));

  if (userTeams.length > 0) {
    const teamIds = userTeams.map((t) => t.teamId);
    const [teamPermission] = await db
      .select()
      .from(assetPermissions)
      .where(
        and(
          inArray(assetPermissions.identityId, teamIds),
          eq(assetPermissions.identityType, 'team'),
          eq(assetPermissions.assetId, assetId),
          eq(assetPermissions.assetType, assetType),
          isNull(assetPermissions.deletedAt)
        )
      )
      .limit(1);

    if (teamPermission) {
      return {
        hasAccess: true,
        role: teamPermission.role,
        accessPath: 'direct',
      };
    }
  }

  // No access found
  return { hasAccess: false };
}

/**
 * Check if user has access to a metric through dashboards
 */
export async function checkMetricDashboardAccess(
  userId: string,
  metricId: string
): Promise<boolean> {
  // Get all dashboards containing this metric
  const dashboards = await db
    .select({ dashboardId: metricFilesToDashboardFiles.dashboardFileId })
    .from(metricFilesToDashboardFiles)
    .innerJoin(dashboardFiles, eq(dashboardFiles.id, metricFilesToDashboardFiles.dashboardFileId))
    .where(
      and(
        eq(metricFilesToDashboardFiles.metricFileId, metricId),
        isNull(metricFilesToDashboardFiles.deletedAt),
        isNull(dashboardFiles.deletedAt)
      )
    );

  if (dashboards.length === 0) {
    return false;
  }

  // Check if user has access to any of these dashboards
  for (const { dashboardId } of dashboards) {
    // Need to get organizationId for the dashboard
    const [dashboardData] = await db
      .select({ organizationId: dashboardFiles.organizationId })
      .from(dashboardFiles)
      .where(eq(dashboardFiles.id, dashboardId))
      .limit(1);

    const access = await checkAssetPermission({
      userId,
      assetId: dashboardId,
      assetType: 'dashboard_file' as const,
      ...(dashboardData?.organizationId && { organizationId: dashboardData.organizationId }),
    });

    if (access.hasAccess) {
      return true;
    }

    // Also check if dashboard is public
    const [dashboard] = await db
      .select()
      .from(dashboardFiles)
      .where(
        and(
          eq(dashboardFiles.id, dashboardId),
          eq(dashboardFiles.publiclyAccessible, true),
          or(
            isNull(dashboardFiles.publicExpiryDate),
            gt(dashboardFiles.publicExpiryDate, new Date().toISOString())
          )
        )
      )
      .limit(1);

    if (dashboard) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has access to an asset through collections
 */
export async function checkAssetCollectionAccess(
  userId: string,
  assetId: string,
  assetType: 'dashboard' | 'thread' | 'chat' | 'metric_file' | 'dashboard_file' | 'collection',
  visitedCollections: Set<string> = new Set()
): Promise<boolean> {
  // Get all collections containing this asset
  const assetCollections = await db
    .select({ collectionId: collectionsToAssets.collectionId })
    .from(collectionsToAssets)
    .innerJoin(collections, eq(collections.id, collectionsToAssets.collectionId))
    .where(
      and(
        eq(collectionsToAssets.assetId, assetId),
        eq(collectionsToAssets.assetType, assetType),
        isNull(collectionsToAssets.deletedAt),
        isNull(collections.deletedAt)
      )
    );

  if (assetCollections.length === 0) {
    return false;
  }

  // Check if user has access to any of these collections
  for (const { collectionId } of assetCollections) {
    // Skip if we've already visited this collection (cycle detection)
    if (visitedCollections.has(collectionId)) {
      continue;
    }

    const access = await checkAssetPermission({
      userId,
      assetId: collectionId,
      assetType: 'collection' as const,
    });

    if (access.hasAccess) {
      return true;
    }

    // If this collection might contain other collections, check recursively
    if (assetType === 'collection') {
      visitedCollections.add(assetId);
      const hasNestedAccess = await checkAssetCollectionAccess(
        userId,
        collectionId,
        'collection',
        visitedCollections
      );
      if (hasNestedAccess) {
        return true;
      }
    }
  }

  return false;
}
