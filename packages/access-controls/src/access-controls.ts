import { and, count, eq, getDb, inArray, isNull } from '@buster/database/connection';
import {
  datasetPermissions,
  datasets,
  datasetsToPermissionGroups,
  permissionGroups,
  permissionGroupsToIdentities,
  teamsToUsers,
  usersToOrganizations,
} from '@buster/database/schema';
import { z } from 'zod';
import { type AccessControlOptions, AccessControlsError } from './types';

// Schema for the permissioned dataset result
const PermissionedDatasetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ymlFile: z.string().nullable(),
  createdAt: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  updatedAt: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  deletedAt: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === 'string' ? new Date(val) : val))
    .nullable(),
  dataSourceId: z.string().uuid(),
});

export type PermissionedDataset = z.infer<typeof PermissionedDatasetSchema>;

// Input validation schemas
const GetPermissionedDatasetsSchema = z.object({
  userId: z.string().uuid(),
  page: z.number().int().min(0),
  pageSize: z.number().int().min(1).max(1000),
});

const HasDatasetAccessSchema = z.object({
  userId: z.string().uuid(),
  datasetId: z.string().uuid(),
});

const HasAllDatasetsAccessSchema = z.object({
  userId: z.string().uuid(),
  datasetIds: z.array(z.string().uuid()),
});

// --- Helper Functions for Different Permission Paths ---

// Path 1: Direct User -> Dataset
async function fetchDirectUserDatasetIds(userId: string): Promise<string[]> {
  const db = getDb();

  const results = await db
    .select({ datasetId: datasetPermissions.datasetId })
    .from(datasetPermissions)
    .where(
      and(
        eq(datasetPermissions.permissionId, userId),
        eq(datasetPermissions.permissionType, 'user'),
        isNull(datasetPermissions.deletedAt)
      )
    );

  return results.map((r: { datasetId: string }) => r.datasetId);
}

// Path 3: User -> Team -> Dataset (Direct team assignment)
async function fetchTeamDirectDatasetIds(userId: string): Promise<string[]> {
  const db = getDb();

  const results = await db
    .selectDistinct({ datasetId: datasetPermissions.datasetId })
    .from(datasetPermissions)
    .innerJoin(
      teamsToUsers,
      and(
        eq(datasetPermissions.permissionId, teamsToUsers.teamId),
        eq(datasetPermissions.permissionType, 'team'),
        eq(teamsToUsers.userId, userId),
        isNull(teamsToUsers.deletedAt)
      )
    )
    .where(isNull(datasetPermissions.deletedAt));

  return results.map((r: { datasetId: string }) => r.datasetId);
}

// Path 2: User -> Group -> Dataset
async function fetchUserGroupDatasetIds(userId: string): Promise<string[]> {
  const db = getDb();

  const results = await db
    .selectDistinct({ datasetId: datasetsToPermissionGroups.datasetId })
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

  return results.map((r: { datasetId: string }) => r.datasetId);
}

// Path 4: User -> Team -> Group -> Dataset
async function fetchTeamGroupDatasetIds(userId: string): Promise<string[]> {
  const db = getDb();

  const results = await db
    .selectDistinct({ datasetId: datasetsToPermissionGroups.datasetId })
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
        eq(permissionGroupsToIdentities.identityType, 'team'),
        isNull(permissionGroupsToIdentities.deletedAt)
      )
    )
    .innerJoin(
      teamsToUsers,
      and(
        eq(permissionGroupsToIdentities.identityId, teamsToUsers.teamId),
        eq(teamsToUsers.userId, userId),
        isNull(teamsToUsers.deletedAt)
      )
    )
    .where(isNull(datasetsToPermissionGroups.deletedAt));

  return results.map((r: { datasetId: string }) => r.datasetId);
}

// Path 5: User -> Organization -> Default Permission Group -> Dataset
async function fetchOrgDefaultDatasetIds(userId: string): Promise<string[]> {
  const db = getDb();

  // Get all the user's organizations
  const userOrgs = await db
    .select({ organizationId: usersToOrganizations.organizationId })
    .from(usersToOrganizations)
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));

  if (userOrgs.length === 0) {
    return []; // User not in any organization
  }

  // Get datasets from all default permission groups across all user's organizations
  const allDatasetIds: string[] = [];

  for (const userOrg of userOrgs) {
    const { organizationId } = userOrg;
    const defaultGroupName = `default:${organizationId}`;

    // Find the default permission group for this organization
    const defaultGroup = await db
      .select({ id: permissionGroups.id })
      .from(permissionGroups)
      .where(
        and(
          eq(permissionGroups.name, defaultGroupName),
          eq(permissionGroups.organizationId, organizationId),
          isNull(permissionGroups.deletedAt)
        )
      )
      .limit(1);

    const [firstGroup] = defaultGroup;
    if (!firstGroup) {
      continue; // No default permission group exists for this org
    }

    const defaultGroupId = firstGroup.id;

    // Get all datasets in the default permission group
    const results = await db
      .select({ datasetId: datasetsToPermissionGroups.datasetId })
      .from(datasetsToPermissionGroups)
      .where(
        and(
          eq(datasetsToPermissionGroups.permissionGroupId, defaultGroupId),
          isNull(datasetsToPermissionGroups.deletedAt)
        )
      );

    allDatasetIds.push(...results.map((r: { datasetId: string }) => r.datasetId));
  }

  // Return unique dataset IDs
  return [...new Set(allDatasetIds)];
}

// --- Main Functions ---

export async function getPermissionedDatasets(
  userId: string,
  page: number,
  pageSize: number
): Promise<PermissionedDataset[]> {
  // Validate inputs
  const input = GetPermissionedDatasetsSchema.parse({ userId, page, pageSize });

  const db = getDb();

  // Fetch all user's organizations and roles
  const userOrgs = await db
    .select({
      organizationId: usersToOrganizations.organizationId,
      role: usersToOrganizations.role,
    })
    .from(usersToOrganizations)
    .where(
      and(eq(usersToOrganizations.userId, input.userId), isNull(usersToOrganizations.deletedAt))
    );

  if (userOrgs.length === 0) {
    // User not in any organization
    return [];
  }

  // --- Admin/Querier Path ---
  // Check if user has admin/querier role in any organization
  const adminOrgs = userOrgs.filter((org) =>
    ['workspace_admin', 'data_admin', 'querier'].includes(org.role)
  );

  if (adminOrgs.length > 0) {
    // Get datasets from ALL organizations where user has admin/querier access
    const organizationIds = adminOrgs.map((org) => org.organizationId);

    const results = await db
      .select({
        id: datasets.id,
        name: datasets.name,
        ymlFile: datasets.ymlFile,
        createdAt: datasets.createdAt,
        updatedAt: datasets.updatedAt,
        deletedAt: datasets.deletedAt,
        dataSourceId: datasets.dataSourceId,
      })
      .from(datasets)
      .where(and(inArray(datasets.organizationId, organizationIds), isNull(datasets.deletedAt)))
      .orderBy(datasets.name)
      .limit(input.pageSize)
      .offset(input.page * input.pageSize);

    return results.map((r) => PermissionedDatasetSchema.parse(r));
  }

  // --- Non-Admin Path ---
  // Fetch all potential dataset IDs concurrently
  const [directUserIds, teamDirectIds, userGroupIds, teamGroupIds, orgDefaultIds] =
    await Promise.all([
      fetchDirectUserDatasetIds(input.userId),
      fetchTeamDirectDatasetIds(input.userId),
      fetchUserGroupDatasetIds(input.userId),
      fetchTeamGroupDatasetIds(input.userId),
      fetchOrgDefaultDatasetIds(input.userId),
    ]);

  // Combine and deduplicate IDs
  const allAccessibleIds = new Set([
    ...directUserIds,
    ...teamDirectIds,
    ...userGroupIds,
    ...teamGroupIds,
    ...orgDefaultIds,
  ]);

  if (allAccessibleIds.size === 0) {
    return []; // No datasets accessible
  }

  // Get all organization IDs for the user
  const organizationIds = userOrgs.map((org) => org.organizationId);

  // Fetch the actual dataset info for the combined IDs with pagination
  // IMPORTANT: Filter by organization to prevent cross-org data access
  const results = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      ymlFile: datasets.ymlFile,
      createdAt: datasets.createdAt,
      updatedAt: datasets.updatedAt,
      deletedAt: datasets.deletedAt,
      dataSourceId: datasets.dataSourceId,
    })
    .from(datasets)
    .where(
      and(
        inArray(datasets.id, Array.from(allAccessibleIds)),
        inArray(datasets.organizationId, organizationIds),
        isNull(datasets.deletedAt)
      )
    )
    .orderBy(datasets.name)
    .limit(input.pageSize)
    .offset(input.page * input.pageSize);

  return results.map((r) => PermissionedDatasetSchema.parse(r));
}

export async function hasDatasetAccess(userId: string, datasetId: string): Promise<boolean> {
  // Validate inputs
  const input = HasDatasetAccessSchema.parse({ userId, datasetId });

  const db = getDb();

  // --- Check if Dataset exists and get Organization ID and deleted status ---
  const datasetInfo = await db
    .select({
      organizationId: datasets.organizationId,
      deletedAt: datasets.deletedAt,
    })
    .from(datasets)
    .where(eq(datasets.id, input.datasetId))
    .limit(1);

  const dataset = datasetInfo[0];

  if (!dataset) {
    return false; // Dataset doesn't exist
  }

  const { organizationId, deletedAt } = dataset;

  // --- Universal Check: If dataset is deleted, NO ONE has access ---
  if (deletedAt !== null) {
    return false;
  }

  // Check Admin/Querier Access
  const adminAccess = await db
    .select({ role: usersToOrganizations.role })
    .from(usersToOrganizations)
    .where(
      and(
        eq(usersToOrganizations.userId, input.userId),
        eq(usersToOrganizations.organizationId, organizationId),
        isNull(usersToOrganizations.deletedAt)
      )
    )
    .limit(1);

  const access = adminAccess[0];

  if (adminAccess.length > 0 && access) {
    const { role } = access;
    if (['workspace_admin', 'data_admin', 'querier'].includes(role)) {
      // Admins/Queriers have access to non-deleted datasets in their org
      return true;
    }
  }

  // --- Check Non-Admin Access Paths Concurrently ---
  const permissionChecks = await Promise.all([
    // Path 1: Direct User -> Dataset
    checkDirectUserPermission(input.userId, input.datasetId),
    // Path 3: User -> Team -> Dataset
    checkTeamDirectPermission(input.userId, input.datasetId),
    // Path 2: User -> Group -> Dataset
    checkUserGroupPermission(input.userId, input.datasetId),
    // Path 4: User -> Team -> Group -> Dataset
    checkTeamGroupPermission(input.userId, input.datasetId),
    // Path 5: User -> Organization -> Default Permission Group -> Dataset
    checkOrgDefaultPermission(input.userId, input.datasetId),
  ]);

  // Return true if any permission check succeeds
  return permissionChecks.some((hasAccess) => hasAccess);
}

export async function hasAllDatasetsAccess(userId: string, datasetIds: string[]): Promise<boolean> {
  // Validate inputs
  const input = HasAllDatasetsAccessSchema.parse({ userId, datasetIds });

  if (input.datasetIds.length === 0) {
    return false; // No datasets means no access granted
  }

  const db = getDb();

  // --- Step 1: Verify all datasets exist, are not deleted, and get their org IDs ---
  const datasetInfos = await db
    .select({
      id: datasets.id,
      organizationId: datasets.organizationId,
      deletedAt: datasets.deletedAt,
    })
    .from(datasets)
    .where(inArray(datasets.id, input.datasetIds));

  // Check if we found info for all requested datasets
  if (datasetInfos.length !== input.datasetIds.length) {
    return false; // At least one dataset doesn't exist
  }

  // Check for deleted datasets and collect unique organization IDs
  const organizationIds = new Set<string>();
  for (const { organizationId, deletedAt } of datasetInfos) {
    if (deletedAt !== null) {
      return false; // Access denied if any dataset is deleted
    }
    organizationIds.add(organizationId);
  }

  // --- Step 2: Check Admin/Querier access across all relevant organizations ---
  const adminRoles = await db
    .select({
      organizationId: usersToOrganizations.organizationId,
      role: usersToOrganizations.role,
    })
    .from(usersToOrganizations)
    .where(
      and(
        eq(usersToOrganizations.userId, input.userId),
        inArray(usersToOrganizations.organizationId, Array.from(organizationIds)),
        isNull(usersToOrganizations.deletedAt)
      )
    );

  const adminOrgIdsWithAccess = new Set(
    adminRoles
      .filter(({ role }: { role: string }) =>
        ['workspace_admin', 'data_admin', 'querier'].includes(role)
      )
      .map(({ organizationId }: { organizationId: string }) => organizationId)
  );

  // Check if all required organization IDs are covered by the user's admin/querier roles
  const allOrgsHaveAdminAccess = Array.from(organizationIds).every((orgId) =>
    adminOrgIdsWithAccess.has(orgId)
  );

  if (allOrgsHaveAdminAccess) {
    return true; // User is admin/querier in all necessary orgs
  }

  // --- Step 3: Check specific permissions for each dataset ---
  for (const datasetId of input.datasetIds) {
    const datasetOrgId = datasetInfos.find(
      (info: { id: string; organizationId: string; deletedAt: string | null }) =>
        info.id === datasetId
    )?.organizationId;

    if (!datasetOrgId) {
      throw new AccessControlsError('Dataset info missing after validation');
    }

    if (adminOrgIdsWithAccess.has(datasetOrgId)) {
      // User has admin/querier access in this dataset's org
      continue;
    }

    // Check specific permissions for this dataset
    const hasSpecificAccess = await checkSpecificDatasetPermissions(input.userId, datasetId);
    if (!hasSpecificAccess) {
      return false; // If access fails for any dataset, the whole check fails
    }
  }

  return true; // User has access to all datasets
}

// --- Helper Functions for Individual Permission Checks ---

async function checkDirectUserPermission(userId: string, datasetId: string): Promise<boolean> {
  const db = getDb();

  const result = await db
    .select({ count: count() })
    .from(datasetPermissions)
    .where(
      and(
        eq(datasetPermissions.permissionId, userId),
        eq(datasetPermissions.permissionType, 'user'),
        eq(datasetPermissions.datasetId, datasetId),
        isNull(datasetPermissions.deletedAt)
      )
    );

  const permissionCount: number = result[0]?.count ?? 0;

  return permissionCount > 0;
}

async function checkTeamDirectPermission(userId: string, datasetId: string): Promise<boolean> {
  const db = getDb();

  const result = await db
    .select({ count: count() })
    .from(datasetPermissions)
    .innerJoin(
      teamsToUsers,
      and(
        eq(datasetPermissions.permissionId, teamsToUsers.teamId),
        eq(datasetPermissions.permissionType, 'team'),
        eq(teamsToUsers.userId, userId),
        isNull(teamsToUsers.deletedAt)
      )
    )
    .where(and(eq(datasetPermissions.datasetId, datasetId), isNull(datasetPermissions.deletedAt)));

  const permissionCount: number = result[0]?.count ?? 0;

  return permissionCount > 0;
}

async function checkUserGroupPermission(userId: string, datasetId: string): Promise<boolean> {
  const db = getDb();

  const result = await db
    .select({ count: count() })
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
    );

  const permissionCount: number = result[0]?.count ?? 0;

  return permissionCount > 0;
}

async function checkTeamGroupPermission(userId: string, datasetId: string): Promise<boolean> {
  const db = getDb();

  const result = await db
    .select({ count: count() })
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
        eq(permissionGroupsToIdentities.identityType, 'team'),
        isNull(permissionGroupsToIdentities.deletedAt)
      )
    )
    .innerJoin(
      teamsToUsers,
      and(
        eq(permissionGroupsToIdentities.identityId, teamsToUsers.teamId),
        eq(teamsToUsers.userId, userId),
        isNull(teamsToUsers.deletedAt)
      )
    )
    .where(
      and(
        eq(datasetsToPermissionGroups.datasetId, datasetId),
        isNull(datasetsToPermissionGroups.deletedAt)
      )
    );

  const permissionCount: number = result[0]?.count ?? 0;

  return permissionCount > 0;
}

async function checkOrgDefaultPermission(userId: string, datasetId: string): Promise<boolean> {
  const db = getDb();

  // Get all the user's organizations
  const userOrgs = await db
    .select({ organizationId: usersToOrganizations.organizationId })
    .from(usersToOrganizations)
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));

  if (userOrgs.length === 0) {
    return false; // User not in any organization
  }

  // Check if the dataset is in any organization's default permission group
  for (const userOrg of userOrgs) {
    const { organizationId } = userOrg;
    const defaultGroupName = `default:${organizationId}`;

    const result = await db
      .select({ count: count() })
      .from(datasetsToPermissionGroups)
      .innerJoin(
        permissionGroups,
        and(
          eq(datasetsToPermissionGroups.permissionGroupId, permissionGroups.id),
          eq(permissionGroups.name, defaultGroupName),
          eq(permissionGroups.organizationId, organizationId),
          isNull(permissionGroups.deletedAt)
        )
      )
      .where(
        and(
          eq(datasetsToPermissionGroups.datasetId, datasetId),
          isNull(datasetsToPermissionGroups.deletedAt)
        )
      );

    const permissionCount: number = result[0]?.count ?? 0;

    if (permissionCount > 0) {
      return true; // Found access in this org's default group
    }
  }

  return false; // No access found in any org's default group
}

async function checkSpecificDatasetPermissions(
  userId: string,
  datasetId: string
): Promise<boolean> {
  // Check all permission paths concurrently
  const permissionChecks = await Promise.all([
    checkDirectUserPermission(userId, datasetId),
    checkTeamDirectPermission(userId, datasetId),
    checkUserGroupPermission(userId, datasetId),
    checkTeamGroupPermission(userId, datasetId),
    checkOrgDefaultPermission(userId, datasetId),
  ]);

  // Return true if any permission check succeeds
  return permissionChecks.some((hasAccess) => hasAccess);
}

// Legacy function names for compatibility
export function checkPermission(options: AccessControlOptions): Promise<boolean> {
  return hasDatasetAccess(options.userId, options.resourceId || '');
}

export function hasRole(_userId: string, _role: string): Promise<boolean> {
  // Placeholder for role-based checks - implement as needed
  throw new AccessControlsError('hasRole not implemented yet');
}

export function validateAccess(options: AccessControlOptions): Promise<boolean> {
  return checkPermission(options);
}
