import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
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

export interface GetPermissionedDatasetsParams {
  userId: string;
  page?: number;
  pageSize?: number;
}

export interface PermissionedDataset {
  id: string;
  name: string;
  ymlContent: string | null;
  dataSourceId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all datasets a user has access to through various permission paths
 * Implements the 5 access paths from the Rust code
 */
export async function getPermissionedDatasets(
  params: GetPermissionedDatasetsParams
): Promise<{ datasets: PermissionedDataset[]; total: number }> {
  const { userId, page = 0, pageSize = 20 } = params;

  // First, get user's organizations and check for admin roles
  const userOrgs = await db
    .select({
      organizationId: usersToOrganizations.organizationId,
      role: usersToOrganizations.role,
    })
    .from(usersToOrganizations)
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));

  if (userOrgs.length === 0) {
    return { datasets: [], total: 0 };
  }

  // Check if user is admin/data admin/querier in any org
  const adminOrgIds = userOrgs
    .filter(
      (org) => org.role === 'workspace_admin' || org.role === 'data_admin' || org.role === 'querier'
    )
    .map((org) => org.organizationId);

  if (adminOrgIds.length > 0) {
    // Admin path - get all datasets from admin orgs
    const allDatasets = await db
      .select({
        id: datasets.id,
        name: datasets.name,
        ymlContent: datasets.ymlFile,
        dataSourceId: datasets.dataSourceId,
        organizationId: datasets.organizationId,
        createdAt: datasets.createdAt,
        updatedAt: datasets.updatedAt,
      })
      .from(datasets)
      .where(and(inArray(datasets.organizationId, adminOrgIds), isNull(datasets.deletedAt)))
      .orderBy(datasets.name)
      .limit(pageSize)
      .offset(page * pageSize);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(datasets)
      .where(and(inArray(datasets.organizationId, adminOrgIds), isNull(datasets.deletedAt)));

    return { datasets: allDatasets, total: countResult[0]?.count || 0 };
  }

  // Non-admin path - collect dataset IDs from all access paths
  const accessibleDatasetIds = new Set<string>();

  // Path 1: Direct user → dataset
  const directUserDatasets = await db
    .select({ datasetId: datasetPermissions.datasetId })
    .from(datasetPermissions)
    .where(
      and(
        eq(datasetPermissions.permissionId, userId),
        eq(datasetPermissions.permissionType, 'user'),
        isNull(datasetPermissions.deletedAt)
      )
    );
  directUserDatasets.forEach((d) => {
    accessibleDatasetIds.add(d.datasetId);
  });

  // Path 2: User → permission group → dataset
  const userGroupDatasets = await db
    .select({ datasetId: datasetsToPermissionGroups.datasetId })
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
    .where(isNull(datasetsToPermissionGroups.deletedAt));
  userGroupDatasets.forEach((d) => {
    accessibleDatasetIds.add(d.datasetId);
  });

  // Get user's teams
  const userTeams = await db
    .select({ teamId: teamsToUsers.teamId })
    .from(teamsToUsers)
    .where(and(eq(teamsToUsers.userId, userId), isNull(teamsToUsers.deletedAt)));
  const teamIds = userTeams.map((t) => t.teamId);

  if (teamIds.length > 0) {
    // Path 3: User → team → dataset
    const teamDirectDatasets = await db
      .select({ datasetId: datasetPermissions.datasetId })
      .from(datasetPermissions)
      .where(
        and(
          inArray(datasetPermissions.permissionId, teamIds),
          eq(datasetPermissions.permissionType, 'team'),
          isNull(datasetPermissions.deletedAt)
        )
      );
    teamDirectDatasets.forEach((d) => {
      accessibleDatasetIds.add(d.datasetId);
    });

    // Path 4: User → team → permission group → dataset
    const teamGroupDatasets = await db
      .select({ datasetId: datasetsToPermissionGroups.datasetId })
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
      .where(isNull(datasetsToPermissionGroups.deletedAt));
    teamGroupDatasets.forEach((d) => {
      accessibleDatasetIds.add(d.datasetId);
    });
  }

  // Path 5: User → org → default permission group → dataset
  const orgIds = userOrgs.map((o) => o.organizationId);
  if (orgIds.length > 0) {
    const defaultGroupNames = orgIds.map((orgId) => `default:${orgId}`);

    const defaultGroupDatasets = await db
      .select({ datasetId: datasetsToPermissionGroups.datasetId })
      .from(datasetsToPermissionGroups)
      .innerJoin(
        permissionGroups,
        and(
          eq(datasetsToPermissionGroups.permissionGroupId, permissionGroups.id),
          inArray(permissionGroups.name, defaultGroupNames),
          inArray(permissionGroups.organizationId, orgIds),
          isNull(permissionGroups.deletedAt)
        )
      )
      .where(isNull(datasetsToPermissionGroups.deletedAt));

    defaultGroupDatasets.forEach((d) => {
      accessibleDatasetIds.add(d.datasetId);
    });
  }

  if (accessibleDatasetIds.size === 0) {
    return { datasets: [], total: 0 };
  }

  // Get the actual datasets
  const datasetIdArray = Array.from(accessibleDatasetIds);
  const accessibleDatasets = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      ymlContent: datasets.ymlFile,
      dataSourceId: datasets.dataSourceId,
      organizationId: datasets.organizationId,
      createdAt: datasets.createdAt,
      updatedAt: datasets.updatedAt,
    })
    .from(datasets)
    .where(
      and(
        inArray(datasets.id, datasetIdArray),
        inArray(datasets.organizationId, orgIds), // Security: only from user's orgs
        isNull(datasets.deletedAt)
      )
    )
    .orderBy(datasets.name)
    .limit(pageSize)
    .offset(page * pageSize);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(datasets)
    .where(
      and(
        inArray(datasets.id, datasetIdArray),
        inArray(datasets.organizationId, orgIds),
        isNull(datasets.deletedAt)
      )
    );

  return { datasets: accessibleDatasets, total: countResult[0]?.count || 0 };
}
