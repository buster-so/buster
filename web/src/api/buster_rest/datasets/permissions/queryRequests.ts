import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getDatasetPermissionsOverview,
  listDatasetDatasetGroups,
  listIndividualDatasetPermissionGroups,
  updateDatasetPermissionGroups,
  updateDatasetDatasetGroups,
  updateDatasetPermissionUsers,
  listDatasetPermissionUsers,
  getDatasetPermissionsOverview_server
} from './requests';
import { useMemoizedFn } from '@/hooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useGetDatasetPermissionsOverview = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => {
    return getDatasetPermissionsOverview({ dataset_id });
  });

  return useQuery({
    ...queryKeys.datasetPermissionsOverview(dataset_id),
    queryFn
  });
};

export const prefetchGetDatasetPermissionsOverview = async (
  datasetId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.datasetPermissionsOverview(datasetId),
    queryFn: () => getDatasetPermissionsOverview_server(datasetId)
  });
  return queryClient;
};

export const useDatasetListPermissionGroups = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => {
    return listIndividualDatasetPermissionGroups({ dataset_id });
  });

  return useQuery({
    ...queryKeys.datasetPermissionGroupsList(dataset_id),
    queryFn,
    enabled: !!dataset_id
  });
};

export const useDatasetUpdatePermissionGroups = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDatasetPermissionGroups,
    onMutate: ({ dataset_id, groups }) => {
      queryClient.setQueryData(
        queryKeys.datasetPermissionGroupsList(dataset_id).queryKey,
        (oldData) => {
          const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
          for (const { id, assigned } of groups) {
            keyedChanges[id] = { id, assigned };
          }
          const newData =
            oldData?.map((group) => {
              const updatedGroup = keyedChanges[group.id];
              if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
              return group;
            }) || [];
          return newData;
        }
      );
    },
    onSettled: (_, __, { dataset_id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasetPermissionGroupsList(dataset_id).queryKey,
        refetchType: 'all'
      });
    }
  });
};

export const useDatasetListDatasetGroups = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetDatasetGroups({ dataset_id }));

  return useQuery({
    ...queryKeys.datasetGroupsList,
    queryFn,
    enabled: !!dataset_id
  });
};

export const useDatasetListPermissionUsers = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetPermissionUsers({ dataset_id }));

  return useQuery({
    ...queryKeys.datasetPermissionUsersList(dataset_id),
    queryFn,
    enabled: !!dataset_id
  });
};

export const useDatasetUpdateDatasetGroups = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDatasetDatasetGroups,
    onMutate: ({ dataset_id, groups }) => {
      const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
      for (const { id, assigned } of groups) {
        keyedChanges[id] = { id, assigned };
      }
      queryClient.setQueryData(queryKeys.datasetGroupsList.queryKey, (oldData) => {
        return (
          oldData?.map((group) => {
            const updatedGroup = keyedChanges[group.id];
            if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
            return group;
          }) || []
        );
      });
    }
  });
};

export const useDatasetUpdatePermissionUsers = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((users: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    for (const { id, assigned } of users) {
      keyedChanges[id] = { id, assigned };
    }
    queryClient.setQueryData(
      queryKeys.datasetPermissionUsersList(dataset_id).queryKey,
      (oldData) => {
        return (
          oldData?.map((user) => {
            const updatedUser = keyedChanges[user.id];
            if (updatedUser) return { ...user, assigned: updatedUser.assigned };
            return user;
          }) || []
        );
      }
    );
    return updateDatasetPermissionUsers({ dataset_id, users });
  });

  return useMutation({
    mutationFn
  });
};
