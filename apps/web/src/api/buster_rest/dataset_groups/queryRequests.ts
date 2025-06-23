import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib';
import type {
  GetDatasetGroupDatasetsResponse,
  GetDatasetGroupPermissionGroupsResponse,
  GetDatasetGroupUsersResponse
} from '../../asset_interfaces';
import {
  createDatasetGroup,
  deleteDatasetGroup,
  getDatasetGroup,
  getDatasetGroup_server,
  getDatasetGroupDatasets,
  getDatasetGroupDatasets_server,
  getDatasetGroupPermissionGroups,
  getDatasetGroupPermissionGroups_server,
  getDatasetGroupUsers,
  getDatasetGroupUsers_server,
  listDatasetGroups,
  updateDatasetGroup,
  updateDatasetGroupDatasets,
  updateDatasetGroupPermissionGroups,
  updateDatasetGroupUsers
} from './requests';

export const useListDatasetGroups = () => {
  const queryFn = useMemoizedFn(() => listDatasetGroups());
  return useQuery({
    ...queryKeys.datasetGroupsList,
    queryFn
  });
};

export const useDeleteDatasetGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDatasetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasetGroupsList.queryKey,
        exact: true,
        refetchType: 'all'
      });
    }
  });
};

export const useUpdateDatasetGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDatasetGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasetGroupsList.queryKey,
        exact: true,
        refetchType: 'all'
      });
    }
  });
};

export const useGetDatasetGroup = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroup(datasetId));
  return useQuery({
    ...queryKeys.datasetGroupsGet(datasetId),
    queryFn
  });
};

export const prefetchDatasetGroup = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGet(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
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
          ...queryKeys.datasetPermissionGroupsList(datasetId),
          exact: true,
          refetchType: 'all'
        });
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.datasetGroupsList.queryKey,
        exact: true,
        refetchType: 'all'
      });

      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userGetUserDatasetGroups(userId).queryKey,
          exact: true,
          refetchType: 'all'
        });
      }
      return newDatasetGroup;
    }
  );

  return useMutation({
    mutationFn
  });
};

export const useGetDatasetGroupUsers = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupUsers(datasetGroupId));
  return useQuery({
    ...queryKeys.datasetGroupsGetUsers(datasetGroupId),
    queryFn
  });
};

export const prefetchDatasetGroupUsers = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGetUsers(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDatasetGroupUsers_server(datasetGroupId)
  });
  return queryClient;
};

export const useGetDatasetGroupDatasets = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupDatasets(datasetGroupId));
  return useQuery({
    ...queryKeys.datasetGroupsGetDatasets(datasetGroupId),
    queryFn
  });
};

export const prefetchDatasetGroupDatasets = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGetDatasets(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDatasetGroupDatasets_server(datasetGroupId)
  });
  return queryClient;
};

export const useGetDatasetGroupPermissionGroups = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupPermissionGroups(datasetGroupId));
  return useQuery({
    ...queryKeys.datasetGroupsGetPermissionGroups(datasetGroupId),
    queryFn
  });
};

export const prefetchDatasetGroupPermissionGroups = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGetPermissionGroups(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDatasetGroupPermissionGroups_server(datasetGroupId)
  });
  return queryClient;
};

export const useUpdateDatasetGroupUsers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDatasetGroupUsers,
    onMutate: ({ data, datasetGroupId }) => {
      queryClient.setQueryData(
        queryKeys.datasetGroupsGetUsers(datasetGroupId).queryKey,
        (oldData: GetDatasetGroupUsersResponse[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((user) => {
            const userToUpdate = data.find((d) => d.id === user.id);
            if (userToUpdate) {
              return { ...user, assigned: userToUpdate.assigned };
            }
            return user;
          });
        }
      );
    }
  });
};

export const useUpdateDatasetGroupDatasets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDatasetGroupDatasets,
    onMutate: ({ groups, datasetGroupId }) => {
      queryClient.setQueryData(
        queryKeys.datasetGroupsGetDatasets(datasetGroupId).queryKey,
        (oldData: GetDatasetGroupDatasetsResponse[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((dataset) => {
            const datasetToUpdate = groups.find((d) => d.id === dataset.id);
            if (datasetToUpdate) {
              return { ...dataset, assigned: datasetToUpdate.assigned };
            }
            return dataset;
          });
        }
      );
    }
  });
};

export const useUpdateDatasetGroupPermissionGroups = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDatasetGroupPermissionGroups,
    onMutate: ({ data, datasetGroupId }) => {
      queryClient.setQueryData(
        queryKeys.datasetGroupsGetPermissionGroups(datasetGroupId).queryKey,
        (oldData: GetDatasetGroupPermissionGroupsResponse[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((permissionGroup) => {
            const permissionGroupToUpdate = data.find((d) => d.id === permissionGroup.id);
            if (permissionGroupToUpdate) {
              return { ...permissionGroup, assigned: permissionGroupToUpdate.assigned };
            }
            return permissionGroup;
          });
        }
      );
    }
  });
};
