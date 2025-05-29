import { queryOptions } from '@tanstack/react-query';
import type {
  DatasetGroup,
  GetDatasetGroupDatasetsResponse,
  GetDatasetGroupPermissionGroupsResponse,
  GetDatasetGroupUsersResponse
} from '@/api/asset_interfaces/dataset_groups';
import type {
  DatasetPermissionsOverviewResponse,
  ListDatasetGroupsResponse,
  ListPermissionUsersResponse
} from '@/api/asset_interfaces/datasets';

const datasetGroupsList = queryOptions<ListDatasetGroupsResponse[]>({
  queryKey: ['dataset_groups', 'list'] as const,
  staleTime: 10 * 1000
});

const datasetGroupsGet = (datasetGroupId: string) =>
  queryOptions<DatasetGroup>({
    queryKey: ['dataset_groups', datasetGroupId] as const,
    staleTime: 10 * 1000
  });

const datasetGroupsGetUsers = (datasetGroupId: string) =>
  queryOptions<GetDatasetGroupUsersResponse[]>({
    queryKey: ['dataset_groups', datasetGroupId, 'users'] as const,
    staleTime: 10 * 1000
  });

const datasetGroupsGetDatasets = (datasetGroupId: string) =>
  queryOptions<GetDatasetGroupDatasetsResponse[]>({
    queryKey: ['dataset_groups', datasetGroupId, 'datasets'] as const,
    staleTime: 10 * 1000
  });

const datasetGroupsGetPermissionGroups = (datasetGroupId: string) =>
  queryOptions<GetDatasetGroupPermissionGroupsResponse[]>({
    queryKey: ['dataset_groups', datasetGroupId, 'permission_groups'] as const,
    staleTime: 10 * 1000
  });

const datasetPermissionsOverview = (datasetId: string) =>
  queryOptions<DatasetPermissionsOverviewResponse>({
    queryKey: ['dataset_permissions_overview', datasetId] as const,
    staleTime: 10 * 1000
  });

const datasetPermissionGroupsList = (datasetId: string) =>
  queryOptions<ListDatasetGroupsResponse[]>({
    queryKey: ['dataset_permission_groups_list', datasetId] as const,
    staleTime: 10 * 1000
  });

const datasetPermissionUsersList = (datasetId: string) =>
  queryOptions<ListPermissionUsersResponse[]>({
    queryKey: ['dataset_permission_users_list', datasetId] as const,
    staleTime: 10 * 1000
  });

export const datasetGroupQueryKeys = {
  datasetGroupsList,
  datasetGroupsGet,
  datasetGroupsGetUsers,
  datasetGroupsGetDatasets,
  datasetGroupsGetPermissionGroups,
  datasetPermissionsOverview,
  datasetPermissionGroupsList,
  datasetPermissionUsersList
};
