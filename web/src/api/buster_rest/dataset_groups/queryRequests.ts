import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import {
  listDatasetGroups,
  deleteDatasetGroup,
  createDatasetGroup,
  getDatasetGroup,
  updateDatasetGroup,
  updateDatasetGroupUsers,
  updateDatasetGroupDatasets,
  updateDatasetGroupPermissionGroups,
  getDatasetGroupUsers,
  getDatasetGroupDatasets,
  getDatasetGroupPermissionGroups,
  getDatasetGroup_server,
  getDatasetGroupUsers_server,
  getDatasetGroupDatasets_server,
  getDatasetGroupPermissionGroups_server
} from './requests';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from 'ahooks';
import { LIST_DATASET_GROUPS_QUERY_KEY } from '../datasets/permissions/config';
import { USER_PERMISSIONS_DATASET_GROUPS_QUERY_KEY } from '../users/permissions/config';
import {
  GetDatasetGroupDatasetsResponse,
  GetDatasetGroupPermissionGroupsResponse,
  GetDatasetGroupUsersResponse
} from './responseInterfaces';
import { timeout } from '@/utils';

export const useListDatasetGroups = () => {
  const queryFn = useMemoizedFn(() => listDatasetGroups());
  return useCreateReactQuery({
    queryKey: ['dataset_groups'],
    queryFn
  });
};

export const useDeleteDatasetGroup = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (id: string) => {
    const res = await deleteDatasetGroup(id);
    queryClient.invalidateQueries({ queryKey: ['dataset_groups'] });
    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateDatasetGroup = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (data: Parameters<typeof updateDatasetGroup>[0]) => {
    const res = await updateDatasetGroup(data);
    queryClient.invalidateQueries({ queryKey: ['dataset_groups'] });
    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetDatasetGroup = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroup(datasetId));
  return useCreateReactQuery({
    queryKey: ['dataset_groups', datasetId],
    queryFn
  });
};

export const prefetchDatasetGroup = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['dataset_group', datasetGroupId],
    queryFn: () => getDatasetGroup_server(datasetGroupId)
  });
  return queryClient;
};

export const useCreateDatasetGroup = (datasetId?: string, userId?: string) => {
  const { mutateAsync: updateDatasetGroupDatasets } = useUpdateDatasetGroupDatasets();
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(
    async ({
      datasetsToAdd,
      ...data
    }: Parameters<typeof createDatasetGroup>[0] & { datasetsToAdd?: string[] }) => {
      const newDatasetGroup = await createDatasetGroup(data);
      if (newDatasetGroup?.id && datasetsToAdd?.length) {
        await timeout(200);
        await updateDatasetGroupDatasets({
          datasetGroupId: newDatasetGroup.id,
          groups: datasetsToAdd.map((datasetId) => ({ id: datasetId, assigned: true }))
        });
      }

      if (datasetId) {
        await queryClient.invalidateQueries({
          queryKey: [LIST_DATASET_GROUPS_QUERY_KEY, datasetId]
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['dataset_groups'] });

      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: USER_PERMISSIONS_DATASET_GROUPS_QUERY_KEY(userId)
        });
      }
      return newDatasetGroup;
    }
  );

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetDatasetGroupUsers = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupUsers(datasetGroupId));
  return useCreateReactQuery({
    queryKey: ['dataset_groups', datasetGroupId, 'users'],
    queryFn
  });
};

export const prefetchDatasetGroupUsers = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['dataset_groups', datasetGroupId, 'users'],
    queryFn: () => getDatasetGroupUsers_server(datasetGroupId)
  });
  return queryClient;
};

export const useGetDatasetGroupDatasets = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupDatasets(datasetGroupId));
  return useCreateReactQuery({
    queryKey: ['dataset_groups', datasetGroupId, 'datasets'],
    queryFn
  });
};

export const prefetchDatasetGroupDatasets = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['dataset_groups', datasetGroupId, 'datasets'],
    queryFn: () => getDatasetGroupDatasets_server(datasetGroupId)
  });
  return queryClient;
};

export const useGetDatasetGroupPermissionGroups = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupPermissionGroups(datasetGroupId));
  return useCreateReactQuery({
    queryKey: ['dataset_groups', datasetGroupId, 'permission_groups'],
    queryFn
  });
};

export const prefetchDatasetGroupPermissionGroups = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['dataset_groups', datasetGroupId, 'permission_groups'],
    queryFn: () => getDatasetGroupPermissionGroups_server(datasetGroupId)
  });
  return queryClient;
};

export const useUpdateDatasetGroupUsers = (datasetGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      ['dataset_groups', datasetGroupId, 'users'],
      (oldData: GetDatasetGroupUsersResponse[]) => {
        return oldData.map((user) => {
          const userToUpdate = data.find((d) => d.id === user.id);
          if (userToUpdate) {
            return { ...user, assigned: userToUpdate.assigned };
          }
          return user;
        });
      }
    );
    return updateDatasetGroupUsers(datasetGroupId, data);
  });
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateDatasetGroupDatasets = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(
    ({
      datasetGroupId,
      groups
    }: {
      datasetGroupId: string;
      groups: { id: string; assigned: boolean }[];
    }) => {
      queryClient.setQueryData(
        ['dataset_groups', datasetGroupId, 'datasets'],
        (oldData: GetDatasetGroupDatasetsResponse[]) => {
          return oldData?.map((dataset) => {
            const datasetToUpdate = groups.find((d) => d.id === dataset.id);
            if (datasetToUpdate) {
              return { ...dataset, assigned: datasetToUpdate.assigned };
            }
            return dataset;
          });
        }
      );
      return updateDatasetGroupDatasets(datasetGroupId, groups);
    }
  );
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateDatasetGroupPermissionGroups = (datasetGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      ['dataset_groups', datasetGroupId, 'permission_groups'],
      (oldData: GetDatasetGroupPermissionGroupsResponse[]) => {
        return oldData.map((permissionGroup) => {
          const permissionGroupToUpdate = data.find((d) => d.id === permissionGroup.id);
          if (permissionGroupToUpdate) {
            return { ...permissionGroup, assigned: permissionGroupToUpdate.assigned };
          }
          return permissionGroup;
        });
      }
    );
    return updateDatasetGroupPermissionGroups(datasetGroupId, data);
  });
  return useCreateReactMutation({
    mutationFn
  });
};
