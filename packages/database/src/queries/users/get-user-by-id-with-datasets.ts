import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import {
  datasetGroups,
  datasetGroupsPermissions,
  datasetPermissions,
  datasets,
  permissionGroups,
  permissionGroupsToIdentities,
  users,
  usersToOrganizations,
} from '../../schema';
import { UserOrganizationRole, UserOrganizationStatus } from '../../schema-types';

/**
 * Dataset lineage item showing the permission path
 */
export interface DatasetLineageItem {
  id: string;
  type: 'user' | 'datasets' | 'permissionGroups' | 'datasetGroups';
  name: string;
}

/**
 * Dataset with permission information
 */
export interface DatasetInfo {
  id: string;
  name: string;
  can_query: boolean;
  lineage: DatasetLineageItem[][];
}

/**
 * Organization user with datasets
 */
export interface OrganizationUserWithDatasets {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  status: UserOrganizationStatus;
  role: UserOrganizationRole;
  datasets: DatasetInfo[];
}

/**
 * Get user information by ID including all their datasets and permission lineage
 * This matches the Rust implementation for GET /users/[id]
 */
export async function getUserByIdWithDatasets(
  userId: string
): Promise<OrganizationUserWithDatasets> {
  // Get user basic info and organization relationship
  const userInfoResults = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: usersToOrganizations.role,
      status: usersToOrganizations.status,
      organizationId: usersToOrganizations.organizationId,
    })
    .from(users)
    .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
    .where(and(eq(users.id, userId), isNull(usersToOrganizations.deletedAt)))
    .limit(1);

  if (userInfoResults.length === 0 || !userInfoResults[0]) {
    throw new Error(`User not found: ${userId}`);
  }

  const userInfo = userInfoResults[0];
  const { id, email, name, avatarUrl, role, status, organizationId } = userInfo;

  // Fetch all datasets in the organization
  const orgDatasets = await db
    .select({
      id: datasets.id,
      name: datasets.name,
    })
    .from(datasets)
    .where(and(eq(datasets.organizationId, organizationId), isNull(datasets.deletedAt)));

  // Fetch direct dataset permissions
  const directDatasetsPromise = db
    .select({
      datasetId: datasets.id,
      datasetName: datasets.name,
    })
    .from(datasetPermissions)
    .innerJoin(datasets, eq(datasetPermissions.datasetId, datasets.id))
    .where(
      and(
        eq(datasetPermissions.permissionId, userId),
        eq(datasetPermissions.permissionType, 'user'),
        isNull(datasetPermissions.deletedAt),
        isNull(datasets.deletedAt)
      )
    );

  // Fetch datasets via permission groups
  const permissionGroupDatasetsPromise = db
    .select({
      datasetId: datasets.id,
      datasetName: datasets.name,
      permissionGroupId: permissionGroups.id,
      permissionGroupName: permissionGroups.name,
    })
    .from(permissionGroupsToIdentities)
    .innerJoin(
      permissionGroups,
      eq(permissionGroupsToIdentities.permissionGroupId, permissionGroups.id)
    )
    .innerJoin(
      datasetPermissions,
      and(
        eq(permissionGroupsToIdentities.permissionGroupId, datasetPermissions.permissionId),
        eq(datasetPermissions.permissionType, 'permission_group')
      )
    )
    .innerJoin(datasets, eq(datasetPermissions.datasetId, datasets.id))
    .where(
      and(
        eq(permissionGroupsToIdentities.identityId, userId),
        eq(permissionGroupsToIdentities.identityType, 'user'),
        isNull(datasetPermissions.deletedAt),
        isNull(permissionGroups.deletedAt),
        isNull(datasets.deletedAt),
        isNull(permissionGroupsToIdentities.deletedAt)
      )
    );

  // Fetch datasets via direct dataset groups
  const directDatasetGroupsResultsPromise = db
    .select({
      datasetId: datasets.id,
      datasetName: datasets.name,
      datasetGroupId: datasetGroups.id,
      datasetGroupName: datasetGroups.name,
    })
    .from(datasetGroupsPermissions)
    .innerJoin(datasetGroups, eq(datasetGroupsPermissions.datasetGroupId, datasetGroups.id))
    .innerJoin(
      datasetPermissions,
      and(
        eq(datasetPermissions.permissionId, datasetGroups.id),
        eq(datasetPermissions.permissionType, 'dataset_group')
      )
    )
    .innerJoin(datasets, eq(datasetPermissions.datasetId, datasets.id))
    .where(
      and(
        eq(datasetGroupsPermissions.permissionId, userId),
        eq(datasetGroupsPermissions.permissionType, 'user'),
        isNull(datasetGroupsPermissions.deletedAt),
        isNull(datasetGroups.deletedAt),
        isNull(datasetPermissions.deletedAt)
      )
    );

  // Fetch datasets via permission groups to dataset groups
  const permissionGroupDatasetGroupsResultsPromise = db
    .select({
      datasetId: datasets.id,
      datasetName: datasets.name,
      datasetGroupId: datasetGroups.id,
      datasetGroupName: datasetGroups.name,
      permissionGroupId: permissionGroups.id,
      permissionGroupName: permissionGroups.name,
    })
    .from(permissionGroupsToIdentities)
    .innerJoin(
      permissionGroups,
      eq(permissionGroupsToIdentities.permissionGroupId, permissionGroups.id)
    )
    .innerJoin(
      datasetGroupsPermissions,
      and(
        eq(permissionGroups.id, datasetGroupsPermissions.permissionId),
        eq(datasetGroupsPermissions.permissionType, 'permission_group')
      )
    )
    .innerJoin(datasetGroups, eq(datasetGroupsPermissions.datasetGroupId, datasetGroups.id))
    .innerJoin(
      datasetPermissions,
      and(
        eq(datasetPermissions.permissionId, datasetGroups.id),
        eq(datasetPermissions.permissionType, 'dataset_group')
      )
    )
    .innerJoin(datasets, eq(datasetPermissions.datasetId, datasets.id))
    .where(
      and(
        eq(permissionGroupsToIdentities.identityId, userId),
        eq(permissionGroupsToIdentities.identityType, 'user'),
        isNull(permissionGroupsToIdentities.deletedAt),
        isNull(datasetGroupsPermissions.deletedAt),
        isNull(permissionGroups.deletedAt),
        isNull(datasetGroups.deletedAt),
        isNull(datasetPermissions.deletedAt),
        isNull(datasets.deletedAt)
      )
    );

  // Build dataset map with permissions
  const datasetMap = new Map<string, DatasetInfo>();

  // Helper function to add or update dataset
  const addDataset = (
    datasetId: string,
    datasetName: string,
    canQuery: boolean,
    lineage: DatasetLineageItem[]
  ) => {
    if (!datasetMap.has(datasetId)) {
      datasetMap.set(datasetId, {
        id: datasetId,
        name: datasetName,
        can_query: canQuery,
        lineage: [lineage],
      });
    }
  };

  if (role === 'workspace_admin' || role === 'data_admin' || role === 'querier') {
    for (const dataset of orgDatasets) {
      addDataset(dataset.id, dataset.name, true, [
        { id, type: 'user', name: 'Default Access' },
        { id, type: 'user', name: role },
      ]);
    }
  } else if (role === 'viewer') {
    for (const dataset of orgDatasets) {
      addDataset(dataset.id, dataset.name, false, [
        { id, type: 'user', name: 'Default Access' },
        { id, type: 'user', name: 'Viewer' },
      ]);
    }
  } else if (role === 'restricted_querier') {
    const [
      directDatasets,
      permissionGroupDatasets,
      directDatasetGroupsResults,
      permissionGroupDatasetGroupsResults,
    ] = await Promise.all([
      directDatasetsPromise,
      permissionGroupDatasetsPromise,
      directDatasetGroupsResultsPromise,
      permissionGroupDatasetGroupsResultsPromise,
    ]);

    for (const dataset of directDatasets) {
      addDataset(dataset.datasetId, dataset.datasetName, true, [
        { id, type: 'datasets', name: 'Direct Access' },
        { id, type: 'datasets', name: dataset.datasetName },
      ]);
    }

    for (const dataset of permissionGroupDatasets) {
      addDataset(dataset.datasetId, dataset.datasetName, true, [
        { id, type: 'permissionGroups', name: 'Permission Group' },
        { id, type: 'permissionGroups', name: dataset.permissionGroupName },
      ]);
    }

    for (const dataset of directDatasetGroupsResults) {
      addDataset(dataset.datasetId, dataset.datasetName, true, [
        { id, type: 'datasetGroups', name: 'Dataset Group' },
        { id, type: 'datasetGroups', name: dataset.datasetGroupName },
      ]);
    }

    for (const dataset of permissionGroupDatasetGroupsResults) {
      addDataset(dataset.datasetId, dataset.datasetName, true, [
        { id, type: 'permissionGroups', name: 'Permission Group' },
        { id, type: 'permissionGroups', name: dataset.permissionGroupName },
        { id, type: 'datasetGroups', name: 'Dataset Group' },
        { id, type: 'datasetGroups', name: dataset.datasetGroupName },
      ]);
    }

    // Add remaining datasets with no access. addDataset will not add duplicates
    for (const dataset of orgDatasets) {
      addDataset(dataset.id, dataset.name, false, [
        { id, type: 'user', name: 'Default Access' },
        { id, type: 'user', name: 'Restricted Querier' },
      ]);
    }
  } else {
    const _exhaustiveCheck = role;
    throw new Error(`Unknown role: ${_exhaustiveCheck}`);
  }

  return {
    id,
    email,
    name: name || email,
    avatar_url: avatarUrl,
    status,
    role,
    datasets: Array.from(datasetMap.values()),
  };
}
