import { queryOptions } from '@tanstack/react-query';
import type {
  GetPermissionGroupDatasetGroupsResponse,
  GetPermissionGroupDatasetsResponse,
  GetPermissionGroupResponse,
  GetPermissionGroupUsersResponse,
  ListPermissionGroupsResponse
} from '../asset_interfaces';

const permissionGroupList = queryOptions<ListPermissionGroupsResponse[]>({
  queryKey: ['permission_groups', 'list'] as const,
  staleTime: 10 * 1000
});

const permissionGroup = (id: string) =>
  queryOptions<GetPermissionGroupResponse>({
    queryKey: ['permission_group', id] as const,
    staleTime: 10 * 1000
  });

const permissionGroupListByDatasetId = (id: string) =>
  queryOptions<GetPermissionGroupResponse[]>({
    queryKey: ['permission_groups', 'list', id] as const,
    staleTime: 10 * 1000,
    initialDataUpdatedAt: 0
  });

const permissionGroupUsers = (id: string) =>
  queryOptions<GetPermissionGroupUsersResponse[]>({
    queryKey: ['permission_groups', id, 'users'] as const,
    staleTime: 10 * 1000
  });

const permissionGroupDatasets = (id: string) =>
  queryOptions<GetPermissionGroupDatasetsResponse[]>({
    queryKey: ['permission_groups', id, 'datasets'] as const,
    staleTime: 10 * 1000
  });

const permissionGroupDatasetGroups = (id: string) =>
  queryOptions<GetPermissionGroupDatasetGroupsResponse[]>({
    queryKey: ['permission_groups', id, 'dataset_groups'] as const,
    staleTime: 10 * 1000
  });

export const permissionGroupQueryKeys = {
  permissionGroupList,
  permissionGroupListByDatasetId,
  permissionGroup,
  permissionGroupUsers,
  permissionGroupDatasets,
  permissionGroupDatasetGroups
};
