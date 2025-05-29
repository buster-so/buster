import { useQuery, useMutation } from '@tanstack/react-query';
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
import { useMemoizedFn } from '@/hooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import type { GetPermissionGroupResponse } from '@/api/asset_interfaces/permission_groups';
import { updateDatasetPermissionGroups } from '../datasets';
import type { ListPermissionGroupsResponse } from '../../asset_interfaces';
import { queryKeys } from '@/api/query_keys';

export const useListAllPermissionGroups = () => {
  return useQuery({
    ...queryKeys.permissionGroupList,
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

      queryClient.setQueryData(queryKeys.permissionGroupList.queryKey, (oldData) => {
        const newListItem: ListPermissionGroupsResponse = {
          id: newPermissionGroup.id,
          name: newPermissionGroup.name,
          assigned: false
        };
        if (!oldData) {
          return [newListItem];
        }
        return [...oldData, newListItem];
      });

      if (dataset_id && newPermissionGroup?.id) {
        const options = queryKeys.permissionGroupListByDatasetId(dataset_id);
        queryClient.setQueryData(options.queryKey, (oldData) => {
          const newItem: GetPermissionGroupResponse = { ...newPermissionGroup };
          if (!oldData) {
            return [newItem];
          }
          return [...oldData, newItem];
        });
        await updateDatasetPermissionGroups({
          dataset_id,
          groups: [{ id: newPermissionGroup.id, assigned: true }]
        });
      }

      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userGetUserPermissionsGroups(userId).queryKey,
          exact: true
        });
      }

      return newPermissionGroup;
    }
  );

  return useMutation({
    mutationFn
  });
};

export const useGetPermissionGroup = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroup({ id: permissionGroupId }));
  return useQuery({
    ...queryKeys.permissionGroup(permissionGroupId),
    queryFn
  });
};

export const prefetchPermissionGroup = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.permissionGroup(permissionGroupId),
    queryFn: () => getPermissionGroup_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useDeletePermissionGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePermissionGroup,
    onSuccess: (data, variables, context) => {
      const options = queryKeys.permissionGroupList;
      const queryKey = options.queryKey;
      queryClient.invalidateQueries({ queryKey, exact: true });
      //TODO delete the permission group from the dataset
    }
  });
};

export const useUpdatePermissionGroup = () => {
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(async (params: Parameters<typeof updatePermissionGroups>[0]) => {
    const res = await updatePermissionGroups(params);
    const options = queryKeys.permissionGroupList;
    const queryKey = options.queryKey;
    queryClient.invalidateQueries({ queryKey, exact: true });
    return res;
  });

  return useMutation({
    mutationFn
  });
};

export const useGetPermissionGroupUsers = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupUsers({ id: permissionGroupId }));
  return useQuery({
    ...queryKeys.permissionGroupUsers(permissionGroupId),
    queryFn
  });
};

export const prefetchPermissionGroupUsers = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.permissionGroupUsers(permissionGroupId),
    queryFn: () => getPermissionGroupUsers_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useGetPermissionGroupDatasets = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupDatasets({ id: permissionGroupId }));
  return useQuery({
    ...queryKeys.permissionGroupDatasets(permissionGroupId),
    queryFn
  });
};

export const prefetchPermissionGroupDatasets = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.permissionGroupDatasets(permissionGroupId),
    queryFn: () => getPermissionGroupDatasets_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useGetPermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupDatasetGroups({ id: permissionGroupId }));
  return useQuery({
    ...queryKeys.permissionGroupDatasetGroups(permissionGroupId),
    queryFn
  });
};

export const prefetchPermissionGroupDatasetGroups = async (
  permissionGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.permissionGroupDatasetGroups(permissionGroupId),
    queryFn: () => getPermissionGroupDatasetGroups_server({ id: permissionGroupId })
  });
  return queryClient;
};

export const useUpdatePermissionGroupUsers = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    const options = queryKeys.permissionGroupUsers(permissionGroupId);
    queryClient.setQueryData(options.queryKey, (oldData) => {
      return (oldData || []).map((user) => {
        const userToUpdate = data.find((d) => d.id === user.id);
        if (userToUpdate) {
          return { ...user, assigned: userToUpdate.assigned };
        }
        return user;
      });
    });

    return updatePermissionGroupUsers({ id: permissionGroupId, data });
  });
  return useMutation({
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
      const options = queryKeys.permissionGroupDatasets(permissionGroupId);

      queryClient.setQueryData(options.queryKey, (oldData) => {
        return (oldData || []).map((dataset) => {
          const datasetToUpdate = data.find((d) => d.id === dataset.id);
          if (datasetToUpdate) {
            return { ...dataset, assigned: datasetToUpdate.assigned };
          }
          return dataset;
        });
      });

      return updatePermissionGroupDatasets({ id: permissionGroupId, data });
    }
  );
  return useMutation({
    mutationFn
  });
};

export const useUpdatePermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    const options = queryKeys.permissionGroupDatasetGroups(permissionGroupId);
    queryClient.setQueryData(options.queryKey, (oldData) => {
      return (oldData || []).map((datasetGroup) => {
        const datasetGroupToUpdate = data.find((d) => d.id === datasetGroup.id);
        if (datasetGroupToUpdate) {
          return { ...datasetGroup, assigned: datasetGroupToUpdate.assigned };
        }
        return datasetGroup;
      });
    });
    return updatePermissionGroupDatasetGroups({ id: permissionGroupId, data });
  });
  return useMutation({
    mutationFn
  });
};
