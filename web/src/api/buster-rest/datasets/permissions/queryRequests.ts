import { useCreateReactQuery, useCreateReactMutation } from '@/api/createReactQuery';
import {
  getDatasetPermissionsOverview,
  listDatasetDatasetGroups,
  listIndividualDatasetPermissionGroups,
  updateDatasetPermissionGroups,
  updateDatasetDatasetGroups,
  updateDatasetPermissionUsers,
  listDatasetPermissionUsers
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { getDatasetPermissionsOverview_server } from './serverRequests';
import { ListPermissionUsersResponse } from './responseInterfaces';
import { PERMISSION_GROUP_QUERY_KEY } from '../../permission_groups';
import { LIST_DATASET_GROUPS_QUERY_KEY } from './config';

export const useGetDatasetPermissionsOverview = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => {
    return getDatasetPermissionsOverview({ dataset_id });
  });

  return useCreateReactQuery({
    queryKey: ['dataset_permissions_overview', dataset_id],
    queryFn
  });
};

export const prefetchGetDatasetPermissionsOverview = async (
  datasetId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['dataset_permissions_overview', datasetId],
    queryFn: () => getDatasetPermissionsOverview_server(datasetId)
  });
  return queryClient;
};

export const useDatasetListPermissionGroups = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => {
    return listIndividualDatasetPermissionGroups({ dataset_id });
  });

  return useCreateReactQuery({
    queryKey: [PERMISSION_GROUP_QUERY_KEY, dataset_id],
    queryFn,
    staleTime: 1000 * 5 // 5 seconds
  });
};

export const useDatasetUpdatePermissionGroups = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((groups: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    groups.forEach(({ id, assigned }) => {
      keyedChanges[id] = { id, assigned };
    });
    queryClient.setQueryData(
      [PERMISSION_GROUP_QUERY_KEY, dataset_id],
      (oldData: ListPermissionUsersResponse[]) => {
        return oldData?.map((group) => {
          const updatedGroup = keyedChanges[group.id];
          if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
          return group;
        });
      }
    );

    return updateDatasetPermissionGroups({ dataset_id, groups });
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useDatasetListDatasetGroups = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetDatasetGroups({ dataset_id }));

  return useCreateReactQuery({
    queryKey: [LIST_DATASET_GROUPS_QUERY_KEY, dataset_id],
    queryFn
  });
};

export const useDatasetListPermissionUsers = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetPermissionUsers({ dataset_id }));

  return useCreateReactQuery({
    queryKey: ['list_permission_users', dataset_id],
    queryFn
  });
};

export const useDatasetUpdateDatasetGroups = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((groups: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    groups.forEach(({ id, assigned }) => {
      keyedChanges[id] = { id, assigned };
    });
    queryClient.setQueryData(
      [LIST_DATASET_GROUPS_QUERY_KEY, dataset_id],
      (oldData: ListPermissionUsersResponse[]) => {
        return oldData?.map((group) => {
          const updatedGroup = keyedChanges[group.id];
          if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
          return group;
        });
      }
    );
    return updateDatasetDatasetGroups({ dataset_id, groups });
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useDatasetUpdatePermissionUsers = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((users: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    users.forEach(({ id, assigned }) => {
      keyedChanges[id] = { id, assigned };
    });
    queryClient.setQueryData(
      ['list_permission_users', dataset_id],
      (oldData: ListPermissionUsersResponse[]) => {
        return oldData?.map((user) => {
          const updatedUser = keyedChanges[user.id];
          if (updatedUser) return { ...user, assigned: updatedUser.assigned };
          return user;
        });
      }
    );
    return updateDatasetPermissionUsers({ dataset_id, users });
  });

  return useCreateReactMutation({
    mutationFn
  });
};
