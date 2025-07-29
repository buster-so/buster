import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '../../connection';
import {
  datasetPermissions,
  datasets,
  datasetsToPermissionGroups,
  permissionGroups,
  permissionGroupsToIdentities,
  teamsToUsers,
  usersToOrganizations,
} from '../../schema';

export type DatasetAccessPath =
  | 'admin'
  | 'direct_user'
  | 'user_group'
  | 'team_direct'
  | 'team_group'
  | 'org_default';

export interface DatasetAccessResult {
  hasAccess: boolean;
  accessPath?: DatasetAccessPath;
  userRole?: string;
}

/**
 * Check if a user has access to a specific dataset
 * Implements all 6 access paths from the Rust code
 */
export async function hasDatasetAccess(
  userId: string,
  datasetId: string
): Promise<DatasetAccessResult> {
  // First check if dataset exists and is not deleted
  const [dataset] = await db
    .select({
      organizationId: datasets.organizationId,
      deletedAt: datasets.deletedAt,
    })
    .from(datasets)
    .where(eq(datasets.id, datasetId))
    .limit(1);

  if (!dataset || dataset.deletedAt) {
    return { hasAccess: false };
  }

  // Check admin/data admin/querier access
  const [userOrgRole] = await db
    .select({ role: usersToOrganizations.role })
    .from(usersToOrganizations)
    .where(
      and(
        eq(usersToOrganizations.userId, userId),
        eq(usersToOrganizations.organizationId, dataset.organizationId),
        isNull(usersToOrganizations.deletedAt)
      )
    )
    .limit(1);

  if (userOrgRole) {
    const role = userOrgRole.role;
    if (role === 'workspace_admin' || role === 'data_admin' || role === 'querier') {
      return { hasAccess: true, accessPath: 'admin', userRole: role };
    }
  }

  // Path 1: Direct user → dataset
  const [directAccess] = await db
    .select({ id: datasetPermissions.datasetId })
    .from(datasetPermissions)
    .where(
      and(
        eq(datasetPermissions.permissionId, userId),
        eq(datasetPermissions.permissionType, 'user'),
        eq(datasetPermissions.datasetId, datasetId),
        isNull(datasetPermissions.deletedAt)
      )
    )
    .limit(1);

  if (directAccess) {
    return { hasAccess: true, accessPath: 'direct_user' };
  }

  // Path 2: User → permission group → dataset
  const [userGroupAccess] = await db
    .select({ id: datasetsToPermissionGroups.datasetId })
    .from(datasetsToPermissionGroups)
    .innerJoin(
      permissionGroups,
      and(
        eq(datasetsToPermissionGroups.permissionGroupId, permissionGroups.id),
        isNull(permissionGroups.deletedAt)
      )
    )
    .innerJoin(
      permissionGroupsToIdentities,
      and(
        eq(permissionGroups.id, permissionGroupsToIdentities.permissionGroupId),
        eq(permissionGroupsToIdentities.identityId, userId),
        eq(permissionGroupsToIdentities.identityType, 'user'),
        isNull(permissionGroupsToIdentities.deletedAt)
      )
    )
    .where(
      and(
        eq(datasetsToPermissionGroups.datasetId, datasetId),
        isNull(datasetsToPermissionGroups.deletedAt)
      )
    )
    .limit(1);

  if (userGroupAccess) {
    return { hasAccess: true, accessPath: 'user_group' };
  }

  // Get user's teams
  const userTeams = await db
    .select({ teamId: teamsToUsers.teamId })
    .from(teamsToUsers)
    .where(and(eq(teamsToUsers.userId, userId), isNull(teamsToUsers.deletedAt)));

  if (userTeams.length > 0) {
    const teamIds = userTeams.map((t) => t.teamId);

    // Path 3: User → team → dataset
    const [teamDirectAccess] = await db
      .select({ id: datasetPermissions.datasetId })
      .from(datasetPermissions)
      .where(
        and(
          inArray(datasetPermissions.permissionId, teamIds),
          eq(datasetPermissions.permissionType, 'team'),
          eq(datasetPermissions.datasetId, datasetId),
          isNull(datasetPermissions.deletedAt)
        )
      )
      .limit(1);

    if (teamDirectAccess) {
      return { hasAccess: true, accessPath: 'team_direct' };
    }

    // Path 4: User → team → permission group → dataset
    const [teamGroupAccess] = await db
      .select({ id: datasetsToPermissionGroups.datasetId })
      .from(datasetsToPermissionGroups)
      .innerJoin(
        permissionGroups,
        and(
          eq(datasetsToPermissionGroups.permissionGroupId, permissionGroups.id),
          isNull(permissionGroups.deletedAt)
        )
      )
      .innerJoin(
        permissionGroupsToIdentities,
        and(
          eq(permissionGroups.id, permissionGroupsToIdentities.permissionGroupId),
          inArray(permissionGroupsToIdentities.identityId, teamIds),
          eq(permissionGroupsToIdentities.identityType, 'team'),
          isNull(permissionGroupsToIdentities.deletedAt)
        )
      )
      .where(
        and(
          eq(datasetsToPermissionGroups.datasetId, datasetId),
          isNull(datasetsToPermissionGroups.deletedAt)
        )
      )
      .limit(1);

    if (teamGroupAccess) {
      return { hasAccess: true, accessPath: 'team_group' };
    }
  }

  // Path 5: User → org → default permission group → dataset
  const userOrgs = await db
    .select({ organizationId: usersToOrganizations.organizationId })
    .from(usersToOrganizations)
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));

  for (const org of userOrgs) {
    const defaultGroupName = `default:${org.organizationId}`;

    const [defaultGroupAccess] = await db
      .select({ id: datasetsToPermissionGroups.datasetId })
      .from(datasetsToPermissionGroups)
      .innerJoin(
        permissionGroups,
        and(
          eq(datasetsToPermissionGroups.permissionGroupId, permissionGroups.id),
          eq(permissionGroups.name, defaultGroupName),
          eq(permissionGroups.organizationId, org.organizationId),
          isNull(permissionGroups.deletedAt)
        )
      )
      .where(
        and(
          eq(datasetsToPermissionGroups.datasetId, datasetId),
          isNull(datasetsToPermissionGroups.deletedAt)
        )
      )
      .limit(1);

    if (defaultGroupAccess) {
      return { hasAccess: true, accessPath: 'org_default' };
    }
  }

  return { hasAccess: false };
}

/**
 * Check if a user has access to ALL specified datasets
 */
export async function hasAllDatasetsAccess(
  userId: string,
  datasetIds: string[]
): Promise<{ hasAccessToAll: boolean; details: Record<string, DatasetAccessResult> }> {
  if (datasetIds.length === 0) {
    return { hasAccessToAll: false, details: {} };
  }

  const details: Record<string, DatasetAccessResult> = {};
  let hasAccessToAll = true;

  // Check each dataset
  for (const datasetId of datasetIds) {
    const result = await hasDatasetAccess(userId, datasetId);
    details[datasetId] = result;

    if (!result.hasAccess) {
      hasAccessToAll = false;
    }
  }

  return { hasAccessToAll, details };
}
