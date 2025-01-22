import {
  useCreateReactQuery,
  useCreateReactMutation,
  PREFETCH_STALE_TIME
} from '@/api/createReactQuery';
import {
  getPermissionGroup,
  createPermissionGroup,
  deletePermissionGroup,
  listAllPermissionGroups,
  updatePermissionGroups,
  getPermissionGroupUsers,
  getPermissionGroupDatasets,
  getPermissionGroupDatasetGroups,
  updatePermissionGroupUsers,
  updatePermissionGroupDatasets,
  updatePermissionGroupDatasetGroups,
  getPermissionGroupUsers_server,
  getPermissionGroupDatasets_server,
  getPermissionGroupDatasetGroups_server,
  getPermissionGroup_server
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  GetPermissionGroupDatasetGroupsResponse,
  GetPermissionGroupDatasetsResponse,
  GetPermissionGroupResponse,
  GetPermissionGroupUsersResponse
} from './responseInterfaces';
import isEmpty from 'lodash/isEmpty';
import { PERMISSION_GROUP_QUERY_KEY } from './config';
import { ListPermissionGroupsResponse, updateDatasetPermissionGroups } from '../datasets';
import { USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY } from '../users/permissions/config';

export const useListAllPermissionGroups = () => {
  return useCreateReactQuery({
    queryKey: ['permission_groups'],
    queryFn: listAllPermissionGroups
  });
};

export const useCreatePermissionGroup = (userId?: string) => {
  const queryClient = useQueryClient();
  const { mutateAsync: updatePermissionGroups } = useUpdatePermissionGroupDatasets();

  const mutationFn = useMemoizedFn(
    async ({
      name,
      dataset_id,
      datasetsIdsToAssign
    }: Parameters<typeof createPermissionGroup>[0] & {
      dataset_id?: string;
      datasetsIdsToAssign?: string[];
    }) => {
      const newPermissionGroup = await createPermissionGroup({ name });

      if (datasetsIdsToAssign && datasetsIdsToAssign.length > 0) {
        await updatePermissionGroups({
          permissionGroupId: newPermissionGroup.id,
          data: datasetsIdsToAssign.map((id) => ({ id, assigned: true }))
        });
      }

      queryClient.setQueryData(
        [PERMISSION_GROUP_QUERY_KEY],
        (oldData: GetPermissionGroupResponse[]) =>
          isEmpty(oldData) ? [newPermissionGroup] : [...oldData, newPermissionGroup]
      );

      if (dataset_id && newPermissionGroup?.id) {
        queryClient.setQueryData(
          [PERMISSION_GROUP_QUERY_KEY, dataset_id],
          (oldData: ListPermissionGroupsResponse[]) => {
            const newItem: ListPermissionGroupsResponse = {
              id: newPermissionGroup.id,
              name: newPermissionGroup.name,
              assigned: !!dataset_id
            };
            if (isEmpty(oldData)) {
              return [newItem];
            }
            return [...oldData, newItem];
          }
        );
        await updateDatasetPermissionGroups({
          dataset_id,
          groups: [{ id: newPermissionGroup.id, assigned: true }]
        });
      }

      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY(userId)
        });
      }

      return newPermissionGroup;
    }
  );

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetPermissionGroup = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroup({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId],
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchPermissionGroup = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['permission_group', permissionGroupId],
    queryFn: () => getPermissionGroup_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useDeletePermissionGroup = () => {
  const queryClient = useQueryClient();
  return useCreateReactMutation({
    mutationFn: deletePermissionGroup,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['permission_groups'] });
      //TODO delete the permission group from the dataset
    }
  });
};

export const useUpdatePermissionGroup = () => {
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(async (params: Parameters<typeof updatePermissionGroups>[0]) => {
    const res = await updatePermissionGroups(params);
    queryClient.invalidateQueries({ queryKey: ['permission_groups'] });
    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetPermissionGroupUsers = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupUsers({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId, 'users'],
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchPermissionGroupUsers = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['permission_group', permissionGroupId, 'users'],
    queryFn: () => getPermissionGroupUsers_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useGetPermissionGroupDatasets = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupDatasets({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId, 'datasets'],
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchPermissionGroupDatasets = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['permission_group', permissionGroupId, 'datasets'],
    queryFn: () => getPermissionGroupDatasets_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useGetPermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupDatasetGroups({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId, 'dataset_groups'],
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchPermissionGroupDatasetGroups = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['permission_group', permissionGroupId, 'dataset_groups'],
    queryFn: () => getPermissionGroupDatasetGroups_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useUpdatePermissionGroupUsers = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      ['permission_group', permissionGroupId, 'users'],
      (oldData: GetPermissionGroupUsersResponse[]) => {
        return oldData.map((user) => {
          const userToUpdate = data.find((d) => d.id === user.id);
          if (userToUpdate) {
            return { ...user, assigned: userToUpdate.assigned };
          }
          return user;
        });
      }
    );

    return updatePermissionGroupUsers({ id: permissionGroupId, data });
  });
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdatePermissionGroupDatasets = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(
    ({
      permissionGroupId,
      data
    }: {
      permissionGroupId: string;
      data: { id: string; assigned: boolean }[];
    }) => {
      queryClient.setQueryData(
        ['permission_group', permissionGroupId, 'datasets'],
        (oldData: GetPermissionGroupDatasetsResponse[]) => {
          return (oldData || []).map((dataset) => {
            const datasetToUpdate = data.find((d) => d.id === dataset.id);
            if (datasetToUpdate) {
              return { ...dataset, assigned: datasetToUpdate.assigned };
            }
            return dataset;
          });
        }
      );

      return updatePermissionGroupDatasets({ id: permissionGroupId, data });
    }
  );
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdatePermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      ['permission_group', permissionGroupId, 'dataset_groups'],
      (oldData: GetPermissionGroupDatasetGroupsResponse[]) => {
        return oldData.map((datasetGroup) => {
          const datasetGroupToUpdate = data.find((d) => d.id === datasetGroup.id);
          if (datasetGroupToUpdate) {
            return { ...datasetGroup, assigned: datasetGroupToUpdate.assigned };
          }
          return datasetGroup;
        });
      }
    );
    return updatePermissionGroupDatasetGroups({ id: permissionGroupId, data });
  });
  return useCreateReactMutation({
    mutationFn
  });
};
